/**
 * Tests for app/actions/user.ts — refreshAcademicStandingAction
 *
 * Mocks:
 *  - "server-only"      → required by lib/session.ts
 *  - "next/headers"     → in-memory cookie store (token + user_data)
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

import { refreshAcademicStandingAction } from "@/app/actions/user";

const MOCK_TOKEN = "test-bearer-token";

const SESSION_USER = {
  entity_id: 1,
  entity_name: "OGUNLEYE, IREMIDE TRIUMPH",
  user_data: {
    student_name: "OGUNLEYE, IREMIDE TRIUMPH",
    matric_number: "23/0039",
    department: "Software Engineering",
    current_level: 300,
    cummulative_gpa: 4.1,
    contact_information: { email: "keep@me.com" },
    academic_information: {
      status: "Active",
      study_level: 300,
      cummulative_gpa: 4.1,
      course_advisor: "Dr. Keep",
    },
  },
};

const PROFILE_RESPONSE = {
  status: true,
  message: "success",
  data: {
    student_name: "OGUNLEYE, IREMIDE TRIUMPH",
    current_level: 400,
    cummulative_gpa: 4.3578947368421055,
  },
};

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function readUserCookie() {
  return JSON.parse(cookieStore._store["user_data"]);
}

beforeEach(() => {
  cookieStore._store = {};
  vi.unstubAllGlobals();
  process.env.API_URL = "https://api.test.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("refreshAcademicStandingAction — guards", () => {
  it("fails when API_URL is not set", async () => {
    delete process.env.API_URL;
    cookieStore._store["token"] = MOCK_TOKEN;

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("fails when there is no session token", async () => {
    const fetchSpy = mockFetch(200, PROFILE_RESPONSE);

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails when there is no user_data cookie, without writing one", async () => {
    cookieStore._store["token"] = MOCK_TOKEN;
    mockFetch(200, PROFILE_RESPONSE);

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(cookieStore._store["user_data"]).toBeUndefined();
  });
});

describe("refreshAcademicStandingAction — API responses", () => {
  beforeEach(() => {
    cookieStore._store["token"] = MOCK_TOKEN;
    cookieStore._store["user_data"] = JSON.stringify(SESSION_USER);
  });

  it("calls GET /api/v1/student/profile with the bearer token", async () => {
    const fetchSpy = mockFetch(200, PROFILE_RESPONSE);

    await refreshAcademicStandingAction();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://api.test.com/api/v1/student/profile");
    expect(options.method).toBe("GET");
    expect(options.headers.Authorization).toBe(`Bearer ${MOCK_TOKEN}`);
  });

  it("writes level and CGPA to both top-level and academic_information, keeping everything else", async () => {
    mockFetch(200, PROFILE_RESPONSE);

    const result = await refreshAcademicStandingAction();

    expect(result).toMatchObject({
      success: true,
      current_level: 400,
      cummulative_gpa: 4.3578947368421055,
    });

    const saved = readUserCookie();
    expect(saved.user_data.current_level).toBe(400);
    expect(saved.user_data.cummulative_gpa).toBe(4.3578947368421055);
    expect(saved.user_data.academic_information.study_level).toBe(400);
    expect(saved.user_data.academic_information.cummulative_gpa).toBe(4.3578947368421055);

    // Untouched fields
    expect(saved.entity_id).toBe(1);
    expect(saved.user_data.contact_information.email).toBe("keep@me.com");
    expect(saved.user_data.academic_information.status).toBe("Active");
    expect(saved.user_data.academic_information.course_advisor).toBe("Dr. Keep");
    expect(saved.user_data.department).toBe("Software Engineering");
  });

  it("does not overwrite existing values with null / missing fields", async () => {
    mockFetch(200, {
      status: true,
      data: { current_level: 400, cummulative_gpa: null },
    });

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(true);
    const saved = readUserCookie();
    expect(saved.user_data.current_level).toBe(400);
    expect(saved.user_data.academic_information.study_level).toBe(400);
    expect(saved.user_data.cummulative_gpa).toBe(4.1);
    expect(saved.user_data.academic_information.cummulative_gpa).toBe(4.1);
  });

  it("fails and leaves the cookie unchanged when neither value is present", async () => {
    mockFetch(200, { status: true, data: { student_name: "X" } });

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(readUserCookie()).toEqual(SESSION_USER);
  });

  it("fails and leaves the cookie unchanged on a non-OK response", async () => {
    mockFetch(500, { message: "boom" });

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(readUserCookie()).toEqual(SESSION_USER);
  });

  it("fails gracefully on a network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await refreshAcademicStandingAction();

    expect(result.success).toBe(false);
    expect(readUserCookie()).toEqual(SESSION_USER);
    errorSpy.mockRestore();
  });
});

