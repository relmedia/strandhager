/**
 * Extra gate on top of the password + code login. Only addresses listed in
 * ADMIN_ALLOWED_EMAILS (comma-separated) may use the dashboard.
 *
 * While the variable is unset the gate stays open, so nobody gets locked out
 * before the list is configured.
 */
const configured = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(/[\s,;]+/)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (configured.length === 0) return true;
  return Boolean(email && configured.includes(email.toLowerCase()));
}
