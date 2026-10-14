import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC } from './public.decorator';

/**
 * The API's default answer to an anonymous caller.
 *
 * Registered globally in app.module.ts, so every route demands a dashboard
 * token unless it carries `@Public()`. That way a new controller is protected
 * the moment it is written, rather than the moment someone remembers to guard
 * it — which is how the whole API ended up open in the first place.
 *
 * Uses the same 'jwt' passport strategy the auth controller already relies on.
 */
/** What a session with a temporary password may still reach. */
const OPEN_WHILE_TEMPORARY = new Set(['/auth/change-password', '/auth/me']);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Checked on the handler first and the controller second, so a mixed
    // controller can open individual routes without opening the rest.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    if (!(await super.canActivate(context))) return false;

    // A temporary password from an invitation only buys the right to choose a
    // real one. The dashboard steers there anyway; this makes the API agree,
    // so the e-mailed password cannot be used for anything else.
    const request = context.switchToHttp().getRequest<{
      user?: { mustChangePassword?: boolean };
      path?: string;
    }>();
    if (request.user?.mustChangePassword && !OPEN_WHILE_TEMPORARY.has(request.path ?? '')) {
      throw new ForbiddenException('Du må bytte passord før du kan fortsette.');
    }

    return true;
  }
}
