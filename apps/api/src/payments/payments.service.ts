import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus, type Prisma } from '@cabin/database';
import * as QRCode from 'qrcode';

import { toAdminView } from '../bookings/bookings.serializer';
import { toIsoDate } from '../common/dates';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { VippsService } from './vipps.service';

/** Same slice of related records as the bookings module loads. */
const INCLUDE = {
  space: { select: { slug: true, name: true } },
  guest: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
    },
  },
} satisfies Prisma.BookingInclude;

const WEB_URL = (process.env.WEB_URL ?? process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/** What the confirmation e-mail needs: the pay link and a QR of the same link. */
export type BookingPayment = {
  url: string;
  qr?: Buffer;
};

/** The slice of a booking the payment flow needs. */
type PayableBooking = {
  id: string;
  reference: string;
  cancelToken: string;
  total: number;
  startDate: Date;
  endDate: Date;
  space: { name: string };
  guest: { phone: string | null };
};

/** The fields we read from a Vipps webhook event. */
type VippsWebhookEvent = {
  reference?: unknown;
  name?: unknown;
  success?: unknown;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vipps: VippsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Creates a Vipps payment for a freshly confirmed booking, so the pay link
   * and QR code can go into the confirmation e-mail. Never throws: the
   * confirmation must go through even when Vipps is down or unconfigured.
   */
  async paymentForBooking(booking: PayableBooking): Promise<BookingPayment | undefined> {
    if (!this.vipps.configured) {
      this.logger.log('Vipps er ikke konfigurert, hopper over betalingslenke');
      return undefined;
    }

    try {
      // The booking reference alone is too short for Vipps (min 8 chars), and
      // a re-confirmed booking needs a fresh reference, hence the suffix.
      const reference = `strandhager-${booking.reference}-${Date.now().toString(36)}`;

      const { redirectUrl } = await this.vipps.createPayment({
        reference,
        amountNok: booking.total,
        description: `Leie av ${booking.space.name} (${booking.reference})`,
        returnUrl: `${WEB_URL}/booking/${booking.reference}?token=${booking.cancelToken}`,
        phoneNumber: booking.guest.phone ? toMsisdn(booking.guest.phone) : undefined,
      });

      // Stored so the webhook can trace the payment back to the booking.
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { paymentReference: reference },
      });

      const qr = await QRCode.toBuffer(redirectUrl, {
        type: 'png',
        width: 360,
        margin: 2,
      }).catch(() => undefined);

      return { url: redirectUrl, qr };
    } catch (cause) {
      this.logger.error(
        `Kunne ikke opprette Vipps-betaling for booking ${booking.reference}`,
        cause,
      );
      return undefined;
    }
  }

  /**
   * The dashboard's refund button: sends the full amount back through Vipps
   * and marks the booking as refunded. Unlike the flows above this one
   * throws, so the administrator can read exactly what went wrong.
   */
  async refundBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Fant ingen booking med denne id-en');
    }

    if (!booking.paymentReference) {
      throw new BadRequestException(
        'Bookingen har ingen Vipps-betaling å refundere. Er den betalt på annen måte, sett betalingsstatusen manuelt.',
      );
    }

    if (booking.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Betalingen er allerede refundert.');
    }

    if (booking.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Bookingen er ikke registrert som betalt via Vipps.');
    }

    if (!this.vipps.configured) {
      throw new BadRequestException('Vipps er ikke konfigurert på serveren.');
    }

    try {
      await this.vipps.refundPayment(booking.paymentReference, booking.total);
    } catch (cause) {
      this.logger.error(`Refusjon feilet for booking ${booking.reference}`, cause);
      throw new BadRequestException(
        'Vipps godtok ikke refusjonen. Prøv igjen, eller refunder fra Vipps-portalen.',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: PaymentStatus.REFUNDED },
      include: INCLUDE,
    });

    this.logger.log(`Refunderte ${booking.total} kr for booking ${booking.reference}`);

    await this.notifications.notifyPaymentRefunded({
      reference: updated.reference,
      guestName: `${updated.guest.firstName} ${updated.guest.lastName}`,
      guestEmail: updated.guest.email,
      spaceName: updated.space.name,
      startDate: toIsoDate(updated.startDate),
      endDate: toIsoDate(updated.endDate),
      guests: updated.guests,
      total: updated.total,
    });

    return toAdminView(updated);
  }

  /**
   * A payment changed state at Vipps. Capture the money when the customer has
   * approved it, and mark the booking as paid.
   */
  async handleVippsEvent(event: VippsWebhookEvent): Promise<void> {
    const reference = typeof event.reference === 'string' ? event.reference : null;
    if (!reference) return;

    const booking = await this.prisma.booking.findFirst({
      where: { paymentReference: reference },
      select: { id: true, reference: true, total: true, paymentStatus: true },
    });

    if (!booking) {
      this.logger.warn(`Vipps-webhook for ukjent betaling ${reference}`);
      return;
    }

    const name = String(event.name ?? '').toUpperCase();
    this.logger.log(`Vipps-webhook ${name} for booking ${booking.reference}`);

    // A refund done straight in the Vipps portal should show up here too.
    if (name === 'REFUNDED') {
      await this.setPaymentStatus(booking.id, PaymentStatus.REFUNDED);
      return;
    }

    if (booking.paymentStatus === PaymentStatus.PAID) return;

    if (name === 'AUTHORIZED' && event.success !== false) {
      // The customer approved in the app; the money must be captured before
      // it actually moves.
      try {
        await this.vipps.capturePayment(reference, booking.total);
      } catch (cause) {
        this.logger.error(`Kunne ikke kreve inn Vipps-betaling ${reference}`, cause);
        return;
      }
      await this.setPaymentStatus(booking.id, PaymentStatus.PAID);
      return;
    }

    if (name === 'CAPTURED') {
      await this.setPaymentStatus(booking.id, PaymentStatus.PAID);
    }
  }

  private async setPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<void> {
    await this.prisma.booking.update({ where: { id }, data: { paymentStatus } });
  }
}

/**
 * Norwegian phone number to MSISDN format (4792926666), which Vipps uses to
 * prefill the payment page. Returns undefined when the number does not look
 * usable — the customer can always type it themselves.
 */
function toMsisdn(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  if (digits.length === 8) return `47${digits}`;
  if (digits.length === 10 && digits.startsWith('47')) return digits;
  return undefined;
}
