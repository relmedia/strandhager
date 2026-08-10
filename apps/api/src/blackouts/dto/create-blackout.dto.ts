import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

export class CreateBlackoutDto {
  @IsString()
  space!: string;

  /** First closed day, inclusive. */
  @Matches(ISO_DATE, { message: `startDate ${MESSAGE}` })
  startDate!: string;

  /** Last closed day, also inclusive: one day has the same start and end. */
  @Matches(ISO_DATE, { message: `endDate ${MESSAGE}` })
  endDate!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  reason?: string;
}
