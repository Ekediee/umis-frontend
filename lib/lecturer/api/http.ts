/**
 * HTTP client for the live BU Pulse lecturer API (owned by university ICT).
 *
 * Switch with env:
 *   NEXT_PUBLIC_LECTURER_API_MODE=live      (default: mock)
 *   NEXT_PUBLIC_LECTURER_API_URL=https://umis-sb.babcock.edu.ng/api/v1
 *
 * Auth: the session cookie set at sign-in is sent with `credentials: "include"`.
 */

export const API_MODE: "mock" | "live" = process.env.NEXT_PUBLIC_LECTURER_API_MODE === "live" ? "live" : "mock";
const BASE_URL = process.env.NEXT_PUBLIC_LECTURER_API_URL ?? "/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    /** Support reference shown on every error, e.g. GR-5B3-1042 (quality bar). */
    public code: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface LiveRequest {
  method: HttpMethod;
  path: string;
  body?: unknown;
  /** Writes carry an idempotency key so a double tap sends once (5B rules). */
  idempotent?: boolean;
}

export async function http<T>({ method, path, body, idempotent }: LiveRequest): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotent && typeof crypto !== "undefined") headers["Idempotency-Key"] = crypto.randomUUID();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: "include" });
  } catch {
    throw new ApiError("You're offline or the server can't be reached. We'll retry when you're back.", "NET-0001");
  }

  if (!res.ok) {
    let message = "Something went wrong. Try again, or get help with the reference below.";
    let code = `HTTP-${res.status}`;
    try {
      const data = await res.json();
      message = data.message ?? message;
      code = data.code ?? code;
    } catch {
      // non-JSON error body
    }
    if (res.status === 401 && typeof window !== "undefined") window.location.href = "/lecturer/sign-in?reason=expired";
    throw new ApiError(message, code, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/**
 * Route a call to the live API or the mock. Every endpoint in `index.ts`
 * declares its future HTTP contract right next to its mock — the only place
 * to change when the backend lands.
 */
export function call<T>(mock: () => Promise<T>, live: LiveRequest): Promise<T> {
  if (API_MODE === "live") return http<T>(live);
  return mock().catch((err: unknown) => {
    if (err instanceof ApiError) throw err;
    const e = err as { message?: string; code?: string };
    throw new ApiError(e.message ?? "Something went wrong.", e.code ?? "MOCK-500");
  });
}

export const q = (params: Record<string, string | number | null | undefined>) => {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== null && v !== undefined && v !== "" && s.set(k, String(v)));
  const str = s.toString();
  return str ? `?${str}` : "";
};
