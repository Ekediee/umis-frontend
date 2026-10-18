/**
 * Tests for app/actions/exam-portal.ts — accessExamPortalAction
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

import { accessExamPortalAction } from "@/app/actions/exam-portal";
import {
  EXAM_PORTAL_URLS,
  EXAM_AUTH_USERNAME,
  EXAM_AUTH_PASSWORD,
} from "@/app/actions/exam-portal.types";

const MOCK_TOKEN = "test-bearer-token";

const SESSION_USER = {
  entity_id: "PT/21/2043",
  entity_name: "Elizabeth Ajiboye",
  user_data: {
    student_name: "Elizabeth Ajiboye",
    matric_number: "PT/21/2043",
    school_name: "Veronica Adeleke School of Social Sciences",
    department: "Accounting",
    degree_name: "Accounting",
    personal_information: {
      student_name: "Elizabeth Ajiboye",
      matric_number: "PT/21/2043",
      profile_picture_url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  },
};

const SAMPLE_CBT_HTML = `<!DOCTYPE html>
<html>
<head><title>Welcome to Babcock University CBT Platform</title></head>
<body>
  <h1>Welcome to Babcock University CBT Platform</h1>
  <form action="/verify" method="POST">
    <button type="submit">Verify</button>
  </form>
</body>
</html>`;

beforeEach(() => {
  cookieStore._store = {};
  vi.unstubAllGlobals();
  process.env.API_URL = "https://api.test.com";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accessExamPortalAction", () => {
  it("fails when no user session exists", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await accessExamPortalAction();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not authenticated/i);
  });

  it("sends POST with Basic Auth and expected payload to one of the exam URLs", async () => {
    cookieStore._store["token"] = MOCK_TOKEN;
    cookieStore._store["user_data"] = JSON.stringify(SESSION_USER);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => SAMPLE_CBT_HTML,
      text: async () => SAMPLE_CBT_HTML,
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await accessExamPortalAction();

    expect(result.success).toBe(true);
    expect(result.html).toContain("Welcome to Babcock University CBT Platform");
    expect(EXAM_PORTAL_URLS).toContain(result.portalUrl);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = fetchSpy.mock.calls[0];
    expect(EXAM_PORTAL_URLS).toContain(calledUrl);
    expect(calledInit.method).toBe("POST");

    const expectedAuth =
      "Basic " + btoa(`${EXAM_AUTH_USERNAME}:${EXAM_AUTH_PASSWORD}`);
    expect(calledInit.headers["Authorization"]).toBe(expectedAuth);
    expect(calledInit.headers["Content-Type"]).toBe("application/json");
    expect(calledInit.headers["Accept"]).toBe("application/json");

    const parsedBody = JSON.parse(calledInit.body);
    expect(parsedBody).toEqual({
      auth_type: "ba",
      session_id: expect.any(String),
      student_id: "PT/21/2043",
      student_name: "Elizabeth Ajiboye",
      photo:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      faculty: "Veronica Adeleke School of Social Sciences",
      department: "Accounting",
      program: "Accounting",
    });
    expect(parsedBody.session_id.length).toBeGreaterThan(0);
  });

  it("handles raw text/html response when response.json() throws", async () => {
    cookieStore._store["token"] = MOCK_TOKEN;
    cookieStore._store["user_data"] = JSON.stringify(SESSION_USER);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      clone: () => ({
        text: async () => SAMPLE_CBT_HTML,
      }),
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON at position 0");
      },
      text: async () => SAMPLE_CBT_HTML,
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await accessExamPortalAction();

    expect(result.success).toBe(true);
    expect(result.html).toBe(SAMPLE_CBT_HTML);
  });

  it("returns error when the exam server responds with non-OK status", async () => {
    cookieStore._store["token"] = MOCK_TOKEN;
    cookieStore._store["user_data"] = JSON.stringify(SESSION_USER);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      clone: () => ({ text: async () => "Service Unavailable" }),
      json: async () => ({ message: "Service Unavailable" }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await accessExamPortalAction();

    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP Error: 503");
  });
});

