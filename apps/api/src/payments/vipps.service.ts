import { Injectable, Logger } from '@nestjs/common';

/**
 * Thin client for the Vipps MobilePay ePayment API.
 *
 * Credentials come from the environment (see the Vipps portal under
 * Developer → API keys). When they are missing the service reports itself
 * as unconfigured and the rest of the app simply skips payments.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/epayment-api/
 */
@Injectable()
export class VippsService {
  private readonly logger = new Logger(VippsService.name);

  /** Access tokens are valid for hours; keep the current one around. */
  private token: { value: string; expiresAt: number } | null = null;

  /** Test environment by default; set VIPPS_BASE_URL=https://api.vipps.no in production. */
  private get baseUrl(): string {
    return (process.env.VIPPS_BASE_URL ?? 'https://apitest.vipps.no').replace(/\/+$/, '');
  }

  get configured(): boolean {
    return Boolean(
      process.env.VIPPS_CLIENT_ID?.trim() &&
        process.env.VIPPS_CLIENT_SECRET?.trim() &&
        process.env.VIPPS_SUBSCRIPTION_KEY?.trim() &&
        process.env.VIPPS_MERCHANT_SERIAL?.trim(),
    );
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

    return { redirectUrl: data.redirectUrl };
  }

  /**
   * Pulls the money after the customer has approved (authorized) the payment.
   */
  async capturePayment(reference: string, amountNok: number): Promise<void> {
    await this.request(
      'POST',
      `/epayment/v1/payments/${reference}/capture`,
      { modificationAmount: { currency: 'NOK', value: Math.round(amountNok * 100) } },
      `capture-${reference}`,
    );
  }

  // --- Internals ------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    idempotencyKey: string,
  ): Promise<T> {
    const token = await this.accessToken();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!.trim(),
        'Merchant-Serial-Number': process.env.VIPPS_MERCHANT_SERIAL!.trim(),
        'Idempotency-Key': idempotencyKey,
        'Vipps-System-Name': 'strandhager',
        'Vipps-System-Version': '1.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Vipps ${method} ${path} feilet (${response.status}): ${detail}`);
    }

    return (await response.json()) as T;
  }

  private async accessToken(): Promise<string> {
    // Refresh a minute before expiry so a token never dies mid-request.
    if (this.token && this.token.expiresAt > Date.now() + 60_000) {
      return this.token.value;
    }

    const response = await fetch(`${this.baseUrl}/accesstoken/get`, {
      method: 'POST',
      headers: {
        client_id: process.env.VIPPS_CLIENT_ID!.trim(),
        client_secret: process.env.VIPPS_CLIENT_SECRET!.trim(),
        'Ocp-Apim-Subscription-Key': process.env.VIPPS_SUBSCRIPTION_KEY!.trim(),
        'Merchant-Serial-Number': process.env.VIPPS_MERCHANT_SERIAL!.trim(),
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
