import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeCodeForIdToken,
  getGoogleConfig,
  readFlow,
  statesMatch,
  verifyIdToken,
  type GoogleConfig,
} from "@/lib/auth/google";
import { loginWithGoogleIdToken } from "@/lib/auth/google-backend";
import { completeLogin } from "@/lib/auth/complete-login";
import { isAllowedEmailDomain, isConsistentHostedDomain, getEmailDomain } from "@/lib/auth/email-domain";
import type { SsoErrorCode } from "@/lib/auth/sso-errors";

export const dynamic = "force-dynamic";

/**
 * Step 2 of Google SSO. Google redirects here with ?code&state.
 *
 *   1. Check the signed flow cookie + `state` (CSRF / login-fixation defence).
 *   2. Exchange the code (with the PKCE verifier) for an ID token.
 *   3. Verify the ID token, then enforce the Babcock domain rule.
 *   4. Have the backend verify it again and issue the UMIS token.
 *   5. Create the normal session cookies and go to the dashboard.
 *
 * Every failure redirects to `/?sso_error=<code>`; the login form renders the copy.
 */
export async function GET(request: NextRequest) {
  const cfg = getGoogleConfig();
  // Build redirects from the configured public origin, not request.url (see getGoogleConfig).
  const base = cfg?.appUrl ?? request.nextUrl.origin;

  const fail = (code: SsoErrorCode, detail?: Record<string, unknown>) => {
    if (code !== "access_denied") console.warn("[google-sso] sign-in rejected", { code, ...detail });
    const response = NextResponse.redirect(new URL(`/?sso_error=${code}`, base));
    response.headers.set("Cache-Control", "no-store");
    return response;
  };

  if (!cfg) return fail("not_configured");

  const store = await cookies();
  const flow = await readFlow(cfg, store.get(cfg.flowCookieName)?.value);
  // The flow is single-use: clear it whatever happens next so a replayed
  // callback URL can never succeed.
  clearFlowCookie(store, cfg);

  const params = request.nextUrl.searchParams;

  // The user pressed "Cancel" / closed consent, or Google refused the request.
  const oauthError = params.get("error");
  if (oauthError) {
    return fail(oauthError === "access_denied" ? "access_denied" : "server_error", { oauthError });
  }

  const code = params.get("code");
  if (!flow || !code || !statesMatch(params.get("state"), flow.state)) {
    return fail("invalid_state", { hasFlow: Boolean(flow) });
  }

  let idToken: string;
  try {
    idToken = await exchangeCodeForIdToken(cfg, code, flow.verifier);
  } catch (error) {
    console.error("[google-sso] Code exchange failed:", error);
    return fail("server_error", { stage: "exchange" });
  }

  let identity;
  try {
    identity = await verifyIdToken(cfg, idToken, flow.nonce);
  } catch (error) {
    console.error("[google-sso] ID token verification failed:", error);
    return fail("invalid_token", { stage: "verify" });
  }

  const domain = getEmailDomain(identity.email);
  if (!identity.emailVerified) return fail("unverified_email", { domain });
  if (!isAllowedEmailDomain(identity.email)) return fail("domain_not_allowed", { domain });
  if (!isConsistentHostedDomain(identity.hd, identity.email)) {
    // Right-looking email but not a Workspace-managed Babcock account.
    return fail("unverified_email", { domain, hd: identity.hd ?? null });
  }

  const backend = await loginWithGoogleIdToken(idToken);
  if (!backend.ok) return fail(backend.code, { domain, stage: "backend" });

  try {
    const result = await completeLogin(backend.payload);
    if (!result.ok) return fail("server_error", { domain, stage: "session" });
  } catch (error) {
    console.error("[google-sso] Creating session failed:", error);
    return fail("server_error", { domain, stage: "session" });
  }

  const response = NextResponse.redirect(new URL("/dashboard?login=success", base));
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function clearFlowCookie(store: Awaited<ReturnType<typeof cookies>>, cfg: GoogleConfig) {
  // Expire with the same attributes it was set with. A "__Host-" cookie can only
  // be overwritten by a Secure Set-Cookie, so a bare delete() would be ignored.
  store.set(cfg.flowCookieName, "", {
    httpOnly: true,
    secure: cfg.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
