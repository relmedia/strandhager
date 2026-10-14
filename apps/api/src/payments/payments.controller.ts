import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Param,
  Post,
  Req,
  UnauthorizedException,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';

import { PaymentsService } from './payments.service';
import { VippsService } from './vipps.service';
import { Public } from '../auth/public.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly vipps: VippsService,
  ) {}

  /** Dashboard: sends the full amount back to the guest through Vipps. */
  @Post('bookings/:id/refund')
  refund(@Param('id') id: string) {
    return this.payments.refundBooking(id);
  }

  /**
   * Vipps calls this when a payment changes state. Registering it from
   * Innstillinger → Betaling stores the signing secret; VIPPS_WEBHOOK_SECRET
   * still works as a fallback.
   */
  /** Public: Vipps posts here. Authenticated by its HMAC signature, not a
   *  login, which is why the raw body is kept. */
  @Public()
  @Post('vipps/webhook')
  @HttpCode(200)
  async vippsWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
  ) {
    const secret = await this.vipps.webhookSecret();

    // Fail closed: without a secret there is no way to tell Vipps from anyone
    // else. Only VIPPS_MOCK, which never touches real money, runs without one.
    if (!secret && !this.vipps.isMock) {
      this.logger.warn(
        'Avviste Vipps-webhook: ingen webhook-hemmelighet er satt. Registrer webhooken under Innstillinger → Betaling.',
      );
      throw new UnauthorizedException();
    }

    if (secret && !verifyVippsSignature(request, secret)) {
      this.logger.warn('Avviste Vipps-webhook med ugyldig signatur');
      throw new UnauthorizedException();
    }

    await this.payments.handleVippsEvent(body ?? {});
    return { ok: true };
  }
}

/**
 * Vipps signs webhook requests with HMAC-SHA256 over the method, path and a
 * few headers, keyed with the secret from the webhook registration.
 *
 * Docs: https://developer.vippsmobilepay.com/docs/APIs/webhooks-api/request-authentication/
 */
function verifyVippsSignature(request: RawBodyRequest<Request>, secret: string): boolean {

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
