import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, CancelledBy, type Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { assertBookableRange, priceOrThrow } from '../pricing/pricing.service';
import {
  addDays,
  daysBetween,
  parseIsoDate,
  toIsoDate,
  todayIso,
  type IsoDate,
} from '../common/dates';
import { findOverlappingBlackouts } from '../blackouts/overlap';
import {
  NotificationsService,
  type BookingMail,
} from '../notifications/notifications.service';
import { BLOCKING_STATUSES, findOverlapping } from './overlap';
import { generateCancelToken, generateReference } from './reference';
import { toAdminView, toGuestView, type BookingRecord } from './bookings.serializer';
import type { CreateBookingDto } from './dto/create-booking.dto';
import type { UpdateBookingDto } from './dto/update-booking.dto';
import type { ListBookingsDto } from './dto/list-bookings.dto';

const INCLUDE = {
  space: { select: { slug: true, name: true } },
  guest: {
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
    },
  },
} satisfies Prisma.BookingInclude;

/** Statuses that mean the booking is over, one way or another. */
const CLOSED_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.DECLINED,
  BookingStatus.COMPLETED,
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
    private readonly notifications: NotificationsService,
  ) {}

  // --- Public -------------------------------------------------------------

  /**
   * Registers a booking request. The days are held from this moment on, but
   * nothing is confirmed until someone accepts it in the dashboard.
   */
  async create(dto: CreateBookingDto) {
    const space = await this.spaces.findBySlug(dto.space);
    const { start, end } = assertBookableRange(
      dto.startDate,
      dto.endDate,
      space.maxBookingDays,
    );

    if (!space.active) {
      throw new BadRequestException(`${space.name} kan ikke bookes for øyeblikket`);
    }

    const earliest = addDays(todayIso(), space.noticeDays);
    if (daysBetween(earliest, start) < 0) {
      throw new BadRequestException(
        space.noticeDays === 0
          ? 'Datoen har allerede vært'
          : `Booking må gjøres minst ${space.noticeDays} dager i forkant. Første ledige dato er ${earliest}.`,
      );
    }

    if (dto.guests > space.maxGuests) {
      throw new BadRequestException(
        `${space.name} har plass til inntil ${space.maxGuests} personer`,
      );
    }

    const quote = priceOrThrow(space.rates, space.cleaningFee, start, end);

    // Serializable keeps two people from slipping through the free-days check
    // at the same time and both booking the same weekend.
    const booking = await this.prisma.$transaction(
      async (tx) => {
        const clashes = await findOverlapping(tx, space.id, start, end);
        if (clashes.length > 0) {
          throw new ConflictException(
            'Én eller flere av dagene er allerede opptatt. Velg en annen dato.',
          );
        }

        // Days the dashboard has closed are held here too, not only hidden in
        // the calendar, so they cannot be booked straight through the API.
        const shut = await findOverlappingBlackouts(tx, space.id, start, end);
        if (shut.length > 0) {
          throw new ConflictException(
            'Felleshuset er stengt én eller flere av disse dagene. Velg en annen dato.',
          );
        }

        const guest = await upsertGuest(tx, dto);

        return createWithReference(tx, {
          spaceId: space.id,
          guestId: guest.id,
          startDate: parseIsoDate(start),
          endDate: parseIsoDate(end),
          guests: dto.guests,
          purpose: dto.purpose ?? null,
          message: dto.message ?? null,
          dayTotal: quote.dayTotal,
          cleaningFee: quote.cleaningFee,
          total: quote.total,
          // The DTO guarantees the box was ticked before we get here.
          termsAcceptedAt: new Date(),
          signature: dto.signature,
        });
      },
      { isolationLevel: 'Serializable' },
    );

    await this.notifications.notifyBookingRequested(toMail(booking));

    return {
      booking: toGuestView(booking),
      quote,
      /** Only ever returned here, so the guest can keep their cancel link. */
      cancelToken: booking.cancelToken,
    };
  }

  /** Looks a booking up from the guest's link. */
  async findByReference(reference: string, token: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { reference: reference.toUpperCase() },
      include: INCLUDE,
    });

    // Same error either way, so the endpoint cannot be used to probe for
    // valid references.
    if (!booking || !token || booking.cancelToken !== token) {
      throw new NotFoundException('Fant ingen booking med denne lenken');
    }

    return {
      booking: toGuestView(booking),
      cancellable: isCancellable(booking),
    };
  }

  async cancelByToken(reference: string, token: string, reason?: string) {
    const { booking } = await this.loadForGuest(reference, token);

    if (CLOSED_STATUSES.includes(booking.status)) {
      throw new BadRequestException('Denne bookingen er allerede avsluttet');
    }

    if (daysBetween(todayIso(), toIsoDate(booking.startDate)) < 0) {
      throw new BadRequestException(
        'Leieperioden har allerede startet. Ta kontakt med oss for å avbestille.',
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: CancelledBy.GUEST,
        cancelReason: reason ?? null,
      },
      include: INCLUDE,
    });

    await this.notifications.notifyBookingCancelledByGuest(toMail(updated));

    return { booking: toGuestView(updated), cancellable: false };
  }

  // --- Dashboard ----------------------------------------------------------

  async findAll(query: ListBookingsDto) {
    const where: Prisma.BookingWhereInput = {};

    if (query.space) where.space = { slug: query.space };
    if (query.status) where.status = query.status;
    if (query.from) where.endDate = { gte: parseIsoDate(query.from) };
    if (query.to) where.startDate = { lte: parseIsoDate(query.to) };

    if (query.q) {
      const contains = query.q.trim();
      where.OR = [
        { reference: { contains: contains.toUpperCase() } },
        { guest: { firstName: { contains, mode: 'insensitive' } } },
        { guest: { lastName: { contains, mode: 'insensitive' } } },
        { guest: { email: { contains, mode: 'insensitive' } } },
        { guest: { company: { contains, mode: 'insensitive' } } },
      ];
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      include: INCLUDE,
      orderBy: { startDate: 'asc' },
      take: query.take ?? 200,
    });

    return bookings.map(toAdminView);
  }

  /** Counts per status, for the dashboard filter chips. */
  async summary(space?: string) {
    const grouped = await this.prisma.booking.groupBy({
      by: ['status'],
      where: space ? { space: { slug: space } } : undefined,
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      Object.values(BookingStatus).map((status) => [status, 0]),
    ) as Record<BookingStatus, number>;

    for (const row of grouped) {
      counts[row.status] = row._count._all;
    }

    return counts;
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!booking) {
      throw new NotFoundException('Fant ingen booking med denne id-en');
    }

    return toAdminView(booking);
  }

  async update(id: string, dto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      include: { space: { include: { rates: { orderBy: { position: 'asc' } } } } },
    });

    if (!existing) {
      throw new NotFoundException('Fant ingen booking med denne id-en');
    }

    const data: Prisma.BookingUpdateInput = {};

    if (dto.guests !== undefined) data.guests = dto.guests;
    if (dto.purpose !== undefined) data.purpose = dto.purpose;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.paymentStatus !== undefined) data.paymentStatus = dto.paymentStatus;

    const movingDates = dto.startDate !== undefined || dto.endDate !== undefined;
    const start = dto.startDate ?? toIsoDate(existing.startDate);
    const end = dto.endDate ?? toIsoDate(existing.endDate);

    if (movingDates) {
      const range = assertBookableRange(start, end, existing.space.maxBookingDays);
      const quote = priceOrThrow(
        existing.space.rates,
        existing.space.cleaningFee,
        range.start,
        range.end,
      );

      data.startDate = parseIsoDate(range.start);
      data.endDate = parseIsoDate(range.end);
      data.dayTotal = quote.dayTotal;
      data.cleaningFee = quote.cleaningFee;
      data.total = quote.total;
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      applyStatusChange(data, dto.status, dto.cancelReason);
    } else if (dto.cancelReason !== undefined) {
      data.cancelReason = dto.cancelReason;
    }

    const nextStatus = dto.status ?? existing.status;
    const willHoldDates = BLOCKING_STATUSES.includes(nextStatus);

    const updated = await this.prisma.$transaction(
      async (tx) => {
        // Only re-check when the booking will actually occupy the days, so
        // cancelling a booking that overlaps another one still works.
        if (willHoldDates && (movingDates || !BLOCKING_STATUSES.includes(existing.status))) {
          const clashes = await findOverlapping(tx, existing.spaceId, start, end, id);
          if (clashes.length > 0) {
            throw new ConflictException(
              `Datoene overlapper med booking ${clashes[0].reference}`,
            );
          }

          const shut = await findOverlappingBlackouts(tx, existing.spaceId, start, end);
          if (shut.length > 0) {
            throw new ConflictException('Felleshuset er stengt én eller flere av disse dagene');
          }
        }

        return tx.booking.update({ where: { id }, data, include: INCLUDE });
      },
      { isolationLevel: 'Serializable' },
    );

    // The guest hears about it when the dashboard settles their booking.
    if (dto.status !== undefined && dto.status !== existing.status && isDecision(dto.status)) {
      await this.notifications.notifyBookingDecision(toMail(updated), dto.status);
    }

    return toAdminView(updated);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.booking.delete({ where: { id } });
    return { id, deleted: true };
  }

  // --- Internals ----------------------------------------------------------

  private async loadForGuest(reference: string, token: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { reference: reference.toUpperCase() },
      include: INCLUDE,
    });

    if (!booking || !token || booking.cancelToken !== token) {
      throw new NotFoundException('Fant ingen booking med denne lenken');
    }

    return { booking };
  }
}

/** The status changes a guest should hear about. */
function isDecision(
  status: BookingStatus,
): status is 'CONFIRMED' | 'DECLINED' | 'CANCELLED' {
  return (
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.DECLINED ||
    status === BookingStatus.CANCELLED
  );
}

/** What the mail templates need to know about a booking. */
function toMail(booking: BookingRecord): BookingMail {
  return {
    reference: booking.reference,
    guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
    guestEmail: booking.guest.email,
    spaceName: booking.space.name,
    startDate: toIsoDate(booking.startDate),
    endDate: toIsoDate(booking.endDate),
    guests: booking.guests,
    total: booking.total,
    cancelToken: booking.cancelToken,
  };
}

function isCancellable(booking: { status: BookingStatus; startDate: Date }) {
  if (CLOSED_STATUSES.includes(booking.status)) return false;
  return daysBetween(todayIso(), toIsoDate(booking.startDate)) >= 0;
}

function applyStatusChange(
  data: Prisma.BookingUpdateInput,
  status: BookingStatus,
  reason?: string,
) {
  data.status = status;

  const ending = status === BookingStatus.CANCELLED || status === BookingStatus.DECLINED;

  if (ending) {
    data.cancelledAt = new Date();
    data.cancelledBy = CancelledBy.ADMIN;
    data.cancelReason = reason ?? null;
    return;
  }

  // Reviving a booking clears the record of it having been called off.
  data.cancelledAt = null;
  data.cancelledBy = null;
  data.cancelReason = null;
}

type GuestFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
};

/** Reuses the guest record when the same address books again. */
async function upsertGuest(tx: Prisma.TransactionClient, dto: GuestFields) {
  const email = dto.email.toLowerCase();
  const data = {
    firstName: dto.firstName,
    lastName: dto.lastName,
    email,
    phone: dto.phone,
    company: dto.company ?? null,
  };

  const existing = await tx.guest.findFirst({ where: { email } });

  if (existing) {
    return tx.guest.update({ where: { id: existing.id }, data });
  }

  return tx.guest.create({ data });
}

/** Retries on the vanishingly rare case of two bookings drawing the same code. */
async function createWithReference(
  tx: Prisma.TransactionClient,
  data: Omit<Prisma.BookingUncheckedCreateInput, 'reference' | 'cancelToken'>,
): Promise<BookingRecord> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await tx.booking.create({
        data: {
          ...data,
          reference: generateReference(),
          cancelToken: generateCancelToken(),
        },
        include: INCLUDE,
      });
    } catch (error) {
      if (!isUniqueViolation(error) || attempt === 4) throw error;
    }
  }

  throw new ConflictException('Klarte ikke å opprette bookingen. Prøv igjen.');
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}
