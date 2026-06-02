import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only before import
vi.mock("server-only", () => ({}));

// Spy/mock fs calls so tests don't affect actual file system
const appendFileSpy = vi.fn((path, data, encoding, cb) => {
  if (typeof cb === "function") cb(null);
});
const existsSyncSpy = vi.fn(() => true);
const mkdirSyncSpy = vi.fn();

vi.mock("fs", () => ({
  existsSync: () => existsSyncSpy(),
  mkdirSync: (path: string, options?: any) => mkdirSyncSpy(path, options),
  appendFile: (path: string, data: string, encoding: string, cb: any) =>
    appendFileSpy(path, data, encoding, cb),
}));

// Now import logger module to test it
import { sanitize, logger, loggedFetch, withLogging } from "@/lib/logger";

describe("sanitize", () => {
  it("should mask sensitive fields recursively and keep safe fields intact", () => {
    const input = {
      username: "active_user",
      password: "mysecretpassword123",
      nested: {
        token: "session-jwt-token",
        secretKey: "highlysecretinfo",
        safeField: "safe_value",
      },
      arr: [{ authorization: "Bearer xyz_secret_auth" }],
    };

    const output = sanitize(input);

    expect(output.username).toBe("active_user");
    expect(output.password).toBe("*****");
    expect(output.nested.token).toBe("*****");
    expect(output.nested.secretKey).toBe("*****");
    expect(output.nested.safeField).toBe("safe_value");
    expect(output.arr[0].authorization).toBe("*****");
  });

  it("should mask sensitive fields in JSON strings", () => {
    const rawJson = '{"user_name":"23/0039","password":"my-super-secret-password"}';
    const output = sanitize(rawJson);
    expect(output).toContain('"user_name":"23/0039"');
    expect(output).toContain('"password":"*****"');
    expect(output).not.toContain("my-super-secret-password");
  });

  it("should mask sensitive fields in raw strings using fallback regex", () => {
    const rawString = "user_name=23/0039&password=mysecretpassword&secret=dontlogthis";
    const output = sanitize(rawString);
    expect(output).toContain("user_name=23/0039");
    expect(output).toContain("password=*****");
    expect(output).toContain("secret=*****");
    expect(output).not.toContain("mysecretpassword");
    expect(output).not.toContain("dontlogthis");
  });
});

describe("logger methods", () => {
  beforeEach(() => {
    appendFileSpy.mockClear();
  });

  it("should write info logs to app.log", () => {
    logger.info("Test info message", { data: "test" });
    expect(appendFileSpy).toHaveBeenCalledTimes(1);
    const [path, data] = appendFileSpy.mock.calls[0];
    expect(path).toContain("app.log");
    expect(data).toContain("[INFO] Test info message");
    expect(data).toContain('{"data":"test"}');
  });

  it("should write error logs to both app.log and error.log", () => {
    logger.error("Test error message", { err: "oops" });
    expect(appendFileSpy).toHaveBeenCalledTimes(2);

    const calls = appendFileSpy.mock.calls;
    const paths = calls.map((c) => c[0]);
    expect(paths.some((p) => p.includes("app.log"))).toBe(true);
    expect(paths.some((p) => p.includes("error.log"))).toBe(true);
    expect(calls[0][1]).toContain("[ERROR] Test error message");
    expect(calls[0][1]).toContain('{"err":"oops"}');
  });
});

describe("loggedFetch", () => {
  beforeEach(() => {
    appendFileSpy.mockClear();
    vi.unstubAllGlobals();
  });

  it("should call global fetch and log request/response with masked auth", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
    };
    const fetchSpy = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal("fetch", fetchSpy);

    const response = await loggedFetch("https://api.test.com/v1/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer super-secret-token",
      },
      body: JSON.stringify({ name: "test-resource" }),
    });

    expect(response).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.test.com/v1/data",
      expect.any(Object)
    );

    // Should write once for request start, once for response
    expect(appendFileSpy).toHaveBeenCalledTimes(2);

    const requestLog = appendFileSpy.mock.calls[0][1];
    const responseLog = appendFileSpy.mock.calls[1][1];

    expect(requestLog).toContain("Outgoing API Request");
    expect(requestLog).toContain("https://api.test.com/v1/data");
    expect(requestLog).toContain('"Authorization":"*****"'); // Masked!
    expect(responseLog).toContain("Outgoing API Response Success");
    expect(responseLog).toContain("Status: 200");
  });
});

describe("withLogging HOF", () => {
  beforeEach(() => {
    appendFileSpy.mockClear();
  });

  it("should wrap route handler and log incoming request and status", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
    };
    const handlerSpy = vi.fn().mockResolvedValue(mockResponse);
    const wrapped = withLogging(handlerSpy);

    const req = {
      url: "http://localhost:3000/api/chat",
      method: "POST",
    } as unknown as Request;

    const response = await wrapped(req, "param1", "param2");
    expect(response).toBe(mockResponse);
    expect(handlerSpy).toHaveBeenCalledWith(req, "param1", "param2");

    // Request start + Response end
    expect(appendFileSpy).toHaveBeenCalledTimes(2);

    const requestLog = appendFileSpy.mock.calls[0][1];
    const responseLog = appendFileSpy.mock.calls[1][1];

    expect(requestLog).toContain("Incoming API Request: POST /api/chat");
    expect(responseLog).toContain(
      "Incoming API Response Success: POST /api/chat - Status: 201"
    );
  });
});
