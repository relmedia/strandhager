import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateOrgSettingsDto {
  /** Who new rental agreements name as the letting party. */
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Navnet kan være maks 120 tegn' })
  landlordName?: string;

  /** Contact lines printed under the name, one per line. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6, { message: 'Maks seks kontaktlinjer' })
  @IsString({ each: true })
  @MaxLength(120, { each: true, message: 'Hver linje kan være maks 120 tegn' })
  landlordLines?: string[];
}
