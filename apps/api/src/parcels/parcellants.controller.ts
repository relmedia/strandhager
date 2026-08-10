import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ParcellantsService } from './parcellants.service';
import { CreateParcellantDto, UpdateParcellantDto } from './dto/parcellant.dto';

@Controller('parcellants')
export class ParcellantsController {
  constructor(private readonly parcellants: ParcellantsService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.parcellants.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parcellants.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateParcellantDto) {
    return this.parcellants.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateParcellantDto) {
    return this.parcellants.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parcellants.remove(id);
  }
}
