import "server-only";
import { loggedFetch } from "@/lib/logger";
import { isSsoErrorCode, type SsoErrorCode } from "@/lib/auth/sso-errors";

/**
 * Exchanges a Google ID token for a UMIS session via the backend.
 *
 * POST {API_URL}/api/auth/google   body: { id_token }
 *   200 -> same payload as /api/auth/login: { data: { token, user } }
 *   non-2xx -> { status: false, message, code? } where `code` is an SsoErrorCode
 *
 * The backend must verify the ID token itself; the frontend's checks are only a
 * fast-fail convenience (see GOOGLE_SSO.md).
 */
export const BACKEND_GOOGLE_LOGIN_PATH = "/api/auth/google";

export type BackendGoogleLoginResult =
  | { ok: true; payload: unknown }
  | { ok: false; code: SsoErrorCode };

/** Used only when the backend doesn't send a recognised `code`. */
function codeFromStatus(status: number): SsoErrorCode {
  if (status === 401) return "invalid_token";
  if (status === 403) return "domain_not_allowed";
  if (status === 404) return "no_student_record";
  if (status === 423) return "account_inactive";
  return "server_error";
}

export async function loginWithGoogleIdToken(idToken: string): Promise<BackendGoogleLoginResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error("[google-sso] API_URL is not defined");
    return { ok: false, code: "server_error" };
  }

  try {
    const response = await loggedFetch(`${apiUrl}${BACKEND_GOOGLE_LOGIN_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const backendCode = json?.code ?? json?.error_code;
      return { ok: false, code: isSsoErrorCode(backendCode) ? backendCode : codeFromStatus(response.status) };
    }

    // Some backends answer 200 with { status: false }.
    if (json && json.status === false) {
      const backendCode = json.code ?? json.error_code;
      return { ok: false, code: isSsoErrorCode(backendCode) ? backendCode : "server_error" };
    }

    return { ok: true, payload: json };
  } catch (error) {
    console.error("[google-sso] Backend Google login failed:", error);
    return { ok: false, code: "server_error" };
  }
}
