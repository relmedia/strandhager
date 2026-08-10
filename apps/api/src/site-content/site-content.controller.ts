import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
} from '@nestjs/common';
import { SiteContentService } from './site-content.service';

const SECTION_KEYS = [
  'general',
  'nav',
  'hero',
  'utleie',
  'parsellene',
  'location',
  'contact',
  'footer',
  'galleries',
] as const;

@Controller('site-content')
export class SiteContentController {
  constructor(private readonly siteContent: SiteContentService) {}

  @Get()
  findAll() {
    return this.siteContent.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.siteContent.findOne(key);
  }

  @Put(':key')
  upsert(@Param('key') key: string, @Body() body: { data?: unknown }) {
    if (!SECTION_KEYS.includes(key as (typeof SECTION_KEYS)[number])) {
      throw new BadRequestException(`Unknown section "${key}"`);
    }
    if (body?.data === undefined || body.data === null || typeof body.data !== 'object') {
      throw new BadRequestException('Body must be { data: object | array }');
    }
    return this.siteContent.upsert(key, body.data as object);
  }
}
