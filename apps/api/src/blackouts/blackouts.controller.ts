import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';

import { BlackoutsService } from './blackouts.service';
import { CreateBlackoutDto } from './dto/create-blackout.dto';
import { ListBlackoutsDto } from './dto/list-blackouts.dto';

@Controller('blackouts')
export class BlackoutsController {
  constructor(private readonly blackouts: BlackoutsService) {}

  @Get()
  findAll(@Query() query: ListBlackoutsDto) {
    return this.blackouts.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateBlackoutDto) {
    return this.blackouts.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blackouts.remove(id);
  }
}
