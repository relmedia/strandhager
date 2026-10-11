import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class RateDto {
  @IsString()
  @MaxLength(60)
  label!: string;

  /** ISO weekdays: 1 is Monday through 7 is Sunday. */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  weekdays!: number[];

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  amount!: number;
}

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  maxGuests?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  cleaningFee?: number;

  @IsOptional()
  @IsInt({ message: 'Riggepris for full dag må være et tall' })
  @Min(0, { message: 'Riggepris for full dag kan ikke være negativ' })
  setupFullDayFee?: number;

  @IsOptional()
  @IsInt({ message: 'Riggepris for halv dag må være et tall' })
  @Min(0, { message: 'Riggepris for halv dag kan ikke være negativ' })
  setupHalfDayFee?: number;

  @IsOptional()
  @IsInt({ message: 'Parsellantrabatt må være et helt tall' })
  @Min(0, { message: 'Parsellantrabatt kan ikke være negativ' })
  @Max(100, { message: 'Parsellantrabatt kan ikke være over 100 %' })
  parcelOwnerDiscountPercent?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  priceNote?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  noticeDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  maxBookingDays?: number;

  /**
   * When false, guests can still see the availability calendar but cannot
   * book online — the board enters bookings manually instead.
   */
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  /** When present, replaces the whole price list. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RateDto)
  rates?: RateDto[];
}
