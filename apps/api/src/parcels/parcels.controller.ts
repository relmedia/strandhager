import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { ParcelsService } from './parcels.service';
import {
  AddParcelDocumentDto,
  CreateParcelDto,
  UpdateParcelDto,
} from './dto/parcel.dto';

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

  @Post(':id/documents')
  addDocument(@Param('id') id: string, @Body() dto: AddParcelDocumentDto) {
    return this.parcels.addDocument(id, dto);
  }

  @Delete(':id/documents/:documentId')
  removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.parcels.removeDocument(id, documentId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parcels.remove(id);
  }
}
