import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateTripletexSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  production?: boolean;

  /** Empty means "keep the token that is already stored". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  consumerToken?: string;

  /** Empty means "keep the token that is already stored". */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  employeeToken?: string;

  /** null clears the choice. */
  @IsOptional()
  @IsInt()
  vatTypeId?: number | null;

  @IsOptional()
  @IsInt()
  paymentTypeId?: number | null;

  @IsOptional()
  @IsBoolean()
  sendInvoice?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  dueDays?: number;
}
