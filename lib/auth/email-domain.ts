/**
 * Email-domain rules for Google SSO.
 *
 * Pure functions (no I/O, no server-only imports) so they can be unit-tested
 * and reused anywhere. An allowed entry such as "babcock.edu.ng" matches that
 * exact host AND any subdomain of it (student.babcock.edu.ng, pg.babcock.edu.ng…).
 * The leading dot in the subdomain check is what stops look-alikes such as
 * "evilbabcock.edu.ng" from passing.
 */

export const DEFAULT_ALLOWED_DOMAINS = ["babcock.edu.ng"];

// ASCII-only hostname: rejects unicode look-alikes, whitespace and stray punctuation.
const HOST_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/**
 * Parses the comma-separated GOOGLE_ALLOWED_DOMAINS value.
 * Falls back to the Babcock default when unset or empty.
 */
export function getAllowedDomains(raw: string | undefined = process.env.GOOGLE_ALLOWED_DOMAINS): string[] {
  const parsed = (raw ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_DOMAINS;
}

/** Returns the lowercase host part of an email, or null if the address is malformed. */
export function getEmailDomain(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  // Exactly one "@": "a@b@babcock.edu.ng" is rejected outright.
  const parts = value.split("@");
  if (parts.length !== 2 || !parts[0]) return null;
  const host = parts[1];
  return HOST_PATTERN.test(host) ? host : null;
}

function hostMatches(host: string, allowed: string): boolean {
  return host === allowed || host.endsWith(`.${allowed}`);
}

export function isAllowedHost(host: string | null | undefined, allowed: string[] = getAllowedDomains()): boolean {
  if (!host) return false;
  const h = host.trim().toLowerCase();
  if (!HOST_PATTERN.test(h)) return false;
  return allowed.some((a) => hostMatches(h, a));
}

export function isAllowedEmailDomain(email: unknown, allowed: string[] = getAllowedDomains()): boolean {
  return isAllowedHost(getEmailDomain(email), allowed);
}

/**
 * Google's `hd` (hosted domain) claim identifies the Workspace that manages the
 * account. It must be present and must be the email's own domain or a parent of
 * it (an account on student.babcock.edu.ng may report hd = babcock.edu.ng).
 * This proves the account is Workspace-managed rather than a consumer Google
 * account that merely uses a matching email address.
 */
export function isConsistentHostedDomain(hd: unknown, email: unknown): boolean {
  if (typeof hd !== "string") return false;
  const domain = hd.trim().toLowerCase();
  const host = getEmailDomain(email);
  if (!host || !HOST_PATTERN.test(domain)) return false;
  return host === domain || host.endsWith(`.${domain}`);
}
