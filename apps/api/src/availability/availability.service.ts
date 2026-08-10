import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { findOverlapping } from '../bookings/overlap';
import { findOverlappingBlackouts } from '../blackouts/overlap';
import { unpricedWeekdays } from '../pricing/quote';
import {
  addDays,
  daysBetween,
  eachDay,
  isIsoDate,
  isoWeekday,
  toIsoDate,
  todayIso,
  type IsoDate,
} from '../common/dates';
import type { AvailabilityQueryDto } from './dto/availability-query.dto';

/** Guards against a client asking for a decade of calendar in one request. */
const MAX_RANGE_DAYS = 400;

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly spaces: SpacesService,
  ) {}

  async check(query: AvailabilityQueryDto) {
    const { from, to } = assertRange(query.from, query.to);
    const space = await this.spaces.findBySlug(query.space);

    const taken = await findOverlapping(this.prisma, space.id, from, to, query.exclude);

    const bookedDates = new Set<IsoDate>();
    for (const booking of taken) {
      const start = toIsoDate(booking.startDate);
      const end = toIsoDate(booking.endDate);
      for (const day of eachDay(start, end)) {
        bookedDates.add(day);
      }
    }

    const closedWeekdays = unpricedWeekdays(space.rates);

    const shut = await findOverlappingBlackouts(this.prisma, space.id, from, to);
    const blockedDates = new Set<IsoDate>();
    for (const blackout of shut) {
      for (const day of eachDay(toIsoDate(blackout.startDate), toIsoDate(blackout.endDate))) {
        blockedDates.add(day);
      }
    }

    return {
      space: space.slug,
      from,
      to,
      /** Nothing can be booked before this, because of the notice period. */
      minDate: addDays(todayIso(), space.noticeDays),
      closedWeekdays,
      bookedDates: [...bookedDates].filter(isWithin(from, to)).sort(),
      /**
       * Days that are shut rather than taken: weekdays with no price, plus the
       * closures someone has entered in the dashboard. The public calendar
       * draws them the same way, since either way they cannot be booked.
       */
      closedDates: [
        ...new Set([
          ...eachDay(from, to).filter((day) => closedWeekdays.includes(isoWeekday(day))),
          ...[...blockedDates].filter(isWithin(from, to)),
        ]),
      ].sort(),
    };
  }

  /** Whether every day in the range is free, used before writing a booking. */
  async isRangeFree(spaceId: string, start: IsoDate, end: IsoDate, excludeId?: string) {
    const [taken, shut] = await Promise.all([
      findOverlapping(this.prisma, spaceId, start, end, excludeId),
      findOverlappingBlackouts(this.prisma, spaceId, start, end),
    ]);

    return taken.length === 0 && shut.length === 0;
  }
}

function isWithin(from: IsoDate, to: IsoDate) {
  return (day: IsoDate) => daysBetween(from, day) >= 0 && daysBetween(day, to) >= 0;
}

function assertRange(from: string, to: string) {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new BadRequestException('Datoene må være på formen ÅÅÅÅ-MM-DD');
  }

  const length = daysBetween(from, to);

  if (length < 0) {
    throw new BadRequestException('Til-datoen kan ikke være før fra-datoen');
  }

  if (length > MAX_RANGE_DAYS) {
    throw new BadRequestException(
      `Perioden kan ikke være lengre enn ${MAX_RANGE_DAYS} dager`,
    );
  }

  return { from, to };
}
