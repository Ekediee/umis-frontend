// @vitest-environment node
// jose needs real Uint8Array / WebCrypto, which jsdom's realm breaks.
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { SignJWT, generateKeyPair, exportJWK, type JWK } from "jose";
import {
  buildAuthorizeUrl,
  codeChallenge,
  createFlow,
  exchangeCodeForIdToken,
  getGoogleConfig,
  readFlow,
  signFlow,
  statesMatch,
  verifyIdToken,
} from "./google";

const CLIENT_ID = "test-client.apps.googleusercontent.com";

function setEnv(overrides: Record<string, string | undefined> = {}) {
  const env: Record<string, string | undefined> = {
    GOOGLE_CLIENT_ID: CLIENT_ID,
    GOOGLE_CLIENT_SECRET: "shh",
    NEXTAUTH_URL: "https://umis.babcock.edu.ng",
    NEXTAUTH_SECRET: "test-secret",
    APP_URL: undefined,
    ...overrides,
  };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("getGoogleConfig", () => {
  beforeEach(() => setEnv());

  it("builds redirect URI and secure cookie name from the configured origin", () => {
    const cfg = getGoogleConfig()!;
    expect(cfg.redirectUri).toBe("https://umis.babcock.edu.ng/api/auth/google/callback");
    expect(cfg.secureCookies).toBe(true);
    expect(cfg.flowCookieName).toBe("__Host-google_oauth_flow");
  });

  it("prefers APP_URL over NEXTAUTH_URL and normalises a trailing path/slash", () => {
    setEnv({ APP_URL: "http://localhost:3000/" });
    const cfg = getGoogleConfig()!;
    expect(cfg.appUrl).toBe("http://localhost:3000");
    expect(cfg.secureCookies).toBe(false);
    expect(cfg.flowCookieName).toBe("google_oauth_flow");
  });

  it.each(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_URL", "NEXTAUTH_SECRET"])(
    "returns null (SSO disabled) when %s is missing",
    (key) => {
      setEnv({ [key]: undefined });
      expect(getGoogleConfig()).toBeNull();
    }
  );
});

describe("authorize URL and PKCE", () => {
  beforeEach(() => setEnv());

  it("requests the code flow with PKCE, account chooser and hd hint", () => {
    const cfg = getGoogleConfig()!;
    const flow = createFlow();
    const url = new URL(buildAuthorizeUrl(cfg, flow));
    const p = url.searchParams;

    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(p.get("client_id")).toBe(CLIENT_ID);
    expect(p.get("redirect_uri")).toBe(cfg.redirectUri);
    expect(p.get("response_type")).toBe("code");
    expect(p.get("scope")).toBe("openid email profile");
    expect(p.get("state")).toBe(flow.state);
    expect(p.get("nonce")).toBe(flow.nonce);
    expect(p.get("code_challenge")).toBe(codeChallenge(flow.verifier));
    expect(p.get("code_challenge_method")).toBe("S256");
    expect(p.get("prompt")).toBe("select_account");
    expect(p.get("hd")).toBe("*");
    // The secret and verifier must never travel in the URL.
    expect(url.toString()).not.toContain("shh");
    expect(url.toString()).not.toContain(flow.verifier);
  });

  it("matches the RFC 7636 S256 test vector", () => {
    expect(codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    );
  });

  it("generates unique flows", () => {
    const a = createFlow();
    const b = createFlow();
    expect(a.state).not.toBe(b.state);
    expect(a.verifier).not.toBe(b.verifier);
  });
});

describe("flow cookie signing", () => {
  beforeEach(() => setEnv());

  it("round-trips a signed flow", async () => {
    const cfg = getGoogleConfig()!;
    const flow = createFlow();
    expect(await readFlow(cfg, await signFlow(cfg, flow))).toEqual(flow);
  });

  it("rejects missing, tampered and differently-keyed tokens", async () => {
    const cfg = getGoogleConfig()!;
    const token = await signFlow(cfg, createFlow());

    expect(await readFlow(cfg, undefined)).toBeNull();
    expect(await readFlow(cfg, "garbage")).toBeNull();
    expect(await readFlow(cfg, token.slice(0, -2) + "xx")).toBeNull();

    setEnv({ NEXTAUTH_SECRET: "another-secret" });
    expect(await readFlow(getGoogleConfig()!, token)).toBeNull();
  });

  it("rejects an expired flow", async () => {
    vi.useFakeTimers();
    try {
      const cfg = getGoogleConfig()!;
      const token = await signFlow(cfg, createFlow());
      vi.advanceTimersByTime(11 * 60 * 1000);
      expect(await readFlow(cfg, token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("statesMatch", () => {
  it("compares safely", () => {
    expect(statesMatch("abc", "abc")).toBe(true);
    expect(statesMatch("abc", "abd")).toBe(false);
    expect(statesMatch("abc", "abcd")).toBe(false);
    expect(statesMatch(null, "abc")).toBe(false);
    expect(statesMatch("", "")).toBe(false);
  });
});

describe("exchangeCodeForIdToken", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => setEnv());

  it("posts the code, verifier and secret to Google and returns the id_token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id_token: "the.id.token" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const cfg = getGoogleConfig()!;
    await expect(exchangeCodeForIdToken(cfg, "auth-code", "verifier-1")).resolves.toBe("the.id.token");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = init.body as URLSearchParams;
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("code_verifier")).toBe("verifier-1");
    expect(body.get("client_secret")).toBe("shh");
    expect(body.get("grant_type")).toBe("authorization_code");
    // TLS verification must be pinned on for Google, whatever NODE_TLS_REJECT_UNAUTHORIZED says.
    expect(init.dispatcher).toBeDefined();
  });

  it("throws when Google rejects the code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }))
    );
    await expect(exchangeCodeForIdToken(getGoogleConfig()!, "bad", "v")).rejects.toThrow(/invalid_grant/);
  });
});

describe("verifyIdToken", () => {
  let privateKey: CryptoKey;
  let jwk: JWK;

  beforeAll(async () => {
    const pair = await generateKeyPair("RS256");
    privateKey = pair.privateKey;
    jwk = { ...(await exportJWK(pair.publicKey)), kid: "test-key", alg: "RS256", use: "sig" };
  });

  beforeEach(() => {
    setEnv();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => new Response(JSON.stringify({ keys: [jwk] }), { status: 200 }))
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  const sign = (claims: Record<string, unknown>, opts: { iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT({
      email: "ada@student.babcock.edu.ng",
      email_verified: true,
      hd: "babcock.edu.ng",
      nonce: "n-1",
      name: "Ada",
      ...claims,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(opts.iss ?? "https://accounts.google.com")
      .setAudience(opts.aud ?? CLIENT_ID)
      .setSubject("sub-123")
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? "5m")
      .sign(privateKey);

  it("returns the verified identity", async () => {
    const identity = await verifyIdToken(getGoogleConfig()!, await sign({}), "n-1");
    expect(identity).toEqual({
      sub: "sub-123",
      email: "ada@student.babcock.edu.ng",
      emailVerified: true,
      hd: "babcock.edu.ng",
      name: "Ada",
    });
  });

  it("rejects a wrong audience", async () => {
    await expect(verifyIdToken(getGoogleConfig()!, await sign({}, { aud: "someone-else" }), "n-1")).rejects.toThrow();
  });

  it("rejects a wrong issuer", async () => {
    await expect(verifyIdToken(getGoogleConfig()!, await sign({}, { iss: "https://evil.example" }), "n-1")).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    await expect(verifyIdToken(getGoogleConfig()!, await sign({}, { exp: "-1m" }), "n-1")).rejects.toThrow();
  });

  it("rejects a nonce mismatch", async () => {
    await expect(verifyIdToken(getGoogleConfig()!, await sign({ nonce: "other" }), "n-1")).rejects.toThrow(/nonce/);
  });

  it("rejects a token signed by an unknown key", async () => {
    const other = await generateKeyPair("RS256");
    const forged = await new SignJWT({ email: "x@babcock.edu.ng", email_verified: true, nonce: "n-1" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer("https://accounts.google.com")
      .setAudience(CLIENT_ID)
      .setSubject("s")
      .setExpirationTime("5m")
      .sign(other.privateKey);
    await expect(verifyIdToken(getGoogleConfig()!, forged, "n-1")).rejects.toThrow();
  });

  it("treats email_verified 'true' (string) as verified and false as unverified", async () => {
    const cfg = getGoogleConfig()!;
    expect((await verifyIdToken(cfg, await sign({ email_verified: "true" }), "n-1")).emailVerified).toBe(true);
    expect((await verifyIdToken(cfg, await sign({ email_verified: false }), "n-1")).emailVerified).toBe(false);
  });
});
