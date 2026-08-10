import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CreatePageDto } from './dto/create-page.dto';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('pages')
  findAll() {
    return this.cmsService.findAll();
  }

  @Get('pages/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.cmsService.findBySlug(slug);
  }

  @Post('pages')
  create(@Body() dto: CreatePageDto) {
    return this.cmsService.create(dto);
  }
}
