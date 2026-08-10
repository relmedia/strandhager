import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  /** The secret from the guest's cancellation link. */
  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
