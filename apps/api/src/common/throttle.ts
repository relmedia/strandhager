import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../prisma/prisma.service';
import { clientIp } from './client-ip';

export const THROTTLE = 'throttle';

export type ThrottleRule = {
  /** Groups the counter, so one form's traffic cannot exhaust another's. */
  bucket: string;
  /** Requests allowed per window, per caller. */
  limit: number;
  windowMs: number;
  /** Shown to whoever trips it; already in Norwegian. */
  message: string;
};

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** Caps how often one caller may hit a public endpoint. */
export const Throttle = (rule: ThrottleRule) => SetMetadata(THROTTLE, rule);

/**
 * A fixed-window counter kept in the database.
 *
 * Fixed rather than sliding: it is a handful of rows and one upsert per
 * request, and the worst case — twice the limit across a window boundary — is
 * irrelevant when the point is to stop a flood rather than meter an API.
 *
 * Counting happens before the handler runs, so a request that is going to fail
 * validation still costs the caller one slot. That is deliberate: otherwise a
 * flood of malformed requests would be free.
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.getAllAndOverride<ThrottleRule | undefined>(THROTTLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rule) return true;

    const request = context.switchToHttp().getRequest();
    const key = `${rule.bucket}:${clientIp(request)}`;
    const now = new Date();
    const windowOpenedAfter = new Date(now.getTime() - rule.windowMs);

    const existing = await this.prisma.requestThrottle.findUnique({ where: { key } });
    const withinWindow = existing
      ? existing.windowStartedAt.getTime() > windowOpenedAfter.getTime()
      : false;

    const count = withinWindow ? existing!.count + 1 : 1;

    await this.prisma.requestThrottle.upsert({
      where: { key },
      create: { key, count: 1, windowStartedAt: now },
      update: withinWindow
        ? { count }
        : // The old window has closed; start a fresh one.
          { count: 1, windowStartedAt: now },
    });

    if (count > rule.limit) {
      throw new HttpException(rule.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
