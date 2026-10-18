/**
 * Tests for app/actions/registration-courses.ts — getHasSubmittedCoursesAction
 *
 * Mocks:
 *  - "server-only"      → required by lib/session.ts
 *  - "next/headers"     → in-memory cookie store (token)
 *  - global fetch       → intercepted via vi.stubGlobal
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const cookieStore = {
  _store: {} as Record<string, string>,
  set(name: string, value: string) {
    this._store[name] = value;
  },
  get(name: string) {
    const val = this._store[name];
    return val !== undefined ? { value: val } : undefined;
  },
  delete(name: string) {
    delete this._store[name];
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(cookieStore)),
}));

import { getHasSubmittedCoursesAction } from "@/app/actions/registration";

const MOCK_TOKEN = "test-bearer-token";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  cookieStore._store = {};
  vi.unstubAllGlobals();
  process.env.API_URL = "https://api.test.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getHasSubmittedCoursesAction — guards", () => {
  it("returns an error when API_URL is not set", async () => {
    delete process.env.API_URL;
    cookieStore._store["token"] = MOCK_TOKEN;

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("returns an error and does not call the API when there is no session token", async () => {
    const fetchSpy = mockFetch(200, {});

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("getHasSubmittedCoursesAction — HTTP responses", () => {
  beforeEach(() => {
    cookieStore._store["token"] = MOCK_TOKEN;
  });

  it("calls GET /api/v1/student/has-submitted-courses with the bearer token", async () => {
    const fetchSpy = mockFetch(200, {
      status: true,
      data: { has_submitted: false, locked_financial_reg: false },
    });

    await getHasSubmittedCoursesAction();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://api.test.com/api/v1/student/has-submitted-courses");
    expect(options.method).toBe("GET");
    expect(options.headers.Authorization).toBe(`Bearer ${MOCK_TOKEN}`);
  });

  it("maps has_submitted: true and locked_financial_reg", async () => {
    mockFetch(200, {
      status: true,
      message: "Succssfully fetched status",
      data: { has_submitted: true, locked_financial_reg: false },
    });

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual({ hasSubmitted: true, lockedFinancialReg: false });
    expect(result.message).toBe("Succssfully fetched status");
  });

  it("maps has_submitted: false and locked_financial_reg: true", async () => {
    mockFetch(200, {
      status: true,
      data: { has_submitted: false, locked_financial_reg: true },
    });

    const result = await getHasSubmittedCoursesAction();

    expect(result.data).toEqual({ hasSubmitted: false, lockedFinancialReg: true });
  });

  it("defaults lockedFinancialReg to false when the field is absent", async () => {
    mockFetch(200, { status: true, data: { has_submitted: true } });

    const result = await getHasSubmittedCoursesAction();

    expect(result.data).toEqual({ hasSubmitted: true, lockedFinancialReg: false });
  });

  it("returns an error when has_submitted is missing from the response", async () => {
    mockFetch(200, { status: true, data: {} });

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("surfaces the backend message on a non-OK response", async () => {
    mockFetch(500, { message: "Server exploded" });

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBe("Server exploded");
    expect(result.data).toBeUndefined();
  });

  it("falls back to a default message when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error("not json");
        },
      })
    );

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBe("Failed to check course submission status");
  });

  it("returns a connection error when fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getHasSubmittedCoursesAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
    errorSpy.mockRestore();
  });
});

