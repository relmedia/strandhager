import { ContactStatus } from '@cabin/database';
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

/** What a visitor may send from the contact form on the website. */
export class CreateContactMessageDto {
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Navn må fylles ut' })
  @MaxLength(120)
  name!: string;

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
  @MaxLength(150)
  subject?: string;

  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Meldingen kan ikke være tom' })
  @MaxLength(3000)
  message!: string;

  /** Proof from the Cloudflare Turnstile widget that the sender is a person. */
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  turnstileToken?: string;
}

export class UpdateContactMessageDto {
  @IsOptional()
  @IsEnum(ContactStatus, { message: 'Ukjent status' })
  status?: ContactStatus;
}
