import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizeUrl, createFlow, FLOW_TTL_SECONDS, getGoogleConfig, signFlow } from "@/lib/auth/google";

// Never cache: every visit must mint a fresh state / nonce / PKCE verifier.
export const dynamic = "force-dynamic";

/**
 * Step 1 of Google SSO: create the one-time OAuth flow values, remember them in
 * a short-lived signed httpOnly cookie, and send the browser to Google.
 * Step 2 is ./callback/route.ts.
 */
export async function GET(request: NextRequest) {
  const cfg = getGoogleConfig();
  if (!cfg) {
    return NextResponse.redirect(new URL("/?sso_error=not_configured", request.url));
  }

  const flow = createFlow();
  const response = NextResponse.redirect(buildAuthorizeUrl(cfg, flow));

  response.cookies.set(cfg.flowCookieName, await signFlow(cfg, flow), {
    httpOnly: true,
    secure: cfg.secureCookies,
    // Lax (not Strict): the callback is a cross-site top-level navigation from
    // Google, and Strict cookies would not be sent on it.
    sameSite: "lax",
    path: "/",
    maxAge: FLOW_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}
