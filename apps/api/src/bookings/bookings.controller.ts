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

import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Public: registers a request for a set of days. */
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  /** Dashboard: enters a booking by hand on behalf of a guest. */
  @Post('manual')
  createManual(@Body() dto: ManualBookingDto) {
    return this.bookings.createManual(dto);
  }

  /** Public: opens a booking from the link the guest was given. */
  @Get('reference/:reference')
  findByReference(
    @Param('reference') reference: string,
    @Query('token') token: string,
  ) {
    return this.bookings.findByReference(reference, token);
  }

  /** Public: the guest calls off their own booking. */
  @Post('reference/:reference/cancel')
  cancelByToken(
    @Param('reference') reference: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookings.cancelByToken(reference, dto.token, dto.reason);
  }

  // Declared before ":id" so "summary" is not read as an id.
  @Get('summary')
  summary(@Query('space') space?: string) {
    return this.bookings.summary(space);
  }

  @Get()
  findAll(@Query() query: ListBookingsDto) {
    return this.bookings.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookings.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookings.remove(id);
  }
}
