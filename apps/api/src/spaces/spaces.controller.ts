import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Get()
  findAll() {
    return this.spaces.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.spaces.publicView(slug);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateSpaceDto) {
    return this.spaces.update(slug, dto);
  }
}
