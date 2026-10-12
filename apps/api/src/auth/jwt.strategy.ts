import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../prisma/prisma.service';

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  /** Issued-at, in seconds, added by the signer. */
  iat?: number;
};

/**
 * Whether a token predates the account's last password change.
 *
 * Both sides are compared in whole seconds because that is the resolution of
 * `iat`. A token minted in the same second as the change is let through: the
 * alternative is rejecting the replacement token that `changePassword` hands
 * back, which would lock someone out of their own account for changing their
 * password.
 */
function issuedBeforePasswordChange(
  issuedAt: number | undefined,
  changedAt: Date | null,
): boolean {
  if (!changedAt) return false;
  // No iat at all is not something this API signs; treat it as suspect.
  if (issuedAt === undefined) return true;

  return issuedAt < Math.floor(changedAt.getTime() / 1000);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) {
      throw new Error('AUTH_JWT_SECRET mangler. Sett den i apps/api/.env.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Tokens last 30 days, so trusting the payload alone would let someone who
   * has been removed from the dashboard keep using it for the best part of a
   * month. Confirming the account still exists costs one indexed lookup per
   * request and makes removing a user take effect immediately.
   *
   * Read fresh rather than from the token so a rename shows up too.
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, passwordChangedAt: true },
    });

    if (!user) throw new UnauthorizedException();
    if (issuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) {
      throw new UnauthorizedException();
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
