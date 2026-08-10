import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateOwnershipDto, UpdateOwnershipDto } from './dto/ownership.dto';
import { OwnershipsService } from './ownerships.service';

/** Who has owned a plot over the years, and who owns it now. */
@Controller()
export class OwnershipsController {
  constructor(private readonly ownerships: OwnershipsService) {}

  @Get('parcels/:parcelId/ownerships')
  findForParcel(@Param('parcelId') parcelId: string) {
    return this.ownerships.findForParcel(parcelId);
  }

  @Get('parcellants/:parcellantId/ownerships')
  findForParcellant(@Param('parcellantId') parcellantId: string) {
    return this.ownerships.findForParcellant(parcellantId);
  }

  @Post('parcels/:parcelId/ownerships')
  create(@Param('parcelId') parcelId: string, @Body() dto: CreateOwnershipDto) {
    return this.ownerships.create(parcelId, dto);
  }

  @Patch('ownerships/:id')
  update(@Param('id') id: string, @Body() dto: UpdateOwnershipDto) {
    return this.ownerships.update(id, dto);
  }

  @Delete('ownerships/:id')
  remove(@Param('id') id: string) {
    return this.ownerships.remove(id);
  }
}
