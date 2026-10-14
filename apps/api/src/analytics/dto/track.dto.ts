import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** What the website's tracker sends for one page load. */
export class TrackPageViewDto {
  @IsString()
  @Matches(/^\//)
  @MaxLength(200)
  path!: string;

  /** document.referrer; internal ones are dropped server-side. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string | null;
}
