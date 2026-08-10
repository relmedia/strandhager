import { randomBytes } from 'node:crypto';

/** Letters and digits that survive being read aloud or written down by hand. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** A short code the guest quotes on the phone, e.g. "K7M2QX". */
export function generateReference(length = 6): string {
  const bytes = randomBytes(length);
  let code = '';
  for (const byte of bytes) {
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

/** The secret in the guest's cancellation link. */
export function generateCancelToken(): string {
  return randomBytes(24).toString('base64url');
}
