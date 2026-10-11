import type { IsoDate } from "./dates";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Rate = {
  id: string;
  label: string;
  /** ISO weekdays: 1 is Monday through 7 is Sunday. */
  weekdays: number[];
  amount: number;
};

/** Whether the guest also holds the day before the rental, for setting up. */
export type SetupOption = "NONE" | "HALF_DAY" | "FULL_DAY";

export type Space = {
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  cleaningFee: number;
  /** Flat price for holding the whole day before, for rigging. */
  setupFullDayFee: number;
  /** Flat price for half of the day before. Holds the same day, costs less. */
  setupHalfDayFee: number;
  /** Percentage off the whole total for a current plot owner. 0 switches it off. */
  parcelOwnerDiscountPercent: number;
  priceNote: string | null;
  noticeDays: number;
  /** The longest stretch of days a single booking may cover. */
  maxBookingDays: number;
  active: boolean;
  rates: Rate[];
  closedWeekdays: number[];
};

export type Availability = {
  space: string;
  from: IsoDate;
  to: IsoDate;
  /** Earliest bookable day, given the notice period. */
  minDate: IsoDate;
  closedWeekdays: number[];
  bookedDates: IsoDate[];
  /** Days that are shut rather than taken: no rate that weekday, or a closure. */
  closedDates: IsoDate[];
};

export type QuoteSetup = {
  option: Exclude<SetupOption, "NONE">;
  /** The day being held, always the one before the first rented day. */
  date: IsoDate;
  label: string;
  amount: number;
};

/** The members' discount, when the booker currently owns a plot. */
export type QuoteDiscount = {
  percent: number;
  label: string;
  /** Positive; subtracted from the subtotal. */
  amount: number;
};

export type Quote = {
  currency: "NOK";
  days: { date: IsoDate; label: string; amount: number }[];
  dayTotal: number;
  cleaningFee: number;
  /** Null when no setup day was bought. */
  setup: QuoteSetup | null;
  setupFee: number;
  /** Everything before the members' discount comes off. */
  subtotal: number;
  /** Null unless the email belongs to a current plot owner. */
  discount: QuoteDiscount | null;
  discountPercent: number;
  discountAmount: number;
  total: number;
};

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED";

export type Booking = {
  reference: string;
  status: BookingStatus;
  paymentStatus: string;
  startDate: IsoDate;
  endDate: IsoDate;
  days: number;
  guests: number;
  purpose: string | null;
  message: string | null;
  dayTotal: number;
  cleaningFee: number;
  setupOption: SetupOption;
  setupFee: number;
  /** The day held for setting up, or null when none was bought. */
  setupDate: IsoDate | null;
  discountPercent: number;
  discountAmount: number;
  total: number;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  space: { slug: string; name: string };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: string | null;
  };
};

export type BookingRequest = {
  space: string;
  startDate: IsoDate;
  endDate: IsoDate;
  guests: number;
  /** Defaults to NONE when the guest does not want the day before. */
  setupOption?: SetupOption;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  purpose?: string;
  message?: string;
  /** The rental terms box; the API refuses the request unless it is true. */
  acceptTerms: boolean;
  /** The hand-drawn signature as a PNG data URL. */
  signature: string;
};

/** Error carrying the message the API wrote, which is already in Norwegian. */
export class BookingError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new BookingError(readError(body));
  }

  return body as T;
}

/** Nest reports validation failures as an array of messages. */
function readError(body: unknown): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  }
  return "Noe gikk galt. Prøv igjen om litt.";
}

export function getSpace(slug: string) {
  return request<Space>(`/spaces/${slug}`);
}

/**
 * Server-side load of a space. Returns null instead of throwing so an API
 * outage degrades the booking panel to the contact details rather than
 * taking the whole front page down.
 */
export async function getSpaceOrNull(slug: string): Promise<Space | null> {
  try {
    return await getSpace(slug);
  } catch {
    return null;
  }
}

export function getAvailability(slug: string, from: IsoDate, to: IsoDate) {
  return request<Availability>(
    `/availability?space=${slug}&from=${from}&to=${to}`,
  );
}

/**
 * Posted rather than fetched so the booker's email stays in the body. An email
 * in a query string would end up in access logs, browser history and referrer
 * headers; the price is the same either way.
 */
export function getQuote(
  slug: string,
  from: IsoDate,
  to: IsoDate,
  setup: SetupOption = "NONE",
  email?: string,
) {
  return request<Quote & { space: string }>("/pricing/quote", {
    method: "POST",
    body: JSON.stringify({
      space: slug,
      from,
      to,
      setup,
      ...(email ? { email } : {}),
    }),
  });
}

/** The configured price for an option, for labelling the choice. */
export function setupFeeFor(space: Space, option: SetupOption): number {
  if (option === "FULL_DAY") return space.setupFullDayFee;
  if (option === "HALF_DAY") return space.setupHalfDayFee;
  return 0;
}

/** The day an option would hold: the one directly before the rental starts. */
export function setupDateFor(option: SetupOption, start: IsoDate): IsoDate | null {
  if (option === "NONE") return null;
  const date = new Date(`${start}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function createBooking(payload: BookingRequest) {
  return request<{ booking: Booking; quote: Quote; cancelToken: string }>(
    "/bookings",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function getBookingByReference(reference: string, token: string) {
  return request<{ booking: Booking; cancellable: boolean }>(
    `/bookings/reference/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`,
  );
}

export function cancelBooking(reference: string, token: string, reason?: string) {
  return request<{ booking: Booking; cancellable: boolean }>(
    `/bookings/reference/${encodeURIComponent(reference)}/cancel`,
    { method: "POST", body: JSON.stringify({ token, reason }) },
  );
}

/** Reads the price cards straight off the rate list, in weekday order. */
export function priceCards(space: Space) {
  return space.rates.map((rate) => ({
    ...rate,
    days: rate.weekdays.map((day) => WEEKDAY_NAMES[day - 1]),
  }));
}

export const WEEKDAY_NAMES = [
  "mandag",
  "tirsdag",
  "onsdag",
  "torsdag",
  "fredag",
  "lørdag",
  "søndag",
];

export const WEEKDAY_INITIALS = ["M", "T", "O", "T", "F", "L", "S"];
