import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { WaitlistService } from './waitlist.service';
import {
  AssignParcelDto,
  CreateWaitlistEntryDto,
  UpdateWaitlistEntryDto,
  WaitlistSignupDto,
} from './dto/waitlist.dto';
import { Public } from '../auth/public.decorator';
import { HOUR, Throttle, ThrottleGuard } from '../common/throttle';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Get()
  findAll() {
    return this.waitlist.findAll();
  }

  @Post()
  create(@Body() dto: CreateWaitlistEntryDto) {
    return this.waitlist.create(dto);
  }

  /** The form on the website. Answers with their place in the queue, nothing else. */
  /** Public: the interest-list form on the website. */
  @Public()
  @UseGuards(ThrottleGuard)
  @Throttle({
    bucket: 'waitlist',
    limit: 3,
    windowMs: HOUR,
    message:
      'Du har allerede sendt inn flere påmeldinger. Vent en time, eller ta kontakt med styret.',
  })
  @Post('signup')
  signUp(@Body() dto: WaitlistSignupDto) {
    return this.waitlist.signUp(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWaitlistEntryDto) {
    return this.waitlist.update(id, dto);
  }

  /** Makes them a parsellant and hands them the plot in one go. */
  @Post(':id/parcel')
  assignParcel(@Param('id') id: string, @Body() dto: AssignParcelDto) {
    return this.waitlist.assignParcel(id, dto.parcelId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waitlist.remove(id);
  }
}
