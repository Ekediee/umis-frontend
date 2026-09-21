// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

// vi.mock factories are hoisted above imports, so their shared state must be too.
const { cookieJar, cookieStore, exchangeMock, verifyMock, backendMock, completeLoginMock } = vi.hoisted(() => {
  const cookieJar = new Map<string, string>();
  return {
    cookieJar,
    cookieStore: {
      get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
      set: (name: string, value: string, opts?: { maxAge?: number }) => {
        if (opts?.maxAge === 0) cookieJar.delete(name);
        else cookieJar.set(name, value);
      },
    },
    exchangeMock: vi.fn(),
    verifyMock: vi.fn(),
    backendMock: vi.fn(),
    completeLoginMock: vi.fn(),
  };
});

// ── next/headers cookie store ────────────────────────────────────────────────
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve(cookieStore) }));

// ── Network-touching collaborators ───────────────────────────────────────────
vi.mock("@/lib/auth/google", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/google")>();
  return { ...actual, exchangeCodeForIdToken: exchangeMock, verifyIdToken: verifyMock };
});

vi.mock("@/lib/auth/google-backend", () => ({ loginWithGoogleIdToken: backendMock }));

vi.mock("@/lib/auth/complete-login", () => ({ completeLogin: completeLoginMock }));

import { GET } from "./route";
import { createFlow, getGoogleConfig, signFlow, type OAuthFlow } from "@/lib/auth/google";

const APP = "https://umis.babcock.edu.ng";
const goodIdentity = {
  sub: "sub-1",
  email: "ada@student.babcock.edu.ng",
  emailVerified: true,
  hd: "babcock.edu.ng",
};

let flow: OAuthFlow;

/** Puts a valid signed flow cookie in the jar and returns a callback request. */
async function callback(query: Record<string, string> = {}, { withCookie = true } = {}) {
  const cfg = getGoogleConfig()!;
  if (withCookie) cookieJar.set(cfg.flowCookieName, await signFlow(cfg, flow));
  const url = new URL(`${APP}/api/auth/google/callback`);
  new URLSearchParams({ code: "auth-code", state: flow.state, ...query }).forEach((v, k) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
}

const redirectTarget = (res: Response) => new URL(res.headers.get("location")!);

beforeEach(() => {
  vi.clearAllMocks();
  cookieJar.clear();
  process.env.GOOGLE_CLIENT_ID = "cid";
  process.env.GOOGLE_CLIENT_SECRET = "secret";
  process.env.NEXTAUTH_URL = APP;
  process.env.NEXTAUTH_SECRET = "test-secret";
  delete process.env.APP_URL;
  delete process.env.GOOGLE_ALLOWED_DOMAINS;

  flow = createFlow();
  exchangeMock.mockResolvedValue("google.id.token");
  verifyMock.mockResolvedValue(goodIdentity);
  backendMock.mockResolvedValue({ ok: true, payload: { data: { token: "umis-token", user: {} } } });
  completeLoginMock.mockResolvedValue({ ok: true });
});

describe("Google SSO callback", () => {
  it("signs the student in and redirects to the dashboard", async () => {
    const res = await callback();

    expect(redirectTarget(res).href).toBe(`${APP}/dashboard?login=success`);
    expect(exchangeMock).toHaveBeenCalledWith(expect.anything(), "auth-code", flow.verifier);
    expect(verifyMock).toHaveBeenCalledWith(expect.anything(), "google.id.token", flow.nonce);
    expect(backendMock).toHaveBeenCalledWith("google.id.token");
    expect(completeLoginMock).toHaveBeenCalledWith({ data: { token: "umis-token", user: {} } });
  });

  it("clears the one-time flow cookie", async () => {
    await callback();
    expect(cookieJar.has(getGoogleConfig()!.flowCookieName)).toBe(false);
  });

  it("redirects using the configured public origin, not the request host", async () => {
    const cfg = getGoogleConfig()!;
    cookieJar.set(cfg.flowCookieName, await signFlow(cfg, flow));
    const internal = new URL(`http://nextjs:3000/api/auth/google/callback?code=c&state=${flow.state}`);
    const res = await GET(new NextRequest(internal));
    expect(redirectTarget(res).origin).toBe(APP);
  });

  describe("failure paths (each redirects to /?sso_error=<code>)", () => {
    const expectError = (res: Response, code: string) => {
      const target = redirectTarget(res);
      expect(target.origin + target.pathname).toBe(`${APP}/`);
      expect(target.searchParams.get("sso_error")).toBe(code);
      // A failed attempt must never establish a session.
      expect(completeLoginMock).not.toHaveBeenCalled();
    };

    it("not_configured when SSO env vars are missing", async () => {
      delete process.env.GOOGLE_CLIENT_ID;
      const res = await GET(new NextRequest(`${APP}/api/auth/google/callback?code=c&state=s`));
      expectError(res, "not_configured");
    });

    it("access_denied when the user cancels at Google", async () => {
      expectError(await callback({ error: "access_denied" }), "access_denied");
      expect(exchangeMock).not.toHaveBeenCalled();
    });

    it("server_error for other OAuth errors from Google", async () => {
      expectError(await callback({ error: "temporarily_unavailable" }), "server_error");
    });

    it("invalid_state when the flow cookie is missing (expired / replayed)", async () => {
      expectError(await callback({}, { withCookie: false }), "invalid_state");
      expect(exchangeMock).not.toHaveBeenCalled();
    });

    it("invalid_state when the state doesn't match (CSRF)", async () => {
      expectError(await callback({ state: "attacker-state" }), "invalid_state");
      expect(exchangeMock).not.toHaveBeenCalled();
    });

    it("invalid_state when the code is missing", async () => {
      const cfg = getGoogleConfig()!;
      cookieJar.set(cfg.flowCookieName, await signFlow(cfg, flow));
      const res = await GET(new NextRequest(`${APP}/api/auth/google/callback?state=${flow.state}`));
      expectError(res, "invalid_state");
    });

    it("cannot be replayed: the second use of the same callback fails", async () => {
      const cfg = getGoogleConfig()!;
      const signed = await signFlow(cfg, flow);
      const url = `${APP}/api/auth/google/callback?code=c&state=${flow.state}`;

      cookieJar.set(cfg.flowCookieName, signed);
      expect(redirectTarget(await GET(new NextRequest(url))).pathname).toBe("/dashboard");

      // Browser no longer has the cookie because the first response cleared it.
      completeLoginMock.mockClear(); // the first, legitimate call did create a session
      expectError(await GET(new NextRequest(url)), "invalid_state");
    });

    it("server_error when the code exchange fails", async () => {
      exchangeMock.mockRejectedValue(new Error("invalid_grant"));
      expectError(await callback(), "server_error");
    });

    it("invalid_token when ID token verification fails", async () => {
      verifyMock.mockRejectedValue(new Error("bad signature"));
      expectError(await callback(), "invalid_token");
      expect(backendMock).not.toHaveBeenCalled();
    });

    it("unverified_email when Google says the email is unverified", async () => {
      verifyMock.mockResolvedValue({ ...goodIdentity, emailVerified: false });
      expectError(await callback(), "unverified_email");
      expect(backendMock).not.toHaveBeenCalled();
    });

    it.each(["ada@gmail.com", "ada@evilbabcock.edu.ng", "ada@babcock.edu.ng.evil.io"])(
      "domain_not_allowed for %s (backend never called)",
      async (email) => {
        verifyMock.mockResolvedValue({ ...goodIdentity, email, hd: undefined });
        expectError(await callback(), "domain_not_allowed");
        expect(backendMock).not.toHaveBeenCalled();
      }
    );

    it("unverified_email for a Babcock-looking email without a Workspace hd claim", async () => {
      verifyMock.mockResolvedValue({ ...goodIdentity, hd: undefined });
      expectError(await callback(), "unverified_email");
      expect(backendMock).not.toHaveBeenCalled();
    });

    it("honours GOOGLE_ALLOWED_DOMAINS narrowing (staff rejected when students-only)", async () => {
      process.env.GOOGLE_ALLOWED_DOMAINS = "student.babcock.edu.ng,pg.babcock.edu.ng";
      verifyMock.mockResolvedValue({ ...goodIdentity, email: "staff@babcock.edu.ng" });
      expectError(await callback(), "domain_not_allowed");
    });

    it.each(["no_student_record", "account_inactive", "invalid_token", "server_error"] as const)(
      "passes through backend code %s",
      async (code) => {
        backendMock.mockResolvedValue({ ok: false, code });
        expectError(await callback(), code);
      }
    );

    it("server_error when the session can't be created", async () => {
      completeLoginMock.mockResolvedValue({ ok: false, error: "no token" });
      const res = await callback();
      expect(redirectTarget(res).searchParams.get("sso_error")).toBe("server_error");
    });

    it("server_error when createSession throws", async () => {
      completeLoginMock.mockRejectedValue(new Error("cookies unavailable"));
      const res = await callback();
      expect(redirectTarget(res).searchParams.get("sso_error")).toBe("server_error");
    });
  });
});
