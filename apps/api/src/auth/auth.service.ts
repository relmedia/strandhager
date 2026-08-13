import { randomBytes, randomInt } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type PublicUser = { id: string; email: string; name: string };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly notifications: NotificationsService,
  ) {}

  async validateUser(email: string, password: string): Promise<PublicUser | null> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return { id: user.id, email: user.email, name: user.name };
  }

  /**
   * Password was right. With two-factor on (the default) a one-time code is
   * e-mailed and the JWT waits for /auth/verify; with it off the token is
   * issued straight away.
   */
  async login(user: PublicUser) {
    const fresh = await this.prisma.adminUser.findUnique({ where: { id: user.id } });
    if (!fresh) throw new UnauthorizedException();

    if (!fresh.twoFactorEnabled) {
      return {
        accessToken: await this.sign(user, fresh.mustChangePassword),
        user,
        mustChangePassword: fresh.mustChangePassword,
      };
    }

    return this.startChallenge(user);
  }

  /** Issue a short-lived challenge and e-mail a 6-digit code. */
  private async startChallenge(user: PublicUser) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.loginChallenge.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const challenge = await this.prisma.loginChallenge.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    const mail = await this.notifications.notifyLoginCode(user.email, code);

    if (mail.sent) {
      return { challengeId: challenge.id, emailed: true };
    }

    // No Resend key yet: return the code so a first admin is not locked out.
    if (!mail.configured) {
      this.logger.warn(
        `E-post er ikke satt opp — innloggingskode for ${user.email}: ${code}`,
      );
      return { challengeId: challenge.id, emailed: false, code };
    }

    this.logger.warn(`Kunne ikke sende innloggingskode til ${user.email}: ${mail.error}`);
    return { challengeId: challenge.id, emailed: false, mailError: mail.error };
  }

  async verifyCode(challengeId: string, code: string) {
    const challenge = await this.prisma.loginChallenge.findUnique({
      where: { id: challengeId },
      include: { user: true },
    });

    if (!challenge || challenge.consumedAt) {
      throw new UnauthorizedException('Koden er ugyldig eller allerede brukt.');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Koden har utløpt. Start innloggingen på nytt.');
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new UnauthorizedException(
        'For mange feil forsøk. Start innloggingen på nytt.',
      );
    }

    const match = await bcrypt.compare(code.trim(), challenge.codeHash);
    if (!match) {
      await this.prisma.loginChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Feil kode. Prøv igjen.');
    }

    await this.prisma.loginChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const user = {
      id: challenge.user.id,
      email: challenge.user.email,
      name: challenge.user.name,
    };

    return {
      accessToken: await this.sign(user, challenge.user.mustChangePassword),
      user,
      mustChangePassword: challenge.user.mustChangePassword,
    };
  }

  async me(user: PublicUser) {
    const fresh = await this.prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true },
    });
    if (!fresh) throw new UnauthorizedException();
    return fresh;
  }

  /** Everyone who can log in to the dashboard, for the account page. */
  listUsers() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        mustChangePassword: true,
        twoFactorEnabled: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Turns the one-time e-mail code at login on or off for the user's own account. */
  async setTwoFactor(userId: string, enabled: boolean) {
    const user = await this.prisma.adminUser.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
      select: { email: true, twoFactorEnabled: true },
    });

    this.logger.log(
      `Tofaktor ved innlogging er ${user.twoFactorEnabled ? 'på' : 'av'} for ${user.email}`,
    );
    return { twoFactorEnabled: user.twoFactorEnabled };
  }

  /**
   * A board member adds a colleague: the account gets a temporary password
   * that is e-mailed together with the dashboard address. The first login
   * forces a password change.
   */
  async inviteUser(email: string, name: string) {
    const normalized = email.trim().toLowerCase();

    const existing = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new BadRequestException('Det finnes allerede en bruker med denne e-posten.');
    }

    // base64url gives ~16 readable characters without ambiguous symbols.
    const tempPassword = randomBytes(12).toString('base64url');

    const user = await this.prisma.adminUser.create({
      data: {
        email: normalized,
        name: name.trim(),
        passwordHash: await bcrypt.hash(tempPassword, 10),
        mustChangePassword: true,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const mail = await this.notifications.notifyAdminInvite(
      user.email,
      user.name,
      tempPassword,
    );

    if (mail.sent) {
      this.logger.log(`Inviterte ${user.email} og sendte midlertidig passord på e-post`);
      return { ...user, emailed: true };
    }

    // Mail failed or is not configured: hand the password to the inviter so
    // they can pass it on themselves.
    if (!mail.configured) {
      this.logger.warn(`E-post er ikke satt opp — midlertidig passord for ${user.email} vises til inviteren`);
      return { ...user, emailed: false, tempPassword };
    }

    this.logger.warn(`Kunne ikke sende invitasjon til ${user.email}: ${mail.error}`);
    return { ...user, emailed: false, tempPassword, mailError: mail.error };
  }

  /** Removes a dashboard user. You cannot delete yourself, so one admin always remains. */
  async deleteUser(requesterId: string, userId: string) {
    if (requesterId === userId) {
      throw new BadRequestException('Du kan ikke slette din egen konto.');
    }

    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Brukeren finnes ikke.');
    }

    await this.prisma.adminUser.delete({ where: { id: userId } });
    this.logger.log(`Slettet dashbordbrukeren ${user.email}`);
    return { deleted: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Nåværende passord stemmer ikke.');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
        mustChangePassword: false,
      },
    });

    this.logger.log(`Passordet til ${user.email} ble byttet`);

    // A fresh token without the must-change flag, so the dashboard lets the
    // user straight in after a forced first-login change.
    return {
      changed: true,
      accessToken: await this.sign(
        { id: user.id, email: user.email, name: user.name },
        false,
      ),
    };
  }

  async createUser(email: string, password: string, name: string) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Det finnes allerede en bruker med denne e-posten.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.adminUser.create({
      data: {
        email: email.trim().toLowerCase(),
        name,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });
  }

  private sign(user: PublicUser, mustChangePassword = false) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      name: user.name,
      mustChangePassword,
    });
  }
}
