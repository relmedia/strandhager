import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateGuestDto {
  @IsOptional()
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;
}
