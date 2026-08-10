import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ContactMessage } from '@cabin/database';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateContactMessageDto,
  UpdateContactMessageDto,
} from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * A message from the form on the website. It is stored first, so nothing is
   * lost when mail is down, and then sent on to the board's inbox.
   */
  async create(dto: CreateContactMessageDto) {
    await assertHuman(dto.turnstileToken);

    const entry = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        subject: dto.subject || null,
        message: dto.message,
      },
    });

    this.notifications.notifyContactMessage(entry);

    // The sender only needs to know it arrived.
    return { received: true, name: entry.name };
  }

  /** Newest first, since the fresh ones are the ones waiting for an answer. */
  async findAll() {
    const entries = await this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return entries.map(toView);
  }

  async update(id: string, dto: UpdateContactMessageDto) {
    await this.assertExists(id);

    const entry = await this.prisma.contactMessage.update({
      where: { id },
      data: { ...(dto.status !== undefined ? { status: dto.status } : {}) },
    });

    return toView(entry);
  }

  async remove(id: string) {
    await this.assertExists(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertExists(id: string) {
    const entry = await this.prisma.contactMessage.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!entry) {
      throw new NotFoundException('Fant ingen henvendelse med denne id-en');
    }
  }
}

/**
 * Checks the Cloudflare Turnstile token, so bots cannot pump messages into
 * the board's inbox. Skipped entirely until TURNSTILE_SECRET_KEY is set.
 */
async function assertHuman(token?: string): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return;

  if (!token) {
    throw new BadRequestException('Bekreft at du ikke er en robot først');
  }

  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    },
  );

  const verdict = (await response.json().catch(() => null)) as {
    success?: boolean;
  } | null;

  if (!verdict?.success) {
    throw new BadRequestException('Robotsjekken feilet. Prøv igjen.');
  }
}

function toView(entry: ContactMessage) {
  return {
    id: entry.id,
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    subject: entry.subject,
    message: entry.message,
    status: entry.status,
    createdAt: entry.createdAt.toISOString(),
  };
}
