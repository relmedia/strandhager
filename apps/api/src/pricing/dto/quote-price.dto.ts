import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import type { SetupOption } from '../quote';

export const SETUP_OPTIONS: SetupOption[] = ['NONE', 'HALF_DAY', 'FULL_DAY'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

export class QuotePriceDto {
  @IsString()
  space!: string;

  @Matches(ISO_DATE, { message: `from ${MESSAGE}` })
  from!: string;

  @Matches(ISO_DATE, { message: `to ${MESSAGE}` })
  to!: string;

  /** Whether to also hold the day before for setting up. */
  @IsOptional()
  @IsIn(SETUP_OPTIONS, { message: 'Ugyldig valg for rigging' })
  setup?: SetupOption;
}

/**
 * The same quote, asked for with a POST so the booker's email travels in the
 * body. An email in a query string would end up in access logs, browser
 * history and referrer headers, which is not where a member's address belongs.
 */
export class QuotePriceBodyDto extends QuotePriceDto {
  @IsOptional()
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  @MaxLength(160)
  email?: string;
}
