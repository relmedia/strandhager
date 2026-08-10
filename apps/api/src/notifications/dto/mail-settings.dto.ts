import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class UpdateMailSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /** Empty means "keep the key that is already stored". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  apiKey?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Avsendernavn må fylles ut' })
  @MaxLength(80)
  fromName?: string;

  @IsOptional()
  @Transform(lower)
  @IsEmail({}, { message: 'Avsenderadressen ser ikke riktig ut' })
  fromEmail?: string;

  /** Empty clears it, which turns the board's copies off. */
  @IsOptional()
  @Transform(lower)
  @ValidateIf((_, value) => value !== '')
  @IsEmail({}, { message: 'Varslingsadressen ser ikke riktig ut' })
  notifyEmail?: string;
}

export class TestEmailDto {
  @Transform(lower)
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  to!: string;
}
