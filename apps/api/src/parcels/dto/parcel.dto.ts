import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateParcelDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  number!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateParcelDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  number?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  /** Null frees the plot up, which is how an ownership is ended. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  ownerId?: string | null;
}

/** Records a file that /media has already accepted and stored. */
export class AddParcelDocumentDto {
  @IsString()
  @MinLength(1, { message: 'Dokumentet må ha et navn' })
  @MaxLength(160, { message: 'Navnet kan være maks 160 tegn' })
  title!: string;

  /**
   * Where the upload put it. Restricted to the documents folder so this cannot
   * be used to point a parcel at an arbitrary address.
   */
  @IsString()
  @Matches(/^(\/dokumenter\/|https:\/\/)/, {
    message: 'Lenken må peke på et opplastet dokument',
  })
  @MaxLength(500)
  url!: string;
}
