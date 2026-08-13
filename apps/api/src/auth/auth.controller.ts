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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  login(@Request() req: { user: { id: string; email: string; name: string } }) {
    return this.authService.login(req.user);
  }

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
    return this.authService.setTwoFactor(req.user.id, dto.enabled);
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
