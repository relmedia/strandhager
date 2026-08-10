import { BookingStatus, PaymentStatus } from '@cabin/database';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

/** Changes an administrator can make from the dashboard. */
export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus, { message: 'Ukjent status' })
  status?: BookingStatus;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Ukjent betalingsstatus' })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @Matches(ISO_DATE, { message: `startDate ${MESSAGE}` })
  startDate?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: `endDate ${MESSAGE}` })
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  guests?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  purpose?: string;

  /** Internal remarks, never shown to the guest. */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /** Recorded when the status is set to cancelled or declined. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
