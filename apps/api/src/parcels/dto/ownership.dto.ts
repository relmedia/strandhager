import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Blank fields from a form mean "not set" rather than an empty date. */
const emptyToNull = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

export class CreateOwnershipDto {
  @IsString()
  parcellantId!: string;

  /** The day they took the plot over. */
  @Matches(ISO_DATE, { message: `startedAt ${MESSAGE}` })
  startedAt!: string;

  /** Left out while they still own it. */
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE, { message: `endedAt ${MESSAGE}` })
  endedAt?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateOwnershipDto {
  @IsOptional()
  @IsString()
  parcellantId?: string;

  @IsOptional()
  @Matches(ISO_DATE, { message: `startedAt ${MESSAGE}` })
  startedAt?: string;

  /** Null reopens the spell, which is how a sale is undone. */
  @IsOptional()
  @Transform(emptyToNull)
  @ValidateIf((_, value) => value !== null)
  @Matches(ISO_DATE, { message: `endedAt ${MESSAGE}` })
  endedAt?: string | null;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  notes?: string;
}
