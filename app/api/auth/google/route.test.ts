// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "./route";
import { getGoogleConfig, readFlow } from "@/lib/auth/google";

const APP = "https://umis.babcock.edu.ng";

beforeEach(() => {
  process.env.GOOGLE_CLIENT_ID = "cid";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  process.env.NEXTAUTH_URL = APP;
  process.env.NEXTAUTH_SECRET = "test-secret";
  delete process.env.APP_URL;
});

describe("GET /api/auth/google", () => {
  it("redirects to Google and sets a signed, httpOnly flow cookie matching the request", async () => {
    const res = await GET(new NextRequest(`${APP}/api/auth/google`));
    const cfg = getGoogleConfig()!;

    const location = new URL(res.headers.get("location")!);
    expect(location.origin).toBe("https://accounts.google.com");
    expect(location.searchParams.get("redirect_uri")).toBe(`${APP}/api/auth/google/callback`);

    const setCookie = res.headers.get("set-cookie")!;
    expect(setCookie).toMatch(/^__Host-google_oauth_flow=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Secure/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Max-Age=600/i);
    expect(res.headers.get("cache-control")).toBe("no-store");

    // The cookie carries the same state/nonce that were sent to Google.
    const token = setCookie.split(";")[0].split("=").slice(1).join("=");
    const flow = await readFlow(cfg, token);
    expect(flow?.state).toBe(location.searchParams.get("state"));
    expect(flow?.nonce).toBe(location.searchParams.get("nonce"));
  });

  it("uses a fresh state on every visit", async () => {
    const a = new URL((await GET(new NextRequest(`${APP}/api/auth/google`))).headers.get("location")!);
    const b = new URL((await GET(new NextRequest(`${APP}/api/auth/google`))).headers.get("location")!);
    expect(a.searchParams.get("state")).not.toBe(b.searchParams.get("state"));
  });

  it("sends the user back to the login page when SSO isn't configured", async () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    const res = await GET(new NextRequest(`${APP}/api/auth/google`));
    expect(new URL(res.headers.get("location")!).searchParams.get("sso_error")).toBe("not_configured");
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
