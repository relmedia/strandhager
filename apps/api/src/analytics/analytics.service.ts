import { createHash, randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

import { clientIp } from '../common/client-ip';
import { PrismaService } from '../prisma/prisma.service';
import type { TrackPageViewDto } from './dto/track.dto';

export type AnalyticsRange = 'last-7-days' | 'last-4-weeks' | 'last-3-months' | 'year-to-date';

export function parseRange(value: string | undefined): AnalyticsRange {
  if (value === 'last-7-days' || value === 'last-3-months' || value === 'year-to-date') return value;
  return 'last-4-weeks';
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|preview/i;

/** A gap longer than this between two views starts a new session. */
const SESSION_GAP_MS = 30 * 60 * 1000;
const REALTIME_WINDOW_MINUTES = 30;
const TOP_ROWS = 6;

type Summary = { pageviews: number; visitors: number; sessions: number; engagedSessions: number };

function resolveRange(range: AnalyticsRange) {
  const to = new Date();
  let from: Date;

  if (range === 'year-to-date') {
    from = new Date(to.getFullYear(), 0, 1);
  } else {
    const days = range === 'last-7-days' ? 7 : range === 'last-4-weeks' ? 28 : 91;
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }

  // The comparison period is the same length, immediately before.
  const prevTo = from;
  const prevFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));

  return { from, to, prevFrom, prevTo };
}

/** Postgres counts come back as bigint; the dashboard wants plain numbers. */
const num = (value: unknown) => Number(value ?? 0);

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records one page view. Bots and malformed requests are dropped silently. */
  async track(request: Request, dto: TrackPageViewDto): Promise<void> {
    const userAgent = request.headers['user-agent'] ?? '';
    if (userAgent === '' || BOT_PATTERN.test(userAgent)) return;

    const visitorHash = this.visitorHash(clientIp(request), userAgent);
    const sessionId = await this.sessionFor(visitorHash);
    const { country, city } = readGeo(request);

    await this.prisma.pageView.create({
      data: {
        path: dto.path.split('?')[0].split('#')[0],
        referrer: externalReferrer(dto.referrer, request.headers.origin),
        visitorHash,
        sessionId,
        country,
        city,
      },
    });
  }

  /**
   * Anonymous visitor id: a salted hash of IP + user agent that rotates daily,
   * so no personal data is stored and nobody can be followed across days.
   */
  private visitorHash(ip: string, userAgent: string): string {
    const salt = process.env.ANALYTICS_SALT ?? process.env.AUTH_JWT_SECRET ?? '';
    const day = new Date().toISOString().slice(0, 10);
    return createHash('sha256')
      .update(`${salt}|${ip}|${userAgent}|${day}`)
      .digest('hex')
      .slice(0, 32);
  }

  /**
   * Sessions are worked out here rather than kept in the browser, so the site
   * stores nothing on the visitor's device: a view within 30 minutes of the
   * same visitor's last one continues that session.
   */
  private async sessionFor(visitorHash: string): Promise<string> {
    const recent = await this.prisma.pageView.findFirst({
      where: { visitorHash, createdAt: { gte: new Date(Date.now() - SESSION_GAP_MS) } },
      orderBy: { createdAt: 'desc' },
      select: { sessionId: true },
    });
    return recent?.sessionId ?? randomUUID();
  }

  async report(range: AnalyticsRange) {
    const { from, to, prevFrom, prevTo } = resolveRange(range);
    const realtimeFrom = new Date(Date.now() - REALTIME_WINDOW_MINUTES * 60_000);

    const [
      summary,
      previous,
      daily,
      topPages,
      referrers,
      realtime,
      realtimeSummary,
      countries,
      cities,
      bookings,
      previousBookings,
    ] = await Promise.all([
      this.summary(from, to),
      this.summary(prevFrom, prevTo),
      this.daily(from, to),
      this.prisma.$queryRaw<{ path: string; views: bigint; visitors: bigint }[]>`
        select path, count(*) as views, count(distinct "visitorHash") as visitors
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
        group by path
        order by views desc
        limit ${TOP_ROWS}`,
      this.prisma.$queryRaw<{ referrer: string | null; visitors: bigint; views: bigint }[]>`
        select referrer, count(distinct "visitorHash") as visitors, count(*) as views
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
        group by referrer
        order by visitors desc
        limit 50`,
      this.prisma.$queryRaw<{ minute: Date; visitors: bigint }[]>`
        select date_trunc('minute', "createdAt") as minute, count(distinct "visitorHash") as visitors
        from "PageView"
        where "createdAt" >= ${realtimeFrom}::timestamp
        group by 1
        order by 1`,
      this.summary(realtimeFrom, new Date()),
      this.prisma.$queryRaw<{ country: string; visitors: bigint }[]>`
        select country, count(distinct "visitorHash") as visitors
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
          and country is not null
        group by country
        order by visitors desc
        limit ${TOP_ROWS}`,
      this.prisma.$queryRaw<{ city: string; country: string | null; visitors: bigint }[]>`
        select city, country, count(distinct "visitorHash") as visitors
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
          and city is not null
        group by city, country
        order by visitors desc
        limit ${TOP_ROWS}`,
      this.prisma.booking.count({ where: { createdAt: { gte: from, lt: to } } }),
      this.prisma.booking.count({ where: { createdAt: { gte: prevFrom, lt: prevTo } } }),
    ]);

    return {
      range,
      summary,
      previous,
      daily,
      topPages: topPages.map((row) => ({
        path: row.path,
        views: num(row.views),
        visitors: num(row.visitors),
      })),
      referrers: referrers.map((row) => ({
        referrer: row.referrer,
        visitors: num(row.visitors),
        views: num(row.views),
      })),
      realtime: {
        windowMinutes: REALTIME_WINDOW_MINUTES,
        points: realtime.map((row) => ({
          minute: row.minute.toISOString(),
          visitors: num(row.visitors),
        })),
        visitors: realtimeSummary.visitors,
      },
      countries: countries.map((row) => ({ code: row.country, visitors: num(row.visitors) })),
      cities: cities.map((row) => ({
        city: row.city,
        countryCode: row.country,
        visitors: num(row.visitors),
      })),
      bookings,
      previousBookings,
    };
  }

  /** "Engaged" sessions are the ones that looked at more than one page. */
  private async summary(from: Date, to: Date): Promise<Summary> {
    const [row] = await this.prisma.$queryRaw<
      { pageviews: bigint; visitors: bigint; sessions: bigint; engaged: bigint }[]
    >`
      with in_range as (
        select "visitorHash", "sessionId"
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
      ),
      per_session as (
        select "sessionId", count(*) as views from in_range group by "sessionId"
      )
      select
        (select count(*) from in_range) as pageviews,
        (select count(distinct "visitorHash") from in_range) as visitors,
        (select count(*) from per_session) as sessions,
        (select count(*) from per_session where views > 1) as engaged`;

    return {
      pageviews: num(row?.pageviews),
      visitors: num(row?.visitors),
      sessions: num(row?.sessions),
      engagedSessions: num(row?.engaged),
    };
  }

  /** One row per Norwegian calendar day in the period, zero-filled. */
  private async daily(from: Date, to: Date) {
    const rows = await this.prisma.$queryRaw<
      { date: string; pageviews: bigint; visitors: bigint }[]
    >`
      with days as (
        select generate_series(
          (${from}::timestamptz at time zone 'Europe/Oslo')::date,
          (${to}::timestamptz at time zone 'Europe/Oslo')::date,
          interval '1 day'
        )::date as day
      ),
      views as (
        select ("createdAt" at time zone 'UTC' at time zone 'Europe/Oslo')::date as day, "visitorHash"
        from "PageView"
        where "createdAt" >= ${from}::timestamp and "createdAt" < ${to}::timestamp
      )
      select
        to_char(days.day, 'YYYY-MM-DD') as date,
        count(views."visitorHash") as pageviews,
        count(distinct views."visitorHash") as visitors
      from days
      left join views on views.day = days.day
      group by days.day
      order by days.day`;

    return rows.map((row) => ({
      date: row.date,
      pageviews: num(row.pageviews),
      visitors: num(row.visitors),
    }));
  }
}

/**
 * Vercel fills in geo headers on every request; locally there are none, so
 * both come back null and the geography card stays empty in development.
 */
function readGeo(request: Request): { country: string | null; city: string | null } {
  const rawCountry = request.headers['x-vercel-ip-country'];
  const country =
    typeof rawCountry === 'string' && /^[A-Z]{2}$/i.test(rawCountry)
      ? rawCountry.toUpperCase()
      : null;

  const rawCity = request.headers['x-vercel-ip-city'];
  let city: string | null = null;
  if (typeof rawCity === 'string' && rawCity) {
    try {
      city = decodeURIComponent(rawCity).slice(0, 100);
    } catch {
      city = null;
    }
  }

  return { country, city };
}

/**
 * Keeps only the referring site's hostname, and only when it is another site:
 * clicks between pages on the website itself count as direct.
 */
function externalReferrer(referrer: string | null | undefined, origin: string | undefined) {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    const ownHost = origin ? new URL(origin).hostname.replace(/^www\./, '') : null;
    if (host === ownHost || host === 'localhost') return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}
