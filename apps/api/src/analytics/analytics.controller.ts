import { Body, Controller, Get, HttpCode, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';

import { Public } from '../auth/public.decorator';
import { AnalyticsService, parseRange } from './analytics.service';
import { TrackPageViewDto } from './dto/track.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /**
   * Public: the website's page-view tracker. Not throttled through the
   * database-backed guard — that would cost two writes per page view — and a
   * flood here only inflates a chart, it cannot reach anyone.
   */
  @Public()
  @Post('track')
  @HttpCode(204)
  async track(@Req() request: Request, @Body() dto: TrackPageViewDto): Promise<void> {
    await this.analytics.track(request, dto);
  }

  /** The reports page's figures for one period. */
  @Get()
  report(@Query('range') range?: string) {
    return this.analytics.report(parseRange(range));
  }
}
