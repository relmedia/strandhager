import { Transform } from 'class-transformer';
import {
  Equals,
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

export class CreateBookingDto {
  @IsString()
  space!: string;

  /** First rented day, inclusive. */
  @Matches(ISO_DATE, { message: `startDate ${MESSAGE}` })
  startDate!: string;

  /** Last rented day, also inclusive: a single day has the same start and end. */
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

  /** What the space is being rented for, e.g. "Bryllup". */
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(120)
  purpose?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /** The rental terms must be ticked; the moment is stored as proof. */
  @Equals(true, { message: 'Du må godta leievilkårene før du kan booke' })
  acceptTerms!: boolean;

  /**
   * The hand-drawn signature as a PNG data URL. A signed 700x140 canvas is
   * usually 5-30 kB of base64, so the cap leaves plenty of headroom without
   * letting anyone stuff megabytes into the column.
   */
  @Matches(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/, {
    message: 'Du må signere leievilkårene før du kan booke',
  })
  @MaxLength(200_000, { message: 'Signaturen er for stor. Prøv på nytt.' })
  signature!: string;
}
