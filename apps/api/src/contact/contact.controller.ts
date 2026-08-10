import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { ContactService } from './contact.service';
import {
  CreateContactMessageDto,
  UpdateContactMessageDto,
} from './dto/contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public: the contact form on the website. */
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
