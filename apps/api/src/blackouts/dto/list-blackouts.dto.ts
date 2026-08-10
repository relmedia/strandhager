import { IsOptional, IsString, Matches } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

export class ListBlackoutsDto {
  @IsOptional()
  @IsString()
  space?: string;

  /** Only closures that reach into this day or later. */
  @IsOptional()
  @Matches(ISO_DATE, { message: `from ${MESSAGE}` })
  from?: string;

  /** Only closures that start on this day or earlier. */
  @IsOptional()
  @Matches(ISO_DATE, { message: `to ${MESSAGE}` })
  to?: string;
}
