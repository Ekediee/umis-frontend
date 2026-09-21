/**
 * Google SSO error codes shared by the OAuth route handlers (which redirect to
 * `/?sso_error=<code>`) and the login form (which renders the message).
 *
 * The form only ever renders text from this map — never raw query-string
 * content — so a crafted link cannot inject arbitrary copy into the page.
 * Safe to import from client components (no server-only code here).
 */

export const SSO_ERROR_MESSAGES = {
  /** Email is not on an allowed Babcock domain. */
  domain_not_allowed: "Please sign in with your Babcock email address (for example name@student.babcock.edu.ng).",
  /** Google reports the email as unverified, or the account is not Workspace-managed. */
  unverified_email: "We couldn't verify that Google account. Please sign in with your official Babcock email address.",
  /** Valid Babcock account, but no matching student record in UMIS. */
  no_student_record:
    "We couldn't find a student account linked to that email. Log in with your matric number instead, or contact ICT support.",
  /** Student record exists but the account cannot sign in right now. */
  account_inactive: "This student account can't sign in right now. Please contact ICT support.",
  /** User closed or cancelled the Google prompt. Not an error — no banner is shown. */
  access_denied: null,
  /** State/PKCE cookie missing, expired or mismatched. */
  invalid_state: "That sign-in attempt expired or was interrupted. Please try again.",
  /** Google's ID token or the backend rejected the sign-in. */
  invalid_token: "Google sign-in could not be verified. Please try again.",
  /** SSO is not configured on this server. */
  not_configured: "Google sign-in isn't available right now. Please log in with your matric number.",
  /** Anything unexpected (network, Google or backend outage). */
  server_error: "We couldn't complete Google sign-in. Please try again, or log in with your matric number.",
} as const satisfies Record<string, string | null>;

export type SsoErrorCode = keyof typeof SSO_ERROR_MESSAGES;

export function isSsoErrorCode(value: unknown): value is SsoErrorCode {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SSO_ERROR_MESSAGES, value);
}
