import { addDays, eachDay, isoWeekday, type IsoDate } from '../common/dates';

/** The parts of a `Rate` row the price calculation cares about. */
export type RateLike = {
  id: string;
  label: string;
  weekdays: number[];
  amount: number;
};

export type QuoteDay = {
  date: IsoDate;
  label: string;
  amount: number;
};

/** Whether the guest also holds the day before, for carrying in and setting up. */
export type SetupOption = 'NONE' | 'HALF_DAY' | 'FULL_DAY';

/** The two flat setup prices, as configured on the space. */
export type SetupFees = { fullDay: number; halfDay: number };

export type QuoteSetup = {
  option: Exclude<SetupOption, 'NONE'>;
  /** The day being held, always the one directly before the first rented day. */
  date: IsoDate;
  label: string;
  amount: number;
};

/** The members' discount, when the booker currently owns a plot. */
export type QuoteDiscount = {
  percent: number;
  label: string;
  /** Always positive; it is subtracted from the subtotal. */
  amount: number;
};

export type Quote = {
  currency: 'NOK';
  days: QuoteDay[];
  dayTotal: number;
  cleaningFee: number;
  /** Null when no setup day was bought. */
  setup: QuoteSetup | null;
  setupFee: number;
  /** Everything before the members' discount comes off. */
  subtotal: number;
  /** Null when the booker is not a plot owner, or the percentage is 0. */
  discount: QuoteDiscount | null;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

/**
 * The members' discount comes off everything — hire, rigging and cleaning —
 * so it is computed from the subtotal rather than the day rates alone.
 */
export function discountFor(percent: number, subtotal: number): QuoteDiscount | null {
  const clamped = Math.min(100, Math.max(0, Math.trunc(percent)));
  if (clamped === 0 || subtotal <= 0) return null;

  return {
    percent: clamped,
    label: `Parsellantrabatt ${clamped} %`,
    amount: Math.round((subtotal * clamped) / 100),
  };
}

const SETUP_LABELS: Record<Exclude<SetupOption, 'NONE'>, string> = {
  FULL_DAY: 'Rigging - full dag',
  HALF_DAY: 'Rigging - halv dag',
};

/** The flat price for an option. A half day holds the same day, for less. */
export function setupFeeFor(option: SetupOption, fees: SetupFees): number {
  if (option === 'FULL_DAY') return fees.fullDay;
  if (option === 'HALF_DAY') return fees.halfDay;
  return 0;
}

/** The single day a setup option holds: the one before the rental starts. */
export function setupDateFor(option: SetupOption, start: IsoDate): IsoDate | null {
  return option === 'NONE' ? null : addDays(start, -1);
}

/**
 * The first day a booking holds. A bought setup day is held as firmly as a
 * rented one, so it is what overlap checks and the calendar must go from.
 */
export function blockedFromFor(option: SetupOption, start: IsoDate): IsoDate {
  return setupDateFor(option, start) ?? start;
}

function buildSetup(
  option: SetupOption,
  fees: SetupFees,
  start: IsoDate,
): QuoteSetup | null {
  const date = setupDateFor(option, start);
  if (!date || option === 'NONE') return null;

  return {
    option,
    date,
    label: SETUP_LABELS[option],
    amount: setupFeeFor(option, fees),
  };
}

/** The rate covering a given day, or null when no rate lists that weekday. */
export function rateForDay(rates: RateLike[], date: IsoDate): RateLike | null {
  const weekday = isoWeekday(date);
  return rates.find((rate) => rate.weekdays.includes(weekday)) ?? null;
}

/** Weekdays between 1 and 7 that no rate covers, so cannot be booked. */
export function unpricedWeekdays(rates: RateLike[]): number[] {
  const covered = new Set(rates.flatMap((rate) => rate.weekdays));
  return [1, 2, 3, 4, 5, 6, 7].filter((weekday) => !covered.has(weekday));
}

export type QuoteResult =
  | { ok: true; quote: Quote }
  /** Days in the range that no rate covers. */
  | { ok: false; unpriced: IsoDate[] };

export function buildQuote(
  rates: RateLike[],
  cleaningFee: number,
  start: IsoDate,
  end: IsoDate,
  setupOption: SetupOption = 'NONE',
  setupFees: SetupFees = { fullDay: 0, halfDay: 0 },
  discountPercent = 0,
): QuoteResult {
  const days: QuoteDay[] = [];
  const unpriced: IsoDate[] = [];

  for (const date of eachDay(start, end)) {
    const rate = rateForDay(rates, date);
    if (!rate) {
      unpriced.push(date);
      continue;
    }
    days.push({ date, label: rate.label, amount: rate.amount });
  }

  if (unpriced.length > 0) {
    return { ok: false, unpriced };
  }

  const dayTotal = days.reduce((sum, day) => sum + day.amount, 0);
  // The setup day is deliberately not priced from the weekday rates: it is a
  // flat fee for access, not a second day of hire.
  const setup = buildSetup(setupOption, setupFees, start);
  const setupFee = setup?.amount ?? 0;

  const subtotal = dayTotal + cleaningFee + setupFee;
  const discount = discountFor(discountPercent, subtotal);

  return {
    ok: true,
    quote: {
      currency: 'NOK',
      days,
      dayTotal,
      cleaningFee,
      setup,
      setupFee,
      subtotal,
      discount,
      discountPercent: discount?.percent ?? 0,
      discountAmount: discount?.amount ?? 0,
      total: subtotal - (discount?.amount ?? 0),
    },
  };
}
