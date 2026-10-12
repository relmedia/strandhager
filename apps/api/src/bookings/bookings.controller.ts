import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsDto } from './dto/list-bookings.dto';
import { ManualBookingDto } from './dto/manual-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Public } from '../auth/public.decorator';
import { HOUR, Throttle, ThrottleGuard } from '../common/throttle';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  /** Public: registers a request for a set of days. */
  @Public()
  @UseGuards(ThrottleGuard)
  @Throttle({
    bucket: 'booking',
    limit: 10,
    windowMs: HOUR,
    message:
      'Du har sendt mange bookingforespørsler på kort tid. Vent en time, eller ta kontakt med oss direkte.',
  })
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  /** Dashboard: enters a booking by hand on behalf of a guest. */
  @Post('manual')
  createManual(@Body() dto: ManualBookingDto) {
    return this.bookings.createManual(dto);
  }

  /** Public: opens a booking from the link the guest was given, which
   *  carries its own cancelToken — that is what authorises this, not a login. */
  @Public()
  @Get('reference/:reference')
  findByReference(
    @Param('reference') reference: string,
    @Query('token') token: string,
  ) {
    return this.bookings.findByReference(reference, token);
  }

  /** Public: the guest calls off their own booking, again on the strength of
   *  the token in their link. */
  @Public()
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
