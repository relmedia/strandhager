import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { Blackout, Prisma } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { findOverlapping } from '../bookings/overlap';
import {
  daysBetween,
  isIsoDate,
  parseIsoDate,
  toIsoDate,
  todayIso,
  type IsoDate,
} from '../common/dates';
import { findOverlappingBlackouts } from './overlap';
import type { CreateBlackoutDto } from './dto/create-blackout.dto';
import type { ListBlackoutsDto } from './dto/list-blackouts.dto';

/** A closure longer than this is almost certainly a mistyped year. */
const MAX_LENGTH_DAYS = 366;

@Injectable()
export class BlackoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async findAll(query: ListBlackoutsDto) {
    const where: Prisma.BlackoutWhereInput = {};

    if (query.space) where.space = { slug: query.space };
    if (query.from) where.endDate = { gte: parseIsoDate(query.from) };
    if (query.to) where.startDate = { lte: parseIsoDate(query.to) };

    const blackouts = await this.prisma.blackout.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return blackouts.map(toView);
  }

  async create(dto: CreateBlackoutDto) {
    const { start, end } = assertRange(dto.startDate, dto.endDate);
    const space = await this.spaces.findBySlug(dto.space);

    // Serializable so two people closing overlapping ranges at once cannot
    // both pass the checks below.
    const blackout = await this.prisma.$transaction(
      async (tx) => {
        const clashes = await findOverlappingBlackouts(tx, space.id, start, end);
        if (clashes.length > 0) {
          const clash = clashes[0];
          throw new ConflictException(
            `Dagene overlapper en stengning du allerede har lagt inn (${toIsoDate(
              clash.startDate,
            )} – ${toIsoDate(clash.endDate)}).`,
          );
        }

        // Closing a day someone has already booked would leave the day both
        // taken and shut. The booking has to be dealt with first.
        const booked = await findOverlapping(tx, space.id, start, end);
        if (booked.length > 0) {
          throw new ConflictException(
            `Booking ${booked[0].reference} ligger i denne perioden. Avbestill den først hvis dere skal stenge.`,
          );
        }

        return tx.blackout.create({
          data: {
            spaceId: space.id,
            startDate: parseIsoDate(start),
            endDate: parseIsoDate(end),
            reason: dto.reason || null,
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    return toView(blackout);
  }

  async remove(id: string) {
    const existing = await this.prisma.blackout.findUnique({ where: { id } });

    if (!existing) {
      throw new BadRequestException('Fant ingen stengning med denne id-en');
    }

    await this.prisma.blackout.delete({ where: { id } });
    return { id, deleted: true };
  }
}

function toView(blackout: Blackout) {
  const start = toIsoDate(blackout.startDate);
  const end = toIsoDate(blackout.endDate);

  return {
    id: blackout.id,
    startDate: start,
    endDate: end,
    days: daysBetween(start, end) + 1,
    reason: blackout.reason,
    past: daysBetween(todayIso(), end) < 0,
    createdAt: blackout.createdAt.toISOString(),
  };
}

function assertRange(from: string, to: string): { start: IsoDate; end: IsoDate } {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new BadRequestException('Datoene må være på formen ÅÅÅÅ-MM-DD');
  }

  const length = daysBetween(from, to);

  if (length < 0) {
    throw new BadRequestException('Til-datoen kan ikke være før fra-datoen');
  }

  if (length + 1 > MAX_LENGTH_DAYS) {
    throw new BadRequestException(
      `En stengning kan ikke være lengre enn ${MAX_LENGTH_DAYS} dager`,
    );
  }

  return { start: from, end: to };
}
