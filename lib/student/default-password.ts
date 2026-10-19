/**
 * Is the student still on their default password?
 *
 * The profile API doesn't say. The backend does refuse to commence registration for
 * students still on their default password, so that refusal is remembered here (per
 * matric number, in this browser) and forgotten once they change their password in the
 * app. If the backend ever sends a flag on the user data, that wins.
 */

import type { UMISResponse } from "@/lib/session";

const key = (matric: string) => `pulse:default-password:${matric}`;

/** A flag from the backend, if it ever sends one: true = still on the default password */
function backendFlag(data: UMISResponse | null | undefined): boolean | null {
  const ud = (data?.user_data ?? {}) as Record<string, unknown>;
  for (const k of ["must_change_password", "is_default_password", "default_password"]) {
    if (typeof ud[k] === "boolean") return ud[k] as boolean;
  }
  if (typeof ud.password_changed === "boolean") return !ud.password_changed;
  return null;
}

/** `matric` is the same identifier passed to the change-password flow (its username) */
export function needsPasswordChange(data: UMISResponse | null | undefined, matric: string | null | undefined): boolean {
  const flag = backendFlag(data);
  if (flag !== null) return flag;
  if (!matric || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(key(matric)) === "1";
  } catch {
    return false;
  }
}

/** The backend refused to commence registration because of the default password */
export function rememberDefaultPassword(matric: string | null | undefined) {
  if (!matric) return;
  try {
    localStorage.setItem(key(matric), "1");
  } catch {
    // Ignore storage errors
  }
}

/** The student changed their password: stop asking */
export function forgetDefaultPassword(matric: string | null | undefined) {
  if (!matric) return;
  try {
    localStorage.removeItem(key(matric));
  } catch {
    // Ignore storage errors
  }
}
