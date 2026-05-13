/**
 * Tests for lib/session.ts
 *
 * We mock `server-only` and `next/headers` because this module runs in a
 * Next.js server environment that isn't available in vitest/jsdom.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Mocks ----
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

// ---- Import after mocks are set up ----
import {
  createSession,
  deleteSession,
  getSessionToken,
  getSessionUser,
  type UserData,
} from "@/lib/session";

const mockUser: UserData = {
  id: "1",
  name: "Yakubu Onome Joy",
  matric_no: "CS/2021/4092",
  department: "Computer Science",
  school: "School of Computing & Information Technology",
  level: "300",
  status: "Active",
};

beforeEach(() => {
  // Clear cookie store before each test
  cookieStore._store = {};
});

// ---- Tests ----

describe("createSession", () => {
  it("stores the token in the token cookie", async () => {
    await createSession("my-test-token");
    expect(cookieStore._store["token"]).toBe("my-test-token");
  });

  it("stores serialised user data in the user_data cookie when provided", async () => {
    await createSession("my-test-token", mockUser);
    expect(cookieStore._store["user_data"]).toBe(JSON.stringify(mockUser));
  });

  it("does NOT create a user_data cookie when userData is omitted", async () => {
    await createSession("my-test-token");
    expect(cookieStore._store["user_data"]).toBeUndefined();
  });
});

describe("getSessionToken", () => {
  it("returns the stored token", async () => {
    cookieStore._store["token"] = "abc123";
    const token = await getSessionToken();
    expect(token).toBe("abc123");
  });

  it("returns undefined when no token cookie exists", async () => {
    const token = await getSessionToken();
    expect(token).toBeUndefined();
  });
});

describe("getSessionUser", () => {
  it("returns parsed user data when user_data cookie exists", async () => {
    cookieStore._store["user_data"] = JSON.stringify(mockUser);
    const user = await getSessionUser();
    expect(user).toEqual(mockUser);
  });

  it("returns null when user_data cookie does not exist", async () => {
    const user = await getSessionUser();
    expect(user).toBeNull();
  });

  it("returns null when user_data cookie contains invalid JSON", async () => {
    cookieStore._store["user_data"] = "not-valid-json{{";
    const user = await getSessionUser();
    expect(user).toBeNull();
  });
});

describe("deleteSession", () => {
  it("removes both the token and user_data cookies", async () => {
    cookieStore._store["token"] = "some-token";
    cookieStore._store["user_data"] = JSON.stringify(mockUser);

    await deleteSession();

    expect(cookieStore._store["token"]).toBeUndefined();
    expect(cookieStore._store["user_data"]).toBeUndefined();
  });
});

describe("createSession + getSessionUser round-trip", () => {
  it("stores and retrieves the same user data", async () => {
    await createSession("round-trip-token", mockUser);
    const retrieved = await getSessionUser();
    expect(retrieved).toEqual(mockUser);
  });
});
