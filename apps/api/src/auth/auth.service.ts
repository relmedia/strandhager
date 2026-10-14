import { randomBytes, randomInt } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  describeWait,
  hasGoneQuiet,
  lockoutMsFor,
  secondsRemaining,
} from './login-throttle';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Compared against when no account matches the address, so that a missing
 * account costs the same time as a wrong password. Without it, bcrypt runs only
 * for addresses that exist, and the difference — immediate versus roughly a
 * tenth of a second — is enough to sort real admin addresses from guesses.
 *
 * A fixed hash of a value nothing can equal; it is not a secret.
 */
const ABSENT_ACCOUNT_HASH =
  '$2b$10$U9sxLVWGcJ25FpY.jC5MXudfZLXIfSUZ/1Qm1ASUxPFOsY2CS0oMm';

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
    const address = email.trim().toLowerCase();

    await this.assertNotPaused(address);

    const user = await this.prisma.adminUser.findUnique({ where: { email: address } });

    // Always compare, even with nothing to compare against: see
    // ABSENT_ACCOUNT_HASH. Checking `user` first would hand out the answer in
    // the response time.
    const ok = await bcrypt.compare(password, user?.passwordHash ?? ABSENT_ACCOUNT_HASH);

    if (!user || !ok) {
      await this.recordFailedLogin(address);
      return null;
    }

    await this.forgetFailedLogins(address);
    return { id: user.id, email: user.email, name: user.name };
  }

  /**
   * Refuses to even check the password while a pause is running.
   *
   * Counted against the address as typed, including addresses that do not
   * exist, so the pause cannot be used to tell real admins from invented ones.
   */
  private async assertNotPaused(address: string) {
    const record = await this.prisma.loginAttempt.findUnique({
      where: { email: address },
    });
    if (!record) return;

    const left = secondsRemaining(record.lockedUntil);
    if (left > 0) {
      throw new UnauthorizedException(
        `For mange mislykkede forsøk. Prøv igjen om ${describeWait(left)}.`,
      );
    }
  }

  private async recordFailedLogin(address: string) {
    const now = new Date();
    const previous = await this.prisma.loginAttempt.findUnique({
      where: { email: address },
    });

    // A long enough gap starts the count over, so someone who mistypes once a
    // month never creeps up the ladder.
    const priorFailures =
      previous && !hasGoneQuiet(previous.lastFailedAt, now) ? previous.failures : 0;

    const failures = priorFailures + 1;
    const pause = lockoutMsFor(failures);
    const lockedUntil = pause > 0 ? new Date(now.getTime() + pause) : null;

    await this.prisma.loginAttempt.upsert({
      where: { email: address },
      create: { email: address, failures, lockedUntil, lastFailedAt: now },
      update: { failures, lockedUntil, lastFailedAt: now },
    });

    if (pause > 0) {
      this.logger.warn(
        `${failures} mislykkede innlogginger for ${address}; pause i ${pause / 1000} sekunder`,
      );
    }
  }

  /** A correct password wipes the slate. */
  private async forgetFailedLogins(address: string) {
    await this.prisma.loginAttempt.deleteMany({ where: { email: address } });
  }

  /**
   * Password was right. With two-factor off (the default) the token is issued
   * straight away; with it on a one-time code is e-mailed and the JWT waits
   * for /auth/verify.
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

    if (!mail.configured) {
      // Handing the code back in the response is a development convenience so
      // a first admin is not locked out before e-mail is set up. In production
      // it would undo two-factor entirely — whoever asked for the code would be
      // given it — so there it is a failure instead.
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          `E-post er ikke satt opp, så innloggingskoden til ${user.email} kunne ikke sendes.`,
        );
        throw new ServiceUnavailableException(
          'Innloggingskoden kunne ikke sendes fordi e-post ikke er satt opp. Kontakt en administrator.',
        );
      }

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
  async setTwoFactor(userId: string, enabled: boolean, currentPassword?: string) {
    // Turning it off weakens the account, so it takes the password as well as
    // a session: someone holding only a stolen token cannot do it.
    if (!enabled) {
      const account = await this.prisma.adminUser.findUnique({ where: { id: userId } });
      if (!account) throw new UnauthorizedException();
      const ok = currentPassword
        ? await bcrypt.compare(currentPassword, account.passwordHash)
        : false;
      if (!ok) {
        throw new UnauthorizedException('Skriv inn passordet ditt for å slå av tofaktor.');
      }
    }

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
        // Stamps every token issued before now as dead. The fresh one handed
        // back below is signed after this, so the person changing their own
        // password stays logged in while anyone else holding a token does not.
        passwordChangedAt: new Date(),
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
