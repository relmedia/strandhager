import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

/** Digits only, with an optional country code in front. */
const PHONE = /^\+?\d{8,15}$/;

const trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/**
 * A booking entered by hand in the dashboard, on behalf of a guest who got in
 * touch by phone or e-mail. No terms box and no signature: the agreement is
 * made outside the website. Works regardless of whether online booking is on.
 */
export class ManualBookingDto {
  @IsString()
  space!: string;

  @Matches(ISO_DATE, { message: `startDate ${MESSAGE}` })
  startDate!: string;

  @Matches(ISO_DATE, { message: `endDate ${MESSAGE}` })
  endDate!: string;

  @IsInt({ message: 'Antall gjester må være et tall' })
  @Min(1, { message: 'Det må være minst én gjest' })
  guests!: number;

  @trim()
  @IsString()
  @MinLength(2, { message: 'Fornavn må fylles ut' })
  @MaxLength(80)
  firstName!: string;

  @trim()
  @IsString()
  @MinLength(2, { message: 'Etternavn må fylles ut' })
  @MaxLength(80)
  lastName!: string;

  @trim()
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  @MaxLength(200)
  email!: string;

  @trim()
  @Matches(PHONE, {
    message: 'Telefonnummeret må skrives med tall, for eksempel 95782508',
  })
  phone!: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  company?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  purpose?: string;

  /** Internal dashboard notes, never shown to the guest. */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /** Whether the guest should get the confirmation e-mail. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  notify?: boolean;

  /** The administrator entering the booking; signs the agreement electronically. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  confirmedByName?: string;
}
