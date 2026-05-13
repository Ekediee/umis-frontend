"use server";

import { getSessionUser, UMISResponse } from "@/lib/session";

/**
 * Returns the current user's data stored in the session cookie.
 * Call this from any Server Component or Server Action.
 * Returns null if no user data is found (e.g. not logged in).
 */
export async function getUserData(): Promise<UMISResponse | null> {
  return getSessionUser();
}
