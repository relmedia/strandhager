import type { IsoDate } from "./dates";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Rate = {
  id: string;
  label: string;
  /** ISO weekdays: 1 is Monday through 7 is Sunday. */
  weekdays: number[];
  amount: number;
};

export type Space = {
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  cleaningFee: number;
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

export type Quote = {
  currency: "NOK";
  days: { date: IsoDate; label: string; amount: number }[];
  dayTotal: number;
  cleaningFee: number;
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

export function getQuote(slug: string, from: IsoDate, to: IsoDate) {
  return request<Quote & { space: string }>(
    `/pricing/quote?space=${slug}&from=${from}&to=${to}`,
  );
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
