/**
 * Same-origin proxy for the phase-1 student endpoints (live mode).
 *
 * Browser → /api/student/<path> → ${API_URL}/api/v1/student/<path>
 *
 * Adds the bearer token from the httpOnly session cookie, so client
 * components can call the API without the token ever reaching JavaScript.
 * Only the paths listed in ALLOWED are forwarded.
 */

import { NextResponse } from "next/server";
import { loggedFetch, withLogging } from "@/lib/logger";
import { getSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

/** First path segment → allowed. Keeps the proxy from becoming an open relay to the backend. */
const ALLOWED = new Set(["courses", "questions", "answers", "deadlines", "attendance", "study-sessions", "notification-preferences", "notifications", "push-subscriptions"]);

type Ctx = { params: Promise<{ path: string[] }> };

async function forward(req: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  if (!path?.length || !ALLOWED.has(path[0])) {
    return NextResponse.json({ status: false, message: "Not found", code: "PRX-404" }, { status: 404 });
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) return NextResponse.json({ status: false, message: "Missing API configuration", code: "PRX-500" }, { status: 500 });

  const token = await getSessionToken().catch(() => null);
  if (!token) return NextResponse.json({ status: false, message: "Your session has ended. Sign in again.", code: "AUTH-401" }, { status: 401 });

  const search = new URL(req.url).search;
  const target = `${apiUrl}/api/v1/student/${path.map(encodeURIComponent).join("/")}${search}`;
  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };
  const idem = req.headers.get("idempotency-key");
  if (idem) headers["Idempotency-Key"] = idem;

  const hasBody = !["GET", "HEAD"].includes(req.method);
  if (hasBody) headers["Content-Type"] = "application/json";

  try {
    const res = await loggedFetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({ status: res.ok, message: res.statusText }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("student proxy failed:", error);
    return NextResponse.json({ status: false, message: "Could not connect to the server. Please try again later.", code: "PRX-502" }, { status: 502 });
  }
}

export const GET = withLogging((req, ctx) => forward(req, ctx as Ctx));
export const POST = withLogging((req, ctx) => forward(req, ctx as Ctx));
export const PUT = withLogging((req, ctx) => forward(req, ctx as Ctx));
export const PATCH = withLogging((req, ctx) => forward(req, ctx as Ctx));
export const DELETE = withLogging((req, ctx) => forward(req, ctx as Ctx));
