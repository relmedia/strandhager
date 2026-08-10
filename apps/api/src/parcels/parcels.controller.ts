import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { ParcelsService } from './parcels.service';
import { CreateParcelDto, UpdateParcelDto } from './dto/parcel.dto';

@Controller('parcels')
export class ParcelsController {
  constructor(private readonly parcels: ParcelsService) {}

  @Get()
  findAll() {
    return this.parcels.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parcels.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateParcelDto) {
    return this.parcels.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateParcelDto) {
    return this.parcels.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parcels.remove(id);
  }
}
