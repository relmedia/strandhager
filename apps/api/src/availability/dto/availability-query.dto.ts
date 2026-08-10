import { IsOptional, IsString, Matches } from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MESSAGE = 'må være en dato på formen ÅÅÅÅ-MM-DD';

export class AvailabilityQueryDto {
  @IsString()
  space!: string;

  @Matches(ISO_DATE, { message: `from ${MESSAGE}` })
  from!: string;

  @Matches(ISO_DATE, { message: `to ${MESSAGE}` })
  to!: string;

  /** Lets an admin re-check a range while ignoring the booking being edited. */
  @IsOptional()
  @IsString()
  exclude?: string;
}
