import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Public } from '../auth/public.decorator';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Get()
  findAll() {
    return this.spaces.findAll();
  }

  /** Public: the booking panel's configuration. */
  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.spaces.publicView(slug);
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateSpaceDto) {
    return this.spaces.update(slug, dto);
  }
}
