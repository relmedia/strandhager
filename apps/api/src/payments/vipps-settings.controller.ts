import { BadRequestException, Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateVippsSettingsDto } from './dto/vipps-settings.dto';
import { VippsService } from './vipps.service';

const SETTINGS_ID = 'vipps';

const hint = (value: string | null) => (value ? `…${value.slice(-4)}` : null);

/** Innstillinger → Betaling. Dashboard-only, like every route not marked @Public. */
@Controller('payments/vipps')
export class VippsSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vipps: VippsService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.view();
  }

  @Patch('settings')
  async updateSettings(@Body() dto: UpdateVippsSettingsDto) {
    const data = {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.production !== undefined ? { production: dto.production } : {}),
      ...(dto.clientId !== undefined ? { clientId: dto.clientId || null } : {}),
      ...(dto.merchantSerial !== undefined ? { merchantSerial: dto.merchantSerial || null } : {}),
      // An empty secret field means "keep the one that is stored".
      ...(dto.clientSecret ? { clientSecret: dto.clientSecret } : {}),
      ...(dto.subscriptionKey ? { subscriptionKey: dto.subscriptionKey } : {}),
    };

    await this.prisma.vippsSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });
    this.vipps.invalidate();

    return this.view();
  }

  @Post('test')
  test() {
    return this.vipps.testConnection();
  }

  /**
   * Points Vipps at this API's webhook route. API_PUBLIC_URL wins when set;
   * otherwise the address the request came in on is used, which is the API's
   * own host because the dashboard proxy calls it directly.
   */
  // Not 'webhook': that path is the public route Vipps itself posts to.
  @Post('webhook/register')
  async registerWebhook(@Req() request: Request) {
    // Vercel terminates TLS in front of the API, so the scheme comes from its header.
    const protocol = request.get('x-forwarded-proto')?.split(',')[0]?.trim() || request.protocol;
    const base = (
      process.env.API_PUBLIC_URL?.trim() || `${protocol}://${request.get('host')}`
    ).replace(/\/+$/, '');
    const url = `${base}/payments/vipps/webhook`;

    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/)/.test(url)) {
      throw new BadRequestException(
        `Vipps kan ikke nå ${url}. Webhooken må registreres fra den publiserte løsningen.`,
      );
    }
    if (!url.startsWith('https://')) {
      throw new BadRequestException(`Vipps krever https. Adressen ble ${url}.`);
    }

    try {
      await this.vipps.registerWebhook(url);
    } catch (cause) {
      throw new BadRequestException(
        cause instanceof Error ? cause.message : 'Kunne ikke registrere webhooken',
      );
    }

    return this.view();
  }

  /** What the browser gets: everything except the secrets, plus a hint of each. */
  private async view() {
    const [row, config] = await Promise.all([this.vipps.stored(), this.vipps.config()]);
    const source = (stored: string | null | undefined, value: string | null) =>
      stored ? 'db' : value ? 'env' : null;

    return {
      // Before the page is first saved, a complete .env is what decides.
      enabled: row ? row.enabled : config.enabled && Boolean(
        config.clientId && config.clientSecret && config.subscriptionKey && config.merchantSerial,
      ),
      production: config.production,
      clientId: config.clientId,
      merchantSerial: config.merchantSerial,
      clientSecretHint: hint(config.clientSecret),
      subscriptionKeyHint: hint(config.subscriptionKey),
      sources: {
        clientId: source(row?.clientId, config.clientId),
        merchantSerial: source(row?.merchantSerial, config.merchantSerial),
        clientSecret: source(row?.clientSecret, config.clientSecret),
        subscriptionKey: source(row?.subscriptionKey, config.subscriptionKey),
      },
      complete: Boolean(
        config.clientId && config.clientSecret && config.subscriptionKey && config.merchantSerial,
      ),
      /** Whether payments are actually being taken right now. */
      active: await this.vipps.isConfigured(),
      mock: process.env.VIPPS_MOCK === 'true',
      webhook: {
        registered: Boolean(row?.webhookId),
        url: row?.webhookUrl ?? null,
        // A secret from .env means it was set up by hand at some point.
        manualSecret: !row?.webhookSecret && Boolean(config.webhookSecret),
      },
    };
  }
}
