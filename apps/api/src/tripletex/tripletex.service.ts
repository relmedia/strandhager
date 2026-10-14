import { Injectable, Logger } from '@nestjs/common';
import { BookingStatus, PaymentStatus, type Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import { TripletexClient, TripletexError } from './tripletex.client';

const INCLUDE = { guest: true, space: true } satisfies Prisma.BookingInclude;
type SyncedBooking = Prisma.BookingGetPayload<{ include: typeof INCLUDE }>;

type Invoice = { id: number; invoiceNumber: number };

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const today = () => isoDate(new Date());

const formatDate = (date: Date) =>
  date.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/**
 * Keeps Tripletex in step with the bookings: a confirmed booking becomes an
 * invoice, a Vipps payment is registered on it, and a refund or cancellation
 * turns into a credit note.
 *
 * Everything goes through `sync`, which compares what Tripletex has (the ids
 * stored on the booking) with what the booking says and does only the missing
 * steps. That makes it safe to call from every event and from the dashboard's
 * retry button, and it never throws: a failure is stored on the booking for
 * the dashboard to show, because a Tripletex hiccup must never stop a booking
 * from being confirmed or a payment from being recorded.
 */
@Injectable()
export class TripletexService {
  private readonly logger = new Logger(TripletexService.name);

  /** Webhooks and dashboard clicks can overlap; one sync per booking at a time. */
  private readonly running = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly client: TripletexClient,
  ) {}

  /** Brings the booking's Tripletex records up to date. Never throws. */
  async sync(bookingId: string): Promise<void> {
    const previous = this.running.get(bookingId) ?? Promise.resolve();
    const next = previous.then(() => this.syncNow(bookingId));
    this.running.set(bookingId, next);
    try {
      await next;
    } finally {
      if (this.running.get(bookingId) === next) this.running.delete(bookingId);
    }
  }

  /** The same as `sync`, but reports the outcome; for the dashboard's button. */
  async syncAndReport(bookingId: string): Promise<{ ok: boolean; error: string | null }> {
    if (!(await this.client.isActive())) {
      return { ok: false, error: 'Tripletex er ikke slått på under Innstillinger → Regnskap.' };
    }
    await this.sync(bookingId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { tripletexError: true },
    });
    return { ok: !booking?.tripletexError, error: booking?.tripletexError ?? null };
  }

  private async syncNow(bookingId: string): Promise<void> {
    try {
      if (!(await this.client.isActive())) return;

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: INCLUDE,
      });
      if (!booking) return;

      // Only progress clears an error: a message about something that has to be
      // fixed by hand in Tripletex must survive a retry that finds nothing to do.
      if (await this.reconcile(booking)) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { tripletexError: null, tripletexSyncedAt: new Date() },
        });
      }
    } catch (cause) {
      const message =
        cause instanceof TripletexError
          ? cause.message
          : `Uventet feil mot Tripletex: ${cause instanceof Error ? cause.message : String(cause)}`;
      this.logger.warn(`Tripletex-synk feilet for booking ${bookingId}: ${message}`);
      await this.prisma.booking
        .update({ where: { id: bookingId }, data: { tripletexError: message.slice(0, 500) } })
        .catch(() => undefined);
    }
  }

  /** Does the missing steps in order. Returns whether anything was sent. */
  private async reconcile(booking: SyncedBooking): Promise<boolean> {
    let changed = false;
    const paidOrRefunded =
      booking.paymentStatus === PaymentStatus.PAID ||
      booking.paymentStatus === PaymentStatus.REFUNDED;
    const confirmed =
      booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED;

    // 1. Invoice: once confirmed, or as soon as money has come in.
    if (!booking.tripletexInvoiceId && (confirmed || paidOrRefunded)) {
      const invoice = await this.createInvoice(booking);
      booking.tripletexInvoiceId = invoice.id;
      booking.tripletexInvoiceNumber = String(invoice.invoiceNumber);
      changed = true;
    }
    if (!booking.tripletexInvoiceId) return changed;

    // 2. Payment: only Vipps payments; anything paid another way the board
    //    registers in Tripletex itself, where it was received.
    if (paidOrRefunded && booking.paymentReference && !booking.tripletexPaymentSynced) {
      await this.registerPayment(booking.tripletexInvoiceId, booking.total);
      booking.tripletexPaymentSynced = true;
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { tripletexPaymentSynced: true },
      });
      changed = true;
    }

    // 3. Credit note: the money went back, or the booking fell through unpaid.
    const refunded = booking.paymentStatus === PaymentStatus.REFUNDED;
    const fellThroughUnpaid =
      (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.DECLINED) &&
      booking.paymentStatus === PaymentStatus.UNPAID;

    if (!booking.tripletexCreditNoteId && (refunded || fellThroughUnpaid)) {
      await this.creditInvoice(booking, refunded);
      changed = true;
    }

    return changed;
  }

  private async customerId(booking: SyncedBooking): Promise<number> {
    const { guest } = booking;
    if (guest.tripletexCustomerId) return guest.tripletexCustomerId;

    // A guest who has booked before may already be in Tripletex, also if the
    // board typed them in by hand.
    const [existing] = await this.client.many<{ id: number }>('/customer', {
      email: guest.email,
      fields: 'id',
      count: 1,
    });

    const id =
      existing?.id ??
      (
        await this.client.post<{ value: { id: number } }>('/customer', {
          name: guest.company || `${guest.firstName} ${guest.lastName}`.trim(),
          email: guest.email,
          invoiceEmail: guest.email,
          ...(guest.phone ? { phoneNumberMobile: guest.phone } : {}),
          isCustomer: true,
          isPrivateIndividual: !guest.company,
          invoiceSendMethod: 'EMAIL',
        })
      ).value.id;

    await this.prisma.guest.update({ where: { id: guest.id }, data: { tripletexCustomerId: id } });
    return id;
  }

  /** One request creates the order and its invoice, so a retry can never leave a stray order. */
  private async createInvoice(booking: SyncedBooking): Promise<Invoice> {
    const settings = await this.client.settings();
    if (!settings?.vatTypeId) {
      throw new TripletexError('Velg MVA-type under Innstillinger → Regnskap før bookinger kan faktureres.');
    }

    const customer = { id: await this.customerId(booking) };
    const vatType = { id: settings.vatTypeId };
    const period = `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`;

    const lines: { description: string; amount: number }[] = [
      { description: `Leie av ${booking.space.name}, ${period}`, amount: booking.dayTotal },
      { description: 'Vask', amount: booking.cleaningFee },
      { description: 'Oppsett', amount: booking.setupFee },
      { description: `Rabatt ${booking.discountPercent} %`, amount: -booking.discountAmount },
    ].filter((line) => line.amount !== 0);

    // The booking's total is what the guest was told; Tripletex must agree.
    const sum = lines.reduce((total, line) => total + line.amount, 0);
    if (sum !== booking.total) {
      lines.push({ description: 'Justering', amount: booking.total - sum });
    }

    const invoiceDate = new Date();
    const due = new Date(invoiceDate.getTime() + settings.dueDays * 24 * 60 * 60 * 1000);

    const { value } = await this.client.post<{ value: Invoice }>(
      '/invoice',
      {
        invoiceDate: isoDate(invoiceDate),
        invoiceDueDate: isoDate(due),
        customer,
        orders: [
          {
            customer,
            orderDate: isoDate(invoiceDate),
            deliveryDate: isoDate(booking.endDate),
            reference: booking.reference,
            invoiceComment: `Booking ${booking.reference}`,
            // Booking prices are what the guest pays, VAT included if any.
            isPrioritizeAmountsIncludingVat: true,
            orderLines: lines.map((line) => ({
              description: line.description,
              count: 1,
              unitPriceIncludingVatCurrency: line.amount,
              vatType,
            })),
          },
        ],
      },
      { sendToCustomer: settings.sendInvoice, fields: 'id,invoiceNumber' },
    );

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        tripletexInvoiceId: value.id,
        tripletexInvoiceNumber: String(value.invoiceNumber),
      },
    });

    this.logger.log(`Booking ${booking.reference} fakturert i Tripletex (faktura ${value.invoiceNumber})`);
    return value;
  }

  private async registerPayment(invoiceId: number, amount: number): Promise<void> {
    const settings = await this.client.settings();
    if (!settings?.paymentTypeId) {
      throw new TripletexError(
        'Velg innbetalingstype under Innstillinger → Regnskap før Vipps-betalinger kan registreres.',
      );
    }

    await this.client.put(`/invoice/${invoiceId}/:payment`, {
      paymentDate: today(),
      paymentTypeId: settings.paymentTypeId,
      paidAmount: amount,
    });
  }

  /**
   * Credits the whole invoice. When the money was paid back through Vipps the
   * refund is registered on the credit note as well, so the customer's
   * balance in Tripletex ends at zero, the same as in Vipps.
   */
  private async creditInvoice(booking: SyncedBooking, refunded: boolean): Promise<void> {
    const reason = refunded ? 'Refundert via Vipps' : 'Bookingen ble avlyst';
    const { value } = await this.client.put<{ value: { id: number } }>(
      `/invoice/${booking.tripletexInvoiceId}/:createCreditNote`,
      { date: today(), comment: `${reason} (${booking.reference})`, sendToCustomer: false },
    );

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { tripletexCreditNoteId: value.id },
    });

    if (refunded && booking.tripletexPaymentSynced) {
      try {
        await this.registerPayment(value.id, -booking.total);
      } catch (cause) {
        // The credit note stands; a retry would not redo this half.
        throw new TripletexError(
          `Kreditnota er laget, men tilbakebetalingen må registreres for hånd i Tripletex. ${
            cause instanceof Error ? cause.message : ''
          }`.trim(),
        );
      }
    }
  }
}
