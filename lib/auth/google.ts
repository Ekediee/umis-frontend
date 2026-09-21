import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { Agent } from "undici";
import { SignJWT, jwtVerify, createRemoteJWKSet, customFetch } from "jose";

/**
 * Server-side helpers for the Google OAuth 2.0 authorization-code flow (with PKCE).
 *
 * Google only proves WHO the user is. The UMIS session token is still issued by
 * the backend (see lib/auth/google-backend.ts); this file never mints sessions.
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";
export const FLOW_TTL_SECONDS = 10 * 60;

// ── TLS ───────────────────────────────────────────────────────────────────────
// The production container sets NODE_TLS_REJECT_UNAUTHORIZED=0 because the UMIS
// backend certificate is expired, and Node's fetch honours that variable
// process-wide. Google traffic carries our client secret and the signing keys
// used to verify ID tokens, so it MUST verify certificates. An explicit
// `rejectUnauthorized: true` on a dedicated agent overrides the env variable.
const strictAgent = new Agent({ connect: { rejectUnauthorized: true } });

function googleFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(10_000),
    // @ts-expect-error — undici dispatcher is not in the standard fetch types
    dispatcher: strictAgent,
  });
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
function getJwks() {
  jwks ??= createRemoteJWKSet(new URL(GOOGLE_JWKS_URL), { [customFetch]: googleFetch });
  return jwks;
}

// ── Configuration ─────────────────────────────────────────────────────────────

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  /** Public origin of this app, no trailing slash. Used for redirect URIs. */
  appUrl: string;
  redirectUri: string;
  flowCookieName: string;
  secureCookies: boolean;
  flowKey: Uint8Array;
}

/**
 * Returns the SSO configuration, or null when SSO isn't (fully) configured —
 * which keeps the login button hidden and the routes inert.
 *
 * The public origin is read from APP_URL, falling back to NEXTAUTH_URL (already
 * used by lib/session.ts). It must NOT be derived from the incoming request:
 * behind the Apache reverse proxy the request host can be the internal
 * `nextjs:3000` address, and Google requires the redirect URI to match exactly.
 */
export function getGoogleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const rawAppUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "").trim();
  const secret = process.env.NEXTAUTH_SECRET?.trim();

  if (!clientId || !clientSecret || !rawAppUrl || !secret) return null;

  let origin: string;
  try {
    origin = new URL(rawAppUrl).origin;
  } catch {
    return null;
  }

  const secureCookies = origin.startsWith("https://");
  return {
    clientId,
    clientSecret,
    appUrl: origin,
    redirectUri: `${origin}${GOOGLE_CALLBACK_PATH}`,
    // "__Host-" pins the cookie to this exact host/path and requires Secure, so
    // it is only used when the site is served over HTTPS.
    flowCookieName: secureCookies ? "__Host-google_oauth_flow" : "google_oauth_flow",
    secureCookies,
    // Derived key: the flow cookie signature is never valid for anything else.
    flowKey: new Uint8Array(createHash("sha256").update(`google-sso-flow:${secret}`).digest()),
  };
}

export function isGoogleSsoEnabled(): boolean {
  return getGoogleConfig() !== null;
}

// ── State / nonce / PKCE ──────────────────────────────────────────────────────

export interface OAuthFlow {
  state: string;
  nonce: string;
  verifier: string;
}

const b64url = (buf: Buffer) => buf.toString("base64url");

export function createFlow(): OAuthFlow {
  return {
    state: b64url(randomBytes(24)),
    nonce: b64url(randomBytes(24)),
    verifier: b64url(randomBytes(32)),
  };
}

export function codeChallenge(verifier: string): string {
  return b64url(createHash("sha256").update(verifier).digest());
}

/** Signs the flow into a short-lived token stored in an httpOnly cookie. */
export async function signFlow(cfg: GoogleConfig, flow: OAuthFlow): Promise<string> {
  return new SignJWT({ ...flow })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${FLOW_TTL_SECONDS}s`)
    .sign(cfg.flowKey);
}

/** Returns the flow, or null if the cookie is missing, tampered with or expired. */
export async function readFlow(cfg: GoogleConfig, token: string | undefined): Promise<OAuthFlow | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, cfg.flowKey, { algorithms: ["HS256"] });
    const { state, nonce, verifier } = payload as Record<string, unknown>;
    if (typeof state !== "string" || typeof nonce !== "string" || typeof verifier !== "string") return null;
    return { state, nonce, verifier };
  } catch {
    return null;
  }
}

export function statesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ── Authorization request ─────────────────────────────────────────────────────

export function buildAuthorizeUrl(cfg: GoogleConfig, flow: OAuthFlow): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: codeChallenge(flow.verifier),
    code_challenge_method: "S256",
    // Always show the account chooser. Students share lab computers, and after
    // logout the browser is still signed in to Google — without this the next
    // person would be silently signed in as the previous student.
    prompt: "select_account",
    // Picker hint only (any Workspace account). It is NOT a security control —
    // the domain is enforced on the verified ID token in the callback.
    hd: "*",
  }).toString();
  return url.toString();
}

// ── Token exchange & verification ─────────────────────────────────────────────

export async function exchangeCodeForIdToken(cfg: GoogleConfig, code: string, verifier: string): Promise<string> {
  const res = await googleFetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
  });

  const json = (await res.json().catch(() => null)) as { id_token?: unknown; error?: unknown } | null;
  if (!res.ok || typeof json?.id_token !== "string") {
    throw new Error(`Google token exchange failed (${res.status}${json?.error ? `: ${String(json.error)}` : ""})`);
  }
  return json.id_token;
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  /** Hosted Workspace domain; absent for consumer Google accounts. */
  hd?: string;
  name?: string;
}

/** Verifies signature, issuer, audience, expiry and nonce. Throws on any failure. */
export async function verifyIdToken(cfg: GoogleConfig, idToken: string, expectedNonce: string): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, getJwks(), {
    issuer: GOOGLE_ISSUERS,
    audience: cfg.clientId,
    algorithms: ["RS256"],
    clockTolerance: 5,
  });

  if (!statesMatch(payload.nonce as string | undefined, expectedNonce)) {
    throw new Error("ID token nonce mismatch");
  }
  if (typeof payload.email !== "string" || typeof payload.sub !== "string") {
    throw new Error("ID token is missing email or subject");
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    hd: typeof payload.hd === "string" ? payload.hd : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}
