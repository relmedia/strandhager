import { ExecutionContext, Injectable } from '@nestjs/common';
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
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Checked on the handler first and the controller second, so a mixed
    // controller can open individual routes without opening the rest.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }
}
