import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { MailSettings } from '@cabin/database';
import { Resend } from 'resend';

import { PrismaService } from '../prisma/prisma.service';
import type { UpdateMailSettingsDto } from './dto/mail-settings.dto';
import {
  formatDate,
  formatPrice,
  renderEmail,
  renderText,
  type EmailContent,
} from './templates';

/** The one and only settings row. */
const SETTINGS_ID = 'mail';

const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';

type OutgoingMail = EmailContent & {
  to: string;
  subject: string;
  replyTo?: string;
};

export type BookingMail = {
  reference: string;
  guestName: string;
  guestEmail: string;
  spaceName: string;
  /** ISO dates, both inclusive. */
  startDate: string;
  endDate: string;
  guests: number;
  total: number;
  cancelToken?: string;
};

export type ContactMail = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
};

/**
 * Everything the association sends by e-post goes through here. Resend does
 * the actual delivery; the key and the addresses live in the database so the
 * board can manage them under Innstillinger → E-post.
 *
 * Domain code fires mail through the notify* methods, which never throw:
 * a booking must go through even when the mail bounces. They do return
 * promises that callers should await, because on serverless hosts the
 * process can be frozen right after the response is sent.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Settings -------------------------------------------------------------

  /** The dashboard's view. The key itself never leaves the server. */
  async getSettings() {
    const settings = await this.load();
    return toView(settings);
  }

  async updateSettings(dto: UpdateMailSettingsDto) {
    const data = {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.fromName !== undefined ? { fromName: dto.fromName } : {}),
      ...(dto.fromEmail !== undefined ? { fromEmail: dto.fromEmail } : {}),
      ...(dto.notifyEmail !== undefined ? { notifyEmail: dto.notifyEmail || null } : {}),
      // An empty key field means "keep the one that is stored".
      ...(dto.apiKey ? { apiKey: dto.apiKey } : {}),
    };

    const settings = await this.prisma.mailSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    return toView(settings);
  }

  // --- Sending --------------------------------------------------------------

  /**
   * The "send a test" button. Unlike the notify* methods this one throws, so
   * whoever pressed it can read what Resend did not like.
   */
  async sendTest(to: string) {
    const settings = await this.load();

    if (!settings?.apiKey) {
      throw new BadRequestException('Legg inn en Resend API-nøkkel og lagre først');
    }

    const id = await this.dispatch(settings, {
      to,
      subject: 'Test fra Ølberg strandhager',
      heading: 'E-posten er satt opp riktig',
      lines: [
        'Dette er en testmelding sendt fra dashbordet til Ølberg strandhager.',
        'Når du leser dette, er Resend-oppsettet i orden og nettsiden kan sende e-post.',
      ],
      facts: [
        ['Avsender', `${settings.fromName} <${settings.fromEmail}>`],
        ['Sendt', new Date().toLocaleString('nb-NO')],
      ],
    });

    return { sent: true, id };
  }

  /** Confirmation to the guest, and a heads-up to the board. */
  async notifyBookingRequested(booking: BookingMail): Promise<void> {
    const facts = bookingFacts(booking);

    const guest = this.fire({
      to: booking.guestEmail,
      subject: `Vi har mottatt bookingforespørselen din (${booking.reference})`,
      heading: `Takk, ${booking.guestName}!`,
      lines: [
        `Vi har mottatt forespørselen din om å leie ${booking.spaceName}. Dagene holdes av for deg mens vi behandler den, og du hører fra oss så snart den er bekreftet.`,
        'Du betaler først etter at leien er bekreftet.',
      ],
      facts,
      action: booking.cancelToken
        ? {
            label: 'Se eller avbestill bookingen',
            url: `${WEB_URL}/booking/${booking.reference}?token=${booking.cancelToken}`,
          }
        : undefined,
    });

    const board = this.fireToBoard({
      subject: `Ny bookingforespørsel: ${booking.spaceName} ${formatDate(booking.startDate)}`,
      heading: 'Ny bookingforespørsel',
      lines: [
        `${booking.guestName} har sendt en forespørsel om å leie ${booking.spaceName}. Åpne dashbordet for å bekrefte eller avslå den.`,
      ],
      facts,
      replyTo: booking.guestEmail,
    });

    await Promise.all([guest, board]);
  }

  /** Sent when the dashboard confirms, declines or calls off a booking. */
  async notifyBookingDecision(
    booking: BookingMail,
    decision: 'CONFIRMED' | 'DECLINED' | 'CANCELLED',
  ): Promise<void> {
    const facts = bookingFacts(booking);

    const content: Record<typeof decision, { subject: string; heading: string; lines: string[] }> =
      {
        CONFIRMED: {
          subject: `Bookingen din er bekreftet (${booking.reference})`,
          heading: 'Bookingen er bekreftet',
          lines: [
            `${booking.spaceName} er nå reservert for deg. Vi gleder oss til å ta imot dere!`,
            'Informasjon om betaling får du fra oss på e-post.',
          ],
        },
        DECLINED: {
          subject: `Bookingforespørselen kunne ikke tas imot (${booking.reference})`,
          heading: 'Vi kunne dessverre ikke ta imot bookingen',
          lines: [
            `Forespørselen din om å leie ${booking.spaceName} kunne dessverre ikke tas imot denne gangen.`,
            'Ta gjerne kontakt med oss om du vil prøve andre datoer.',
          ],
        },
        CANCELLED: {
          subject: `Bookingen din er avbestilt (${booking.reference})`,
          heading: 'Bookingen er avbestilt',
          lines: [
            `Bookingen av ${booking.spaceName} er avbestilt, og dagene er frigitt.`,
            'Du er alltid velkommen til å booke på nytt.',
          ],
        },
      };

    await this.fire({ to: booking.guestEmail, ...content[decision], facts });
  }

  /** The guest used their own cancellation link; the board should know. */
  async notifyBookingCancelledByGuest(booking: BookingMail): Promise<void> {
    const guest = this.notifyBookingDecision(booking, 'CANCELLED');

    const board = this.fireToBoard({
      subject: `Avbestilt av gjesten: ${booking.spaceName} ${formatDate(booking.startDate)}`,
      heading: 'En booking er avbestilt',
      lines: [
        `${booking.guestName} har avbestilt bookingen sin av ${booking.spaceName}. Dagene er frigitt i kalenderen.`,
      ],
      facts: bookingFacts(booking),
      replyTo: booking.guestEmail,
    });

    await Promise.all([guest, board]);
  }

  /** Someone joined the waitlist from the website. */
  async notifyWaitlistJoined(entry: {
    firstName: string;
    lastName: string;
    email: string;
    position: number;
  }): Promise<void> {
    const member = this.fire({
      to: entry.email,
      subject: 'Du står på ventelisten for parsell',
      heading: `Velkommen, ${entry.firstName}!`,
      lines: [
        `Du står nå på ventelisten for en parsell i Ølberg strandhager, og du er nummer ${entry.position} i køen.`,
        'Vi tar kontakt på denne e-postadressen når det blir en parsell ledig. Du trenger ikke å foreta deg noe mer.',
      ],
    });

    const board = this.fireToBoard({
      subject: `Ny på ventelisten: ${entry.firstName} ${entry.lastName}`,
      heading: 'Ny på ventelisten',
      lines: [
        `${entry.firstName} ${entry.lastName} har meldt seg på ventelisten via nettsiden. Se dashbordet for detaljene.`,
      ],
      replyTo: entry.email,
    });

    await Promise.all([member, board]);
  }

  /** A message came in through the contact form. */
  async notifyContactMessage(contact: ContactMail): Promise<void> {
    await this.fireToBoard({
      subject: contact.subject
        ? `Henvendelse: ${contact.subject}`
        : `Ny henvendelse fra ${contact.name}`,
      heading: `Melding fra ${contact.name}`,
      lines: [contact.message],
      facts: [
        ['Navn', contact.name],
        ['E-post', contact.email],
        ...(contact.phone ? ([['Telefon', contact.phone]] as [string, string][]) : []),
      ],
      replyTo: contact.email,
    });
  }

  // --- Internals ------------------------------------------------------------

  private load(): Promise<MailSettings | null> {
    return this.prisma.mailSettings.findUnique({ where: { id: SETTINGS_ID } });
  }

  /** Never rejects: domain code must never fail because mail did. */
  private fire(mail: OutgoingMail): Promise<void> {
    return this.send(mail).catch((cause) => {
      this.logger.error(`Kunne ikke sende «${mail.subject}» til ${mail.to}`, cause);
    });
  }

  /** Same, but addressed to the board's notification address. */
  private fireToBoard(mail: Omit<OutgoingMail, 'to'>): Promise<void> {
    return this.load()
      .then((settings) => {
        if (!settings?.notifyEmail) return;
        return this.send({ ...mail, to: settings.notifyEmail }, settings);
      })
      .catch((cause) => {
        this.logger.error(`Kunne ikke varsle styret: «${mail.subject}»`, cause);
      });
  }

  private async send(mail: OutgoingMail, preloaded?: MailSettings): Promise<void> {
    const settings = preloaded ?? (await this.load());

    if (!settings?.enabled || !settings.apiKey) {
      this.logger.log(`E-post er avslått, hopper over «${mail.subject}» til ${mail.to}`);
      return;
    }

    await this.dispatch(settings, mail);
  }

  /** The actual Resend call. Throws so callers decide what a failure means. */
  private async dispatch(settings: MailSettings, mail: OutgoingMail): Promise<string> {
    const resend = new Resend(settings.apiKey!);

    const { data, error } = await resend.emails.send({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: mail.to,
      subject: mail.subject,
      replyTo: mail.replyTo,
      html: renderEmail(mail),
      text: renderText(mail),
    });

    if (error) {
      throw new BadRequestException(`Resend: ${error.message}`);
    }

    this.logger.log(`Sendte «${mail.subject}» til ${mail.to} (${data?.id})`);
    return data?.id ?? '';
  }
}

function bookingFacts(booking: BookingMail): [string, string][] {
  return [
    ['Referanse', booking.reference],
    ['Dager', `${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}`],
    ['Antall gjester', String(booking.guests)],
    ['Totalpris', formatPrice(booking.total)],
  ];
}

/** What the browser gets: everything except the key, plus a hint of it. */
function toView(settings: MailSettings | null) {
  return {
    enabled: settings?.enabled ?? false,
    fromName: settings?.fromName ?? 'Ølberg strandhager',
    fromEmail: settings?.fromEmail ?? 'onboarding@resend.dev',
    notifyEmail: settings?.notifyEmail ?? null,
    hasApiKey: Boolean(settings?.apiKey),
    apiKeyHint: settings?.apiKey ? `…${settings.apiKey.slice(-4)}` : null,
  };
}
