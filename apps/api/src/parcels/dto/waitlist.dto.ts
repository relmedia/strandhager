import { WaitlistStatus } from '@cabin/database';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateWaitlistEntryDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Fornavn må fylles ut' })
  @MaxLength(80)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Etternavn må fylles ut' })
  @MaxLength(80)
  lastName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/**
 * What a visitor may send from the website. Deliberately narrower than the
 * dashboard's version: the internal notes and the status are not theirs to set.
 */
export class WaitlistSignupDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Fornavn må fylles ut' })
  @MaxLength(80)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Etternavn må fylles ut' })
  @MaxLength(80)
  lastName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class UpdateWaitlistEntryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Fornavn må fylles ut' })
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Etternavn må fylles ut' })
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsEnum(WaitlistStatus, { message: 'Ukjent status' })
  status?: WaitlistStatus;
}

/** Turns someone on the list into a parsellant, and hands them a plot. */
export class AssignParcelDto {
  @IsString()
  parcelId!: string;
}
