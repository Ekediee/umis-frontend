/**
 * Illustrated placeholder avatars, shown until a student uploads a photo.
 *
 * Male students get a male avatar and female students a female one. Which of the two
 * is picked at random per student, but fixed: it comes from the matric number, so the
 * same student sees the same avatar on every page, device and visit. When gender is
 * unknown, any of the four can be picked.
 */

import type { UMISResponse } from "@/lib/session";

export const PLACEHOLDER_AVATARS = {
  male: ["/images/avatars/male-1.svg", "/images/avatars/male-2.svg"],
  female: ["/images/avatars/female-1.svg", "/images/avatars/female-2.svg"],
} as const;

const ALL = [...PLACEHOLDER_AVATARS.male, ...PLACEHOLDER_AVATARS.female];

export function isPlaceholderAvatar(url: string | null | undefined): boolean {
  return !!url && (ALL as readonly string[]).includes(url);
}

/** "Male", "M", "female", "F" … → male | female | null */
export function normaliseGender(gender: string | null | undefined): "male" | "female" | null {
  const g = gender?.trim().toLowerCase();
  if (!g) return null;
  if (g === "m" || g === "male" || g === "man" || g === "boy") return "male";
  if (g === "f" || g === "female" || g === "woman" || g === "girl") return "female";
  return null;
}

/** Small stable string hash (FNV-1a), so the pick never changes for a student */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function placeholderAvatar(gender: string | null | undefined, seed: string | null | undefined): string {
  const g = normaliseGender(gender);
  const pool: readonly string[] = g ? PLACEHOLDER_AVATARS[g] : ALL;
  return pool[hash(seed?.trim() || "student") % pool.length];
}

/** The placeholder for a student, read from their profile data */
export function placeholderAvatarFor(data: UMISResponse | null | undefined): string {
  const pi = data?.user_data?.personal_information;
  return placeholderAvatar(pi?.gender, pi?.matric_number ?? pi?.student_name);
}
