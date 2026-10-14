import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

const trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class LoginDto {
  @trim()
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Passordet må være minst 8 tegn' })
  password!: string;
}

export class VerifyCodeDto {
  @IsString()
  challengeId!: string;

  @trim()
  @IsString()
  @Length(6, 6, { message: 'Koden skal være seks siffer' })
  code!: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Det nye passordet må være minst 8 tegn' })
  newPassword!: string;
}

export class SetTwoFactorDto {
  @IsBoolean()
  enabled!: boolean;

  /** Required to turn it off, so a stolen session cannot strip the protection. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;
}

export class InviteUserDto {
  @trim()
  @IsEmail({}, { message: 'E-postadressen ser ikke riktig ut' })
  email!: string;

  @trim()
  @IsString()
  @MinLength(2, { message: 'Skriv inn navnet på brukeren' })
  name!: string;
}
