import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  InviteUserDto,
  SetTwoFactorDto,
  VerifyCodeDto,
} from './dto/login.dto';
import { Public } from './public.decorator';
import { MINUTE, Throttle, ThrottleGuard } from '../common/throttle';

/**
 * Per address, not per account: the per-account pause in AuthService stops
 * guessing one password, this stops one machine spraying many accounts.
 */
const LOGIN_LIMIT = {
  limit: 20,
  windowMs: 15 * MINUTE,
  message: 'For mange innloggingsforsøk fra denne adressen. Vent et kvarter og prøv igjen.',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Public: the password check that issues the token in the first place. */
  @Public()
  // The throttle runs first, so a blocked caller never reaches the password check.
  @UseGuards(ThrottleGuard, AuthGuard('local'))
  @Throttle({ bucket: 'login', ...LOGIN_LIMIT })
  @Post('login')
  login(@Request() req: { user: { id: string; email: string; name: string } }) {
    return this.authService.login(req.user);
  }

  /** Public: second step of login, before any token exists. */
  @Public()
  @UseGuards(ThrottleGuard)
  @Throttle({ bucket: 'login-verify', ...LOGIN_LIMIT })
  @Post('verify')
  verify(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto.challengeId, dto.code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Request() req: { user: { id: string; email: string; name: string } }) {
    return this.authService.me(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('users')
  users() {
    return this.authService.listUsers();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('users')
  invite(@Body() dto: InviteUserDto) {
    return this.authService.inviteUser(dto.email, dto.name);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('users/:id')
  deleteUser(
    @Request() req: { user: { id: string; email: string; name: string } },
    @Param('id') id: string,
  ) {
    return this.authService.deleteUser(req.user.id, id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('two-factor')
  setTwoFactor(
    @Request() req: { user: { id: string; email: string; name: string } },
    @Body() dto: SetTwoFactorDto,
  ) {
    return this.authService.setTwoFactor(req.user.id, dto.enabled, dto.currentPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  changePassword(
    @Request() req: { user: { id: string; email: string; name: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }
}
