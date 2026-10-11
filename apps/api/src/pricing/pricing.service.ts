import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { ownsAParcel } from './parcel-owner';
import {
  buildQuote,
  type Quote,
  type RateLike,
  type SetupFees,
  type SetupOption,
} from './quote';
import { daysBetween, isIsoDate, type IsoDate } from '../common/dates';

/** Fallback ceiling when a space has no configured limit. */
export const DEFAULT_MAX_BOOKING_DAYS = 14;

@Injectable()
export class PricingService {
  constructor(
    private readonly spaces: SpacesService,
    private readonly prisma: PrismaService,
  ) {}

  async quote(
    slug: string,
    from: string,
    to: string,
    setup: SetupOption = 'NONE',
    email?: string,
  ) {
    const space = await this.spaces.findBySlug(slug);
    const { start, end } = assertBookableRange(from, to, space.maxBookingDays);
    const discountPercent = await this.discountPercentFor(space, email);

    return {
      space: space.slug,
      from: start,
      to: end,
      ...priceOrThrow(
        space.rates,
        space.cleaningFee,
        start,
        end,
        setup,
        setupFeesOf(space),
        discountPercent,
      ),
    };
  }

  /**
   * The members' discount an email earns, or 0. Resolved here rather than
   * taken from the client, so the figure can never be forged by posting one.
   *
   * Short-circuits before touching the database when the board has not set a
   * percentage, so the owner register is not read at all unless it matters.
   */
  async discountPercentFor(
    space: { parcelOwnerDiscountPercent: number },
    email?: string,
  ): Promise<number> {
    if (!email || space.parcelOwnerDiscountPercent <= 0) return 0;
    return (await ownsAParcel(this.prisma, email))
      ? space.parcelOwnerDiscountPercent
      : 0;
  }
}

/** The configured setup prices for a space, in the shape the quote wants. */
export function setupFeesOf(space: {
  setupFullDayFee: number;
  setupHalfDayFee: number;
}): SetupFees {
  return { fullDay: space.setupFullDayFee, halfDay: space.setupHalfDayFee };
}

/** Prices a range, turning an unpriced day into a readable error. */
export function priceOrThrow(
  rates: RateLike[],
  cleaningFee: number,
  start: IsoDate,
  end: IsoDate,
  setupOption: SetupOption = 'NONE',
  setupFees: SetupFees = { fullDay: 0, halfDay: 0 },
  discountPercent = 0,
): Quote {
  const result = buildQuote(
    rates,
    cleaningFee,
    start,
    end,
    setupOption,
    setupFees,
    discountPercent,
  );

  if (!result.ok) {
    throw new BadRequestException(
      `Det er ikke satt noen pris for ${result.unpriced.join(', ')}, så disse dagene kan ikke bookes`,
    );
  }

  return result.quote;
}

/** Validates a hire period and narrows it to plain ISO dates. */
export function assertBookableRange(
  from: string,
  to: string,
  maxDays: number = DEFAULT_MAX_BOOKING_DAYS,
) {
  if (!isIsoDate(from) || !isIsoDate(to)) {
    throw new BadRequestException('Datoene må være på formen ÅÅÅÅ-MM-DD');
  }

  const length = daysBetween(from, to);

  if (length < 0) {
    throw new BadRequestException('Sluttdatoen kan ikke være før startdatoen');
  }

  if (length + 1 > maxDays) {
    throw new BadRequestException(
      `En booking kan være på maks ${maxDays} dager. Ta kontakt for lengre leie.`,
    );
  }

  return { start: from, end: to };
}
