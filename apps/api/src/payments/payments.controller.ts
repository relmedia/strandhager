import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  /**
   * Vipps calls this when a payment changes state. Register the URL with the
   * Webhooks API and put the returned secret in VIPPS_WEBHOOK_SECRET so the
   * signature can be checked.
   */
  @Post('vipps/webhook')
  @HttpCode(200)
  async vippsWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
  ) {
    if (!verifyVippsSignature(request)) {
      this.logger.warn('Avviste Vipps-webhook med ugyldig signatur');
      throw new UnauthorizedException();
    }

    await this.payments.handleVippsEvent(body);
    return { ok: true };
  }
}

/**
 * Vipps signs webhook requests with HMAC-SHA256 over the method, path and a
 * few headers, keyed with the secret from the webhook registration. Without a
 * configured secret (local development, before registration) the check is
 * skipped.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/request-authentication/
 */
function verifyVippsSignature(request: RawBodyRequest<Request>): boolean {
  const secret = process.env.VIPPS_WEBHOOK_SECRET?.trim();
  if (!secret) return true;

  const raw = request.rawBody;
  if (!raw) return false;

  const contentHash = createHash('sha256').update(raw).digest('base64');
  if (contentHash !== request.headers['x-ms-content-sha256']) return false;

  const date = request.headers['x-ms-date'];
  const host = request.headers.host;
  if (typeof date !== 'string' || typeof host !== 'string') return false;

  const signedString = `POST\n${request.originalUrl}\n${date};${host};${contentHash}`;
  const expected = createHmac('sha256', secret).update(signedString).digest();

  const match = /Signature=([A-Za-z0-9+/=]+)/.exec(String(request.headers.authorization ?? ''));
  if (!match) return false;

  const received = Buffer.from(match[1], 'base64');
  return received.length === expected.length && timingSafeEqual(received, expected);
}
