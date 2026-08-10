import { BookingStatus } from '@cabin/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

export class ListBookingsDto {
  @IsOptional()
  @IsString()
  space?: string;

  @IsOptional()
  @IsEnum(BookingStatus, { message: 'Ukjent status' })
  status?: BookingStatus;

  /** Only bookings touching this range, used by the calendar. */
  @IsOptional()
  @Matches(ISO_DATE, { message: `from ${MESSAGE}` })
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: `to ${MESSAGE}` })
  to?: string;

  /** Free text over reference, name and email. */
  @IsOptional()
  @IsString()
  q?: string;

  // Query strings arrive as text, so it has to be converted before validating.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  take?: number;
}
