import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CabinsService } from './cabins.service';
import { CreateCabinDto } from './dto/create-cabin.dto';
import { UpdateCabinDto } from './dto/update-cabin.dto';

@Controller('cabins')
export class CabinsController {
  constructor(private readonly cabinsService: CabinsService) {}

  @Get()
  findAll() {
    return this.cabinsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cabinsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCabinDto) {
    return this.cabinsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCabinDto) {
    return this.cabinsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cabinsService.remove(id);
  }
}
