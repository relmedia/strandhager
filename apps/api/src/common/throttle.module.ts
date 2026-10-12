import { Global, Module } from '@nestjs/common';

import { ThrottleGuard } from './throttle';

/**
 * Makes ThrottleGuard injectable wherever `@UseGuards(ThrottleGuard)` appears,
 * without each feature module having to list it. Applied per-route rather than
 * globally, so only the public write endpoints pay for a counter.
 */
@Global()
@Module({
  providers: [ThrottleGuard],
  exports: [ThrottleGuard],
})
export class ThrottleModule {}
