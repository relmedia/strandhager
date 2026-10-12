import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { ContactService } from './contact.service';
import {
  CreateContactMessageDto,
  UpdateContactMessageDto,
} from './dto/contact.dto';
import { Public } from '../auth/public.decorator';
import { HOUR, Throttle, ThrottleGuard } from '../common/throttle';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public: the contact form on the website. */
  /** Public: the contact form on the website. */
  @Public()
  @UseGuards(ThrottleGuard)
  @Throttle({
    bucket: 'contact',
    limit: 5,
    windowMs: HOUR,
    message:
      'Du har sendt flere meldinger på kort tid. Vent en time før du sender en ny.',
  })
  @Post()
  create(@Body() dto: CreateContactMessageDto) {
    return this.contact.create(dto);
  }

  @Get()
  findAll() {
    return this.contact.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactMessageDto) {
    return this.contact.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contact.remove(id);
  }
}
