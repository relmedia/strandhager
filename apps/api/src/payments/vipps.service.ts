import { Injectable, Logger } from '@nestjs/common';
import type { VippsSettings } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 'vipps';

const TEST_URL = 'https://apitest.vipps.no';
const PRODUCTION_URL = 'https://api.vipps.no';

/** Settings are read on every payment; this keeps that to one query per window. */
const CONFIG_TTL_MS = 30_000;

/** The payment events the webhook handler acts on, plus the dead ends for the log. */
const WEBHOOK_EVENTS = [
  'epayments.payment.authorized.v1',
  'epayments.payment.captured.v1',
  'epayments.payment.refunded.v1',
  'epayments.payment.aborted.v1',
  'epayments.payment.expired.v1',
  'epayments.payment.cancelled.v1',
];

/** What a Vipps call needs, wherever each part came from. */
export type VippsConfig = {
  enabled: boolean;
  baseUrl: string;
  production: boolean;
  clientId: string | null;
  clientSecret: string | null;
  subscriptionKey: string | null;
  merchantSerial: string | null;
  webhookSecret: string | null;
};

type Credentials = VippsConfig & {
  clientId: string;
  clientSecret: string;
  subscriptionKey: string;
  merchantSerial: string;
};

const env = (name: string) => process.env[name]?.trim() || null;

type Amount = { currency: string; value: number };

/** The parts of GET /epayment/v1/payments/{reference} this app reads. */
export type VippsPayment = {
  state: 'CREATED' | 'AUTHORIZED' | 'ABORTED' | 'EXPIRED' | 'TERMINATED';
  aggregate: {
    authorizedAmount: Amount;
    capturedAmount: Amount;
    refundedAmount: Amount;
  };
};

/**
 * Thin client for the Vipps MobilePay ePayment API.
 *
 * Credentials are managed from the dashboard (Innstillinger → Betaling) and
 * stored in VippsSettings. Any field left empty there falls back to its
 * VIPPS_* environment variable, so a server set up through .env keeps working.
 * When nothing usable is configured the service reports itself as
 * unconfigured and the rest of the app simply skips payments.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 */
@Injectable()
export class VippsService {
  private readonly logger = new Logger(VippsService.name);

  /** Access tokens are valid for hours; keep the current one around. */
  private token: { value: string; expiresAt: number } | null = null;
  private cached: { config: VippsConfig; expiresAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * VIPPS_MOCK=true pretends every Vipps call succeeds, so the whole
   * payment flow can be exercised locally without credentials. Must never
   * be enabled in production.
   */
  private get mock(): boolean {
    return process.env.VIPPS_MOCK === 'true';
  }

  /** The stored row, or null before anyone has saved the settings page. */
  stored(): Promise<VippsSettings | null> {
    return this.prisma.vippsSettings.findUnique({ where: { id: SETTINGS_ID } });
  }

  /** Database first, environment as fallback, field by field. */
  async config(): Promise<VippsConfig> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.config;

    const row = await this.stored();
    const production = row ? row.production : env('VIPPS_BASE_URL') === PRODUCTION_URL;

    const config: VippsConfig = {
      // Before the page has been saved, a complete .env is enough on its own.
      enabled: row ? row.enabled : true,
      production,
      // VIPPS_BASE_URL only counts until the page has been saved.
      baseUrl:
        (!row && env('VIPPS_BASE_URL')?.replace(/\/+$/, '')) ||
        (production ? PRODUCTION_URL : TEST_URL),
      clientId: row?.clientId || env('VIPPS_CLIENT_ID'),
      clientSecret: row?.clientSecret || env('VIPPS_CLIENT_SECRET'),
      subscriptionKey: row?.subscriptionKey || env('VIPPS_SUBSCRIPTION_KEY'),
      merchantSerial: row?.merchantSerial || env('VIPPS_MERCHANT_SERIAL'),
      webhookSecret: row?.webhookSecret || env('VIPPS_WEBHOOK_SECRET'),
    };

    this.cached = { config, expiresAt: Date.now() + CONFIG_TTL_MS };
    return config;
  }

  /** Called after the settings change, so the next call uses the new keys. */
  invalidate(): void {
    this.cached = null;
    this.token = null;
  }

  async isConfigured(): Promise<boolean> {
    if (this.mock) return true;
    return (await this.credentials()) !== null;
  }

  /** The secret Vipps signs webhook requests with, if one is known. */
  async webhookSecret(): Promise<string | null> {
    return (await this.config()).webhookSecret;
  }

  /**
   * Creates a payment session and returns the landing-page URL the customer
   * opens (or scans) to pay.
   */
  async createPayment(input: {
    /** Unique per payment, 8–64 chars of [a-zA-Z0-9-]. */
    reference: string;
    /** Whole kroner; converted to øre for the API. */
    amountNok: number;
    /** Shown to the customer in the app, max 100 chars. */
    description: string;
    /** Where the customer lands after paying. */
    returnUrl: string;
    /** MSISDN (e.g. 4792926666) to prefill, if known. */
    phoneNumber?: string;
  }): Promise<{ redirectUrl: string }> {
    if (this.mock) {
      this.logger.warn(`MOCK: later som betalingen ${input.reference} er opprettet`);
      return { redirectUrl: `https://pay.vipps.no/mock/${input.reference}` };
    }

    const body = {
      amount: { currency: 'NOK', value: Math.round(input.amountNok * 100) },
      paymentMethod: { type: 'WALLET' },
      reference: input.reference,
      returnUrl: input.returnUrl,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: input.description.slice(0, 100),
      ...(input.phoneNumber ? { customer: { phoneNumber: input.phoneNumber } } : {}),
    };

    const data = await this.request<{ redirectUrl: string }>(
      'POST',
      '/epayment/v1/payments',
      body,
      `create-${input.reference}`,
    );

    return { redirectUrl: data!.redirectUrl };
  }

  /**
   * The payment as Vipps itself sees it. Webhook bodies are only a hint that
   * something changed; this is what decides whether money actually moved.
   * Amounts are in øre.
   */
  async getPayment(reference: string): Promise<VippsPayment> {
    const payment = await this.request<VippsPayment>(
      'GET',
      `/epayment/v1/payments/${encodeURIComponent(reference)}`,
      undefined,
    );
    return payment!;
  }

  /** Whether VIPPS_MOCK is on, in which case there is no real payment to ask about. */
  get isMock(): boolean {
    return this.mock;
  }

  /**
   * Pulls the money after the customer has approved (authorized) the payment.
   */
  async capturePayment(reference: string, amountNok: number): Promise<void> {
    if (this.mock) {
      this.logger.warn(`MOCK: later som ${amountNok} kr er krevd inn for ${reference}`);
      return;
    }

    await this.request(
      'POST',
      `/epayment/v1/payments/${reference}/capture`,
      { modificationAmount: { currency: 'NOK', value: Math.round(amountNok * 100) } },
      `capture-${reference}`,
    );
  }

  /**
   * Sends captured money back to the customer. Vipps returns it to the card
   * or account the payment was made from; no account details are needed.
   */
  async refundPayment(reference: string, amountNok: number): Promise<void> {
    if (this.mock) {
      this.logger.warn(`MOCK: later som ${amountNok} kr er refundert for ${reference}`);
      return;
    }

    await this.request(
      'POST',
      `/epayment/v1/payments/${reference}/refund`,
      { modificationAmount: { currency: 'NOK', value: Math.round(amountNok * 100) } },
      `refund-${reference}`,
    );
  }

  /**
   * The dashboard's "test" button: fetching an access token exercises all four
   * keys and the environment, without creating anything at Vipps.
   */
  async testConnection(): Promise<{ ok: boolean; message: string }> {
    const credentials = await this.credentials({ ignoreSwitch: true });
    if (!credentials) {
      return { ok: false, message: 'Alle fire nøklene må fylles ut før tilkoblingen kan testes.' };
    }

    this.token = null;
    try {
      await this.accessToken(credentials);
      const where = credentials.production ? 'produksjon' : 'testmiljøet';
      return { ok: true, message: `Nøklene virker mot Vipps ${where}.` };
    } catch (cause) {
      // Vipps' answer is a page of Azure JSON; the log gets it, the board a sentence.
      this.logger.warn(`Vipps-tilkoblingstest feilet: ${String(cause)}`);
      return {
        ok: false,
        message:
          'Vipps godtok ikke nøklene. Sjekk at alle fire er riktige og hører til valgt miljø (test eller produksjon).',
      };
    }
  }

  /**
   * Registers `url` with the Webhooks API and stores the returned signing
   * secret. A webhook registered earlier from here is removed first, so there
   * is only ever one pointing at this site.
   */
  async registerWebhook(url: string): Promise<void> {
    const credentials = await this.credentials({ ignoreSwitch: true });
    if (!credentials) {
      throw new Error('Alle fire nøklene må fylles ut før webhooken kan registreres.');
    }

    const existing = await this.stored();
    if (existing?.webhookId) {
      try {
        await this.request('DELETE', `/webhooks/v1/webhooks/${existing.webhookId}`, undefined, undefined, credentials);
      } catch (cause) {
        // Already gone at Vipps (or registered in another environment).
        this.logger.warn(`Kunne ikke slette gammel Vipps-webhook: ${String(cause)}`);
      }
    }

    const created = await this.request<{ id: string; secret: string }>(
      'POST',
      '/webhooks/v1/webhooks',
      { url, events: WEBHOOK_EVENTS },
      undefined,
      credentials,
    );

    const data = { webhookId: created!.id, webhookSecret: created!.secret, webhookUrl: url };
    await this.prisma.vippsSettings.upsert({
      where: { id: SETTINGS_ID },
      // First save ever: keep Vipps running if .env already had it running.
      create: { id: SETTINGS_ID, enabled: credentials.enabled, ...data },
      update: data,
    });
    this.invalidate();
  }

  // --- Internals ------------------------------------------------------------

  /** All four keys, or null. `ignoreSwitch` lets the settings page test while off. */
  private async credentials(options: { ignoreSwitch?: boolean } = {}): Promise<Credentials | null> {
    const config = await this.config();
    if (!config.enabled && !options.ignoreSwitch) return null;
    if (!config.clientId || !config.clientSecret || !config.subscriptionKey || !config.merchantSerial) {
      return null;
    }
    return config as Credentials;
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    idempotencyKey?: string,
    preloaded?: Credentials,
  ): Promise<T | undefined> {
    const credentials = preloaded ?? (await this.credentials());
    if (!credentials) throw new Error('Vipps er ikke konfigurert.');

    const token = await this.accessToken(credentials);

    const response = await fetch(`${credentials.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Ocp-Apim-Subscription-Key': credentials.subscriptionKey,
        'Merchant-Serial-Number': credentials.merchantSerial,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        'Vipps-System-Name': 'strandhager',
        'Vipps-System-Version': '1.0.0',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Vipps ${method} ${path} feilet (${response.status}): ${detail}`);
    }

    // DELETE answers 204 with no body.
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : undefined;
  }

  private async accessToken(credentials: Credentials): Promise<string> {
    // Refresh a minute before expiry so a token never dies mid-request.
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value;
    }

    const response = await fetch(`${credentials.baseUrl}/accesstoken/get`, {
      method: 'POST',
      headers: {
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        'Ocp-Apim-Subscription-Key': credentials.subscriptionKey,
        'Merchant-Serial-Number': credentials.merchantSerial,
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Vipps access token feilet (${response.status}): ${detail}`);
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: string | number;
    };

    this.token = {
      value: data.access_token,
      expiresAt: Date.now() + Number(data.expires_in) * 1000,
    };

    this.logger.log('Hentet nytt Vipps-token');
    return data.access_token;
  }
}
