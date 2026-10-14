import { Injectable, Logger } from '@nestjs/common';
import type { TripletexSettings } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';

export const SETTINGS_ID = 'tripletex';

const TEST_URL = 'https://api-test.tripletex.tech/v2';
const PRODUCTION_URL = 'https://tripletex.no/v2';

/** Settings are read on every booking event; this keeps it to one query per window. */
const CONFIG_TTL_MS = 30_000;

type Credentials = {
  baseUrl: string;
  consumerToken: string;
  employeeToken: string;
};

type Query = Record<string, string | number | boolean | undefined>;

/** Tripletex wraps single objects in `value` and lists in `values`. */
type Single<T> = { value: T };
type List<T> = { values: T[] };

/** What Tripletex sends back when it refuses something. */
type TripletexErrorBody = {
  message?: string;
  validationMessages?: { field?: string; message?: string }[] | null;
};

export class TripletexError extends Error {}

/**
 * Low-level Tripletex API access: settings, the session token and requests.
 *
 * Tripletex authenticates with two long-lived tokens – a consumer token for
 * this integration and an employee token for the user it acts as – which are
 * exchanged for a session token. Requests then use Basic auth with "0" (the
 * user's own company) as the username and the session token as the password.
 *
 * Docs: https://tripletex.no/v2-docs/
 */
@Injectable()
export class TripletexClient {
  private readonly logger = new Logger(TripletexClient.name);

  private cached: { settings: TripletexSettings | null; expiresAt: number } | null = null;
  private session: { token: string; baseUrl: string; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async settings(): Promise<TripletexSettings | null> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.settings;
    const settings = await this.prisma.tripletexSettings.findUnique({ where: { id: SETTINGS_ID } });
    this.cached = { settings, expiresAt: Date.now() + CONFIG_TTL_MS };
    return settings;
  }

  /** Called after the settings change, so the next call uses the new tokens. */
  invalidate(): void {
    this.cached = null;
    this.session = null;
  }

  /** Switched on, with both tokens. Bookings only reach Tripletex when this holds. */
  async isActive(): Promise<boolean> {
    const settings = await this.settings();
    return Boolean(settings?.enabled && this.credentialsFrom(settings));
  }

  async get<T>(path: string, query?: Query): Promise<T> {
    return this.request<T>('GET', path, query);
  }

  async post<T>(path: string, body: unknown, query?: Query): Promise<T> {
    return this.request<T>('POST', path, query, body);
  }

  async put<T>(path: string, query?: Query, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, query, body);
  }

  async one<T>(path: string, query?: Query): Promise<T> {
    return (await this.get<Single<T>>(path, query)).value;
  }

  async many<T>(path: string, query?: Query): Promise<T[]> {
    return (await this.get<List<T>>(path, query)).values;
  }

  // --- Internals ------------------------------------------------------------

  private credentialsFrom(settings: TripletexSettings | null): Credentials | null {
    if (!settings?.consumerToken || !settings.employeeToken) return null;
    return {
      baseUrl: settings.production ? PRODUCTION_URL : TEST_URL,
      consumerToken: settings.consumerToken,
      employeeToken: settings.employeeToken,
    };
  }

  /** Works whether or not the switch is on, so the settings page can test first. */
  private async credentials(): Promise<Credentials> {
    const credentials = this.credentialsFrom(await this.settings());
    if (!credentials) {
      throw new TripletexError('Begge Tripletex-nøklene må fylles ut.');
    }
    return credentials;
  }

  private async request<T>(method: string, path: string, query?: Query, body?: unknown): Promise<T> {
    const credentials = await this.credentials();
    const token = await this.sessionToken(credentials);

    const response = await fetch(this.url(credentials.baseUrl, path, query), {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`0:${token}`).toString('base64')}`,
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (response.status === 401) {
      // The session may have been revoked; the next call starts a new one.
      this.session = null;
    }

    if (!response.ok) {
      throw new TripletexError(await describe(response, `${method} ${path}`));
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async sessionToken(credentials: Credentials): Promise<string> {
    if (
      this.session &&
      this.session.baseUrl === credentials.baseUrl &&
      this.session.expiresAt > Date.now() + 60 * 60 * 1000
    ) {
      return this.session.token;
    }

    // Sessions are dated, not timed; two days ahead leaves room for clocks.
    const expires = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const response = await fetch(
      this.url(credentials.baseUrl, '/token/session/:create', {
        consumerToken: credentials.consumerToken,
        employeeToken: credentials.employeeToken,
        expirationDate: expires.toISOString().slice(0, 10),
      }),
      { method: 'PUT', headers: { Accept: 'application/json' } },
    );

    if (!response.ok) {
      // An unknown token comes back as 422, a revoked one as 401/403.
      const rejected = [401, 403, 422].includes(response.status);
      const detail = await describe(response, 'innlogging');
      throw new TripletexError(
        rejected
          ? `Tripletex godtok ikke nøklene. Sjekk at de er riktige og hører til valgt miljø (test eller produksjon). ${detail}`
          : detail,
      );
    }

    const { value } = (await response.json()) as Single<{ token: string }>;
    // Renew a day before the stated expiry date.
    this.session = {
      token: value.token,
      baseUrl: credentials.baseUrl,
      expiresAt: expires.getTime() - 24 * 60 * 60 * 1000,
    };
    this.logger.log('Hentet ny Tripletex-sesjon');
    return value.token;
  }

  private url(baseUrl: string, path: string, query?: Query): string {
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

/** One readable sentence out of a Tripletex error response. */
async function describe(response: Response, what: string): Promise<string> {
  let body: TripletexErrorBody | null = null;
  try {
    body = (await response.json()) as TripletexErrorBody;
  } catch {
    // Not JSON; fall through to the status code.
  }

  const details = (body?.validationMessages ?? [])
    .map((item) => [item.field, item.message].filter(Boolean).join(': '))
    .filter(Boolean);

  const message = details.length > 0 ? details.join('; ') : body?.message;
  return `Tripletex avviste ${what} (${response.status})${message ? `: ${message}` : ''}`;
}
