import { eachDay, isoWeekday, type IsoDate } from '../common/dates';

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

export type Quote = {
  currency: 'NOK';
  days: QuoteDay[];
  dayTotal: number;
  cleaningFee: number;
  total: number;
};

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

  return {
    ok: true,
    quote: {
      currency: 'NOK',
      days,
      dayTotal,
      cleaningFee,
      total: dayTotal + cleaningFee,
    },
  };
}
