/**
 * Check-in codes shared by the lecturer screen (shows the code + QR) and the
 * student app (types the code or scans the QR).
 *
 * Mock / offline mode: the code is time-based (TOTP-style), derived from the
 * class session seed, and changes every 30 seconds. A photo of the code shared
 * on WhatsApp stops working within a minute.
 *
 * Live mode: the backend signs the QR token and keeps the secret (agreed in the
 * requirements plan). The QR then carries the backend token instead of the
 * mock one; the student app only forwards it to `POST /student/attendance/check-in`.
 */

export const CHECKIN_PERIOD_S = 30;
/** Codes from the previous window are still accepted, to absorb clock drift and slow typing. */
export const CHECKIN_GRACE_WINDOWS = 1;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function totpCode(seed: string, at = Date.now()) {
  return String(hash(`${seed}:${Math.floor(at / 1000 / CHECKIN_PERIOD_S)}`) % 1_000_000).padStart(6, "0");
}

/** True when `code` matches the current window or one of the grace windows before it. */
export function verifyTotpCode(seed: string, code: string, at = Date.now()) {
  const clean = code.replace(/\D/g, "");
  for (let w = 0; w <= CHECKIN_GRACE_WINDOWS; w++) {
    if (totpCode(seed, at - w * CHECKIN_PERIOD_S * 1000) === clean) return true;
  }
  return false;
}

// ── QR payload ────────────────────────────────────────────────────────────────
// The QR encodes a link, so a phone's own camera app opens Pulse straight on
// the check-in screen: https://<host>/attendance/check-in?t=<token>

const b64url = {
  encode: (s: string) =>
    (typeof btoa === "function" ? btoa(s) : Buffer.from(s, "utf8").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  decode: (s: string) => {
    const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    return typeof atob === "function" ? atob(pad) : Buffer.from(pad, "base64").toString("utf8");
  },
};

export interface MockCheckinToken {
  /** Class session seed, e.g. "sess-cosc204-mon:2026-10-12" */
  seed: string;
  /** The 6-digit code that was on screen when the QR was drawn */
  code: string;
}

export function encodeMockToken(t: MockCheckinToken) {
  return `m1.${b64url.encode(JSON.stringify(t))}`;
}

export function decodeMockToken(token: string): MockCheckinToken | null {
  if (!token.startsWith("m1.")) return null;
  try {
    const t = JSON.parse(b64url.decode(token.slice(3))) as MockCheckinToken;
    return typeof t.seed === "string" && typeof t.code === "string" ? t : null;
  } catch {
    return null;
  }
}

export function checkinUrl(origin: string, token: string) {
  return `${origin.replace(/\/$/, "")}/attendance/check-in?t=${encodeURIComponent(token)}`;
}

/** Pulls the token out of whatever the camera read: a full check-in link or a bare token. */
export function tokenFromScan(raw: string): string | null {
  const text = raw.trim();
  try {
    const url = new URL(text);
    const t = url.searchParams.get("t");
    if (t) return t;
  } catch {
    // not a URL
  }
  return text.length > 8 ? text : null;
}
