import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Opens a route to anyone, past the global JWT guard.
 *
 * The default is closed: anything added to this API needs a token unless it is
 * marked here deliberately. Reach for it only for endpoints the public website
 * calls, or that an outside service posts to, and say why in a comment.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
