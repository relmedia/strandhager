import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { TripletexSettings } from '@cabin/database';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateTripletexSettingsDto } from './dto/tripletex-settings.dto';
import { SETTINGS_ID, TripletexClient, TripletexError } from './tripletex.client';
import { TripletexService } from './tripletex.service';

const hint = (value: string | null | undefined) => (value ? `…${value.slice(-4)}` : null);

/** Innstillinger → Regnskap, and the booking page's retry button. Dashboard-only. */
@Controller('tripletex')
export class TripletexController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly client: TripletexClient,
    private readonly tripletex: TripletexService,
  ) {}

  @Get('settings')
  async getSettings() {
    return view(await this.client.settings());
  }

  @Patch('settings')
  async updateSettings(@Body() dto: UpdateTripletexSettingsDto) {
    const data = {
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.production !== undefined ? { production: dto.production } : {}),
      ...(dto.vatTypeId !== undefined ? { vatTypeId: dto.vatTypeId } : {}),
      ...(dto.paymentTypeId !== undefined ? { paymentTypeId: dto.paymentTypeId } : {}),
      ...(dto.sendInvoice !== undefined ? { sendInvoice: dto.sendInvoice } : {}),
      ...(dto.dueDays !== undefined ? { dueDays: dto.dueDays } : {}),
      // An empty token field means "keep the one that is stored".
      ...(dto.consumerToken ? { consumerToken: dto.consumerToken } : {}),
      ...(dto.employeeToken ? { employeeToken: dto.employeeToken } : {}),
    };

    // VAT and payment type ids belong to one company in one environment.
    const before = await this.client.settings();
    const switched = dto.production !== undefined && before && dto.production !== before.production;

    const settings = await this.prisma.tripletexSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: switched ? { ...data, vatTypeId: null, paymentTypeId: null } : data,
    });
    this.client.invalidate();

    return view(settings);
  }

  /** Logs in and names the company, so the board can see it is the right one. */
  @Post('test')
  async test() {
    try {
      const whoAmI = await this.client.one<{
        company?: { name?: string };
        employee?: { firstName?: string; lastName?: string };
      }>('/token/session/>whoAmI', { fields: 'company(name),employee(firstName,lastName)' });

      const employee = [whoAmI.employee?.firstName, whoAmI.employee?.lastName]
        .filter(Boolean)
        .join(' ');
      return {
        ok: true,
        message: `Koblet til ${whoAmI.company?.name ?? 'Tripletex'}${employee ? ` som ${employee}` : ''}.`,
      };
    } catch (cause) {
      return {
        ok: false,
        message: cause instanceof TripletexError ? cause.message : 'Kunne ikke nå Tripletex.',
      };
    }
  }

  /** The choices for the VAT and payment type dropdowns, from the company itself. */
  @Get('options')
  async options() {
    try {
      const [vatTypes, paymentTypes] = await Promise.all([
        this.client.many<{ id: number; number: string; name: string }>('/ledger/vatType', {
          fields: 'id,number,name',
          count: 500,
        }),
        this.client.many<{ id: number; description: string }>('/invoice/paymentType', {
          fields: 'id,description',
          count: 100,
        }),
      ]);
      return {
        ok: true,
        vatTypes: vatTypes.map((type) => ({ id: type.id, label: `${type.number} – ${type.name}` })),
        paymentTypes: paymentTypes.map((type) => ({ id: type.id, label: type.description })),
      };
    } catch (cause) {
      return {
        ok: false,
        message: cause instanceof TripletexError ? cause.message : 'Kunne ikke nå Tripletex.',
        vatTypes: [],
        paymentTypes: [],
      };
    }
  }

  /** Sends a booking (again): the retry button, and older bookings from before the connection. */
  @Post('bookings/:id/sync')
  sync(@Param('id') id: string) {
    return this.tripletex.syncAndReport(id);
  }
}

/** What the browser gets: everything except the tokens, plus a hint of each. */
function view(settings: TripletexSettings | null) {
  return {
    enabled: settings?.enabled ?? false,
    production: settings?.production ?? false,
    consumerTokenHint: hint(settings?.consumerToken),
    employeeTokenHint: hint(settings?.employeeToken),
    complete: Boolean(settings?.consumerToken && settings.employeeToken),
    vatTypeId: settings?.vatTypeId ?? null,
    paymentTypeId: settings?.paymentTypeId ?? null,
    sendInvoice: settings?.sendInvoice ?? false,
    dueDays: settings?.dueDays ?? 14,
  };
}
