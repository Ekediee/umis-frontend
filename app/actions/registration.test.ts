/**
 * Tests for app/actions/registration.ts — getClassGroupsAction
 *
 * Mocks:
 *  - "server-only"      → required by lib/session.ts
 *  - "next/headers"     → provides the cookie store used by getSessionToken()
 *  - global fetch       → intercepted via vi.stubGlobal
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---- Mock server-only -------------------------------------------------------
vi.mock("server-only", () => ({}));

// ---- Mock next/headers (cookie store) ---------------------------------------
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

// ---- Import after mocks ------------------------------------------------------
import { 
  getClassGroupsAction, 
  getSemesterRegistrationStatusAction, 
  registerSemesterAction 
} from "@/app/actions/registration";

// ---- Helpers -----------------------------------------------------------------
const MOCK_TOKEN = "test-bearer-token";

/** Real API response shape */
const MOCK_API_RESPONSE = {
  status: true,
  message: "Class group retrieved successfully",
  data: {
    has_many_class_option: true,
    class_options: [
      { class_option_id: "143", class_option_name: "Soft Eng Group A" },
      { class_option_id: "144", class_option_name: "Soft Eng Group B" },
      { class_option_id: "154", class_option_name: "Soft Eng Group C" },
    ]
  }
};

/** Normalised shape the UI expects */
const EXPECTED_GROUPS = [
  { id: "143", name: "Soft Eng Group A" },
  { id: "144", name: "Soft Eng Group B" },
  { id: "154", name: "Soft Eng Group C" },
];

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    })
  );
}

// ---- Setup / Teardown --------------------------------------------------------
beforeEach(() => {
  cookieStore._store = {};
  vi.unstubAllGlobals();
  process.env.API_URL = "https://api.test.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---- Tests -------------------------------------------------------------------

describe("getClassGroupsAction — environment / auth guards", () => {
  it("returns an error when API_URL is not set", async () => {
    delete process.env.API_URL;
    cookieStore._store["token"] = MOCK_TOKEN;

    const result = await getClassGroupsAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("returns an error when no session token is present", async () => {
    // No token in cookie store
    const result = await getClassGroupsAction();

    expect(result.error).toMatch(/not authenticated/i);
    expect(result.data).toBeUndefined();
  });
});

describe("getClassGroupsAction — HTTP responses", () => {
  beforeEach(() => {
    cookieStore._store["token"] = MOCK_TOKEN;
  });

  it("returns an error when the API responds with a non-OK status", async () => {
    mockFetch(403, { status: false, message: "Forbidden" });

    const result = await getClassGroupsAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("normalises the nested class_option shape into { id, name } pairs", async () => {
    mockFetch(200, MOCK_API_RESPONSE);

    const result = await getClassGroupsAction();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual(EXPECTED_GROUPS);
  });

  it("returns an empty array when data is missing from the response", async () => {
    mockFetch(200, { status: true, message: "ok" });

    const result = await getClassGroupsAction();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual([]);
  });

  it("returns an error when fetch throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const result = await getClassGroupsAction();

    expect(result.error).toMatch(/connect/i);
    expect(result.data).toBeUndefined();
  });

  it("sends the Authorization header with the Bearer token", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => MOCK_API_RESPONSE,
    });
    vi.stubGlobal("fetch", fetchSpy);

    await getClassGroupsAction();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toContain("/api/v1/student/class-option");
    expect(options?.headers?.["Authorization"]).toBe(`Bearer ${MOCK_TOKEN}`);
  });
});

/** Real backend payload for the /commence endpoint */
const MOCK_SEMESTER_RESPONSE = {
  status: true,
  message: "Commencement Semester found",
  data: {
    semester: "2025/2026.2",
    start_date: "2026-01-05",
    end_date: "2026-04-24",
    late_reg_date: "2026-04-24",
  },
};

/** Normalised shape the UI expects */
const EXPECTED_SEMESTER_INFO = {
  semester: "2025/2026.2",
  startDate: "2026-01-05",
  endDate: "2026-04-24",
  lateRegDate: "2026-04-24",
};

describe("getSemesterRegistrationStatusAction — environment / auth guards", () => {
  it("returns an error when API_URL is not set", async () => {
    delete process.env.API_URL;
    cookieStore._store["token"] = MOCK_TOKEN;

    const result = await getSemesterRegistrationStatusAction();

    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  it("returns an error when no session token is present", async () => {
    // No token in cookie store
    const result = await getSemesterRegistrationStatusAction();

    expect(result.error).toMatch(/not authenticated/i);
    expect(result.data).toBeUndefined();
  });
});

describe("getSemesterRegistrationStatusAction — HTTP responses", () => {
  beforeEach(() => {
    cookieStore._store["token"] = MOCK_TOKEN;
  });

  it("returns SemesterInfo when the API responds successfully", async () => {
    mockFetch(200, MOCK_SEMESTER_RESPONSE);

    const result = await getSemesterRegistrationStatusAction();

    expect(result.error).toBeUndefined();
    expect(result.data).toEqual(EXPECTED_SEMESTER_INFO);
  });

  it("maps snake_case API fields to camelCase SemesterInfo fields", async () => {
    mockFetch(200, MOCK_SEMESTER_RESPONSE);

    const result = await getSemesterRegistrationStatusAction();

    expect(result.data?.semester).toBe("2025/2026.2");
    expect(result.data?.startDate).toBe("2026-01-05");
    expect(result.data?.endDate).toBe("2026-04-24");
    expect(result.data?.lateRegDate).toBe("2026-04-24");
  });

  it("returns an error when the API responds with a non-OK status", async () => {
    mockFetch(500, { status: false, message: "Server error" });

    const result = await getSemesterRegistrationStatusAction();

    expect(result.error).toBe("Server error");
    expect(result.data).toBeUndefined();
  });

  it("returns an error when fetch throws a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const result = await getSemesterRegistrationStatusAction();

    expect(result.error).toMatch(/connect/i);
    expect(result.data).toBeUndefined();
  });
});

describe("registerSemesterAction", () => {
  beforeEach(() => {
    cookieStore._store["token"] = MOCK_TOKEN;
  });

  it("returns success: true when API registers successfully", async () => {
    mockFetch(200, { status: true, message: "Registered successfully" });

    const result = await registerSemesterAction();

    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it("returns an error when registration fails", async () => {
    mockFetch(400, { status: false, message: "Cannot register: Outstanding balance" });

    const result = await registerSemesterAction();

    expect(result.error).toBe("Cannot register: Outstanding balance");
    expect(result.success).toBeUndefined();
  });
});

