import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  WaitlistSource,
  WaitlistStatus,
  type Prisma,
  type WaitlistEntry,
} from '@cabin/database';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateWaitlistEntryDto,
  UpdateWaitlistEntryDto,
  WaitlistSignupDto,
} from './dto/waitlist.dto';
import { today } from './ownerships.service';

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Oldest first, because that is what decides whose turn it is. */
  async findAll() {
    const entries = await this.prisma.waitlistEntry.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Only those still waiting have a place in the queue, and it is counted
    // here rather than stored, so nothing has to be renumbered.
    let place = 0;

    return entries.map((entry) => ({
      ...toView(entry),
      position: entry.status === WaitlistStatus.WAITING ? ++place : null,
    }));
  }

  async create(dto: CreateWaitlistEntryDto) {
    await this.assertNotWaiting(dto.email);

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        message: dto.message || null,
        notes: dto.notes || null,
        source: WaitlistSource.ADMIN,
      },
    });

    return toView(entry);
  }

  /**
   * Someone putting themselves on the list from the website. Recorded as coming
   * from there, since nobody at the association has spoken to them yet.
   */
  async signUp(dto: WaitlistSignupDto) {
    await this.assertNotWaiting(dto.email);

    const entry = await this.prisma.waitlistEntry.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        message: dto.message || null,
        source: WaitlistSource.WEBSITE,
      },
    });

    const position = await this.placeOf(entry.id);

    await this.notifications.notifyWaitlistJoined({
      firstName: entry.firstName,
      lastName: entry.lastName,
      email: entry.email,
      position,
    });

    // The public site has no business knowing the queue or anyone else on it.
    return { position, firstName: entry.firstName };
  }

  private async assertNotWaiting(email: string) {
    const existing = await this.prisma.waitlistEntry.findFirst({
      where: { email, status: WaitlistStatus.WAITING },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Denne e-posten står allerede på ventelisten');
    }
  }

  /** Their place in the queue, counted the same way the dashboard counts it. */
  private async placeOf(id: string) {
    const waiting = await this.prisma.waitlistEntry.findMany({
      where: { status: WaitlistStatus.WAITING },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return waiting.findIndex((entry) => entry.id === id) + 1;
  }

  async update(id: string, dto: UpdateWaitlistEntryDto) {
    const existing = await this.prisma.waitlistEntry.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen på ventelisten med denne id-en');
    }

    const data: Prisma.WaitlistEntryUpdateInput = patch(dto);

    if (dto.status !== undefined && dto.status !== existing.status) {
      data.status = dto.status;
      // Stamped on the way into OFFERED, and cleared on the way out, so an
      // offer nobody answered is easy to spot.
      data.offeredAt = dto.status === WaitlistStatus.OFFERED ? new Date() : null;
    }

    const entry = await this.prisma.waitlistEntry.update({ where: { id }, data });
    return toView(entry);
  }

  async remove(id: string) {
    const existing = await this.prisma.waitlistEntry.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Fant ingen på ventelisten med denne id-en');
    }

    await this.prisma.waitlistEntry.delete({ where: { id } });
    return { id, deleted: true };
  }

  /**
   * Hands a plot to someone on the list: they become a parsellant, the plot is
   * theirs, and their entry is closed. All three or none of them.
   */
  async assignParcel(id: string, parcelId: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({ where: { id } });

    if (!entry) {
      throw new NotFoundException('Fant ingen på ventelisten med denne id-en');
    }

    if (entry.status === WaitlistStatus.ACCEPTED) {
      throw new BadRequestException('Denne har allerede fått parsell');
    }

    const parcel = await this.prisma.parcel.findUnique({ where: { id: parcelId } });

    if (!parcel) {
      throw new BadRequestException('Fant ingen parsell med denne id-en');
    }

    if (parcel.ownerId) {
      throw new ConflictException(`Parsell ${parcel.number} er allerede eid`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Someone who has owned a plot before keeps the record they already have.
      const existing = await tx.parcellant.findFirst({ where: { email: entry.email } });

      const owner =
        existing ??
        (await tx.parcellant.create({
          data: {
            firstName: entry.firstName,
            lastName: entry.lastName,
            email: entry.email,
            phone: entry.phone,
          },
        }));

      // Taking a plot over this way counts in the history just as much as doing
      // it by hand from the parcel dialog.
      await tx.ownership.create({
        data: { parcelId, parcellantId: owner.id, startedAt: today() },
      });

      await tx.parcel.update({
        where: { id: parcelId },
        data: { ownerId: owner.id, available: true },
      });

      await tx.waitlistEntry.update({
        where: { id },
        data: { status: WaitlistStatus.ACCEPTED, offeredAt: entry.offeredAt ?? new Date() },
      });

      return { parcellantId: owner.id, parcelNumber: parcel.number };
    });
  }
}

/** Only the fields that were sent, with empty text read as "nothing". */
function patch(dto: UpdateWaitlistEntryDto) {
  return {
    ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
    ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
    ...(dto.email !== undefined ? { email: dto.email } : {}),
    ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
    ...(dto.message !== undefined ? { message: dto.message || null } : {}),
    ...(dto.notes !== undefined ? { notes: dto.notes || null } : {}),
  };
}

function toView(entry: WaitlistEntry) {
  return {
    id: entry.id,
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    phone: entry.phone,
    message: entry.message,
    notes: entry.notes,
    status: entry.status,
    source: entry.source,
    offeredAt: entry.offeredAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
  };
}
