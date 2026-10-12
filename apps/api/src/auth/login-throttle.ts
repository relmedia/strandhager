/**
 * How hard a sign-in is slowed down after consecutive failures.
 *
 * An escalating pause rather than a hard lockout: a typo costs nothing, a
 * handful of mistakes costs a minute, and a machine working through a password
 * list is stopped dead — while a legitimate admin is never shut out for long.
 */

/** Failures allowed before the first pause, so ordinary typos are free. */
export const FREE_ATTEMPTS = 4;

/** A quiet spell this long wipes the record clean. */
export const FORGET_AFTER_MS = 30 * 60 * 1000;

const MINUTE = 60 * 1000;

/** The pause owed after `failures` consecutive failures, in milliseconds. */
export function lockoutMsFor(failures: number): number {
  if (failures <= FREE_ATTEMPTS) return 0;

  switch (failures) {
    case 5:
      return 1 * MINUTE;
    case 6:
      return 2 * MINUTE;
    case 7:
      return 5 * MINUTE;
    default:
      return 15 * MINUTE;
  }
}

/** Whether a run of failures is old enough to be forgotten. */
export function hasGoneQuiet(lastFailedAt: Date, now = new Date()): boolean {
  return now.getTime() - lastFailedAt.getTime() >= FORGET_AFTER_MS;
}

/**
 * How long is left on a pause, in whole seconds, or 0 when it has run out.
 * Rounded up so "1 second left" never reads as "0".
 */
export function secondsRemaining(lockedUntil: Date | null, now = new Date()): number {
  if (!lockedUntil) return 0;
  const left = lockedUntil.getTime() - now.getTime();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

/** The wait, phrased for a Norwegian admin staring at a login form. */
export function describeWait(seconds: number): string {
  if (seconds <= 60) return 'ett minutt';
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minutter`;
}
