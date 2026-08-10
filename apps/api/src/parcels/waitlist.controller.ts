import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { WaitlistService } from './waitlist.service';
import {
  AssignParcelDto,
  CreateWaitlistEntryDto,
  UpdateWaitlistEntryDto,
  WaitlistSignupDto,
} from './dto/waitlist.dto';

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
