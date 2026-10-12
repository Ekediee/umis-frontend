/**
 * HTTP client for the phase-1 student endpoints.
 *
 * Switch with env:
 *   NEXT_PUBLIC_STUDENT_API_MODE=live      (default: mock)
 *
 * Live calls go to `/api/student/*`, a same-origin route handler that adds the
 * student's bearer token from the httpOnly session cookie and forwards to
 * `${API_URL}/api/v1/student/*`. The token never reaches browser JavaScript.
 */

import { ApiError } from "@/lib/lecturer/api/http";

export { ApiError };

export const STUDENT_API_MODE: "mock" | "live" = process.env.NEXT_PUBLIC_STUDENT_API_MODE === "live" ? "live" : "mock";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface LiveRequest {
  method: HttpMethod;
  /** Path after /api/v1/student, e.g. "/courses/COSC%20204/feed" */
  path: string;
  body?: unknown;
  idempotent?: boolean;
}

export async function http<T>({ method, path, body, idempotent }: LiveRequest): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotent && typeof crypto !== "undefined") headers["Idempotency-Key"] = crypto.randomUUID();

  let res: Response;
  try {
    res = await fetch(`/api/student${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" });
  } catch {
    throw new ApiError("You're offline or the server can't be reached. Try again when you're back online.", "NET-0001");
  }

  if (!res.ok) {
    let message = "Something went wrong. Try again, or contact support with the reference below.";
    let code = `HTTP-${res.status}`;
    try {
      const data = await res.json();
      message = data.message ?? message;
      code = data.code ?? code;
    } catch {
      // non-JSON error body
    }
    if (res.status === 401 && typeof window !== "undefined") window.location.href = "/login?reason=expired";
    throw new ApiError(message, code, res.status);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  // The UMIS backend wraps payloads as { status, message, data }
  return (json && typeof json === "object" && "data" in json ? json.data : json) as T;
}

/** Route a call to the live API or the mock; the contract sits next to the mock in `index.ts`. */
export function call<T>(mock: () => Promise<T>, live: LiveRequest): Promise<T> {
  if (STUDENT_API_MODE === "live") return http<T>(live);
  return mock().catch((err: unknown) => {
    if (err instanceof ApiError) throw err;
    const e = err as { message?: string; code?: string };
    throw new ApiError(e.message ?? "Something went wrong.", e.code ?? "MOCK-500");
  });
}

export const enc = encodeURIComponent;
