import "server-only";
import { createSession, type UMISResponse } from "@/lib/session";

export type CompleteLoginResult = { ok: true } | { ok: false; error: string };

/**
 * Turns a successful backend login payload (`{ data: { token, user } }`) into
 * the app session cookies. Shared by password login and Google SSO so both
 * paths produce an identical session.
 */
export async function completeLogin(payload: unknown): Promise<CompleteLoginResult> {
  const data = (payload as { data?: { token?: string; user?: UMISResponse } } | null)?.data;
  const token = data?.token;

  if (!token) {
    return { ok: false, error: "Authentication successful, but no token was received." };
  }

  await createSession(token, data?.user ?? undefined);
  return { ok: true };
}
