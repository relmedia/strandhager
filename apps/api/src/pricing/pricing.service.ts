import { BadRequestException, Injectable } from '@nestjs/common';
import { SpacesService } from '../spaces/spaces.service';
import { buildQuote, type Quote, type RateLike } from './quote';
import { daysBetween, isIsoDate, type IsoDate } from '../common/dates';

/** A single hire cannot run longer than this, as a sanity check on input. */
export const MAX_BOOKING_DAYS = 14;

@Injectable()
export class PricingService {
  constructor(private readonly spaces: SpacesService) {}

  async quote(slug: string, from: string, to: string) {
    const { start, end } = assertBookableRange(from, to);
    const space = await this.spaces.findBySlug(slug);

    return {
      space: space.slug,
      from: start,
      to: end,
      ...priceOrThrow(space.rates, space.cleaningFee, start, end),
    };
  }
}

/** Prices a range, turning an unpriced day into a readable error. */
export function priceOrThrow(
  rates: RateLike[],
  cleaningFee: number,
  start: IsoDate,
  end: IsoDate,
): Quote {
  const result = buildQuote(rates, cleaningFee, start, end);

  if (!result.ok) {
    throw new BadRequestException(
      `Det er ikke satt noen pris for ${result.unpriced.join(', ')}, så disse dagene kan ikke bookes`,
    );
  }

  return result.quote;
}

/** Validates a hire period and narrows it to plain ISO dates. */
export function assertBookableRange(from: string, to: string) {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new BadRequestException('Datoene må være på formen ÅÅÅÅ-MM-DD');
  }

  const length = daysBetween(from, to);

  if (length < 0) {
    throw new BadRequestException('Sluttdatoen kan ikke være før startdatoen');
  }

  if (length + 1 > MAX_BOOKING_DAYS) {
    throw new BadRequestException(
      `En booking kan være på maks ${MAX_BOOKING_DAYS} dager. Ta kontakt for lengre leie.`,
    );
  }

  return { start: from, end: to };
}
