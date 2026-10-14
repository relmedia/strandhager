import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateVippsSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  production?: boolean;

  /** Empty clears it, so the .env value (if any) is used instead. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  clientId?: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^\d*$/, { message: 'MSN skal bare være sifre' })
  @MaxLength(20)
  merchantSerial?: string;

  /** Empty means "keep the secret that is already stored". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  clientSecret?: string;

  /** Empty means "keep the key that is already stored". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  subscriptionKey?: string;
}
