"use server";

/**
 * Lecturer sign-in (Stage 1.1). Mock implementation with the real contract:
 *
 *   POST /auth/lecturer/sso            { idToken }            → session | not-recognised
 *   POST /auth/lecturer/staff-id       { staffId, password }  → session | invalid
 *   POST /auth/lecturer/link-request   { instructorId, email }→ code sent to department admin
 *   POST /auth/lecturer/link-verify    { instructorId, code } → session (audit-logged)
 *
 * TODO(api): replace the bodies below with calls to the BU Pulse auth API and
 * store the backend token instead of the mock payload. The Google SSO plumbing
 * in lib/auth/google.ts can be reused for "Continue with university account".
 *
 * Sessions expire after 8 hours or on browser close, whichever comes first:
 * the cookie has no Max-Age (dies with the browser) and carries `exp`.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const LECTURER_COOKIE = "lecturer_session"; // also read in middleware.ts
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

// Mock directory of instructor records (BU Pulse). Email is blank for NIYI, as in the audit.
const STAFF = [{ instructorId: "NIYI", email: null as string | null, name: "Amos Awoniyi" }];

export type AuthResult =
  | { status: "ok"; redirectTo: string }
  | { status: "invalid"; message: string }
  | { status: "not-recognised"; email: string }
  | { status: "student"; message: string }
  | { status: "code-sent"; admin: string; instructorId: string };

async function startSession(instructorId: string) {
  const payload = Buffer.from(JSON.stringify({ sub: instructorId, exp: Date.now() + EIGHT_HOURS })).toString("base64url");
  const jar = await cookies();
  jar.set(LECTURER_COOKIE, payload, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  const onboarded = jar.get("lecturer_onboarded")?.value === "1";
  return { status: "ok", redirectTo: onboarded ? "/lecturer" : "/lecturer/welcome" } as const;
}

export async function signInWithStaffId(staffId: string, password: string): Promise<AuthResult> {
  const id = staffId.trim().toUpperCase();
  if (!id || !password) return { status: "invalid", message: "Enter your staff ID and password." };
  await new Promise((r) => setTimeout(r, 450));
  const record = STAFF.find((s) => s.instructorId === id);
  if (!record || password.length < 4) return { status: "invalid", message: "That staff ID and password don't match. Check both, or use your university account." };
  return startSession(record.instructorId);
}

export async function signInWithSso(email: string): Promise<AuthResult> {
  const value = email.trim().toLowerCase();
  await new Promise((r) => setTimeout(r, 450));
  // Student emails belong to the student app (1.1).
  if (/^\d|@student\./.test(value)) return { status: "student", message: "This looks like a student account. Students sign in to the student portal." };
  if (!value.endsWith("@babcock.edu.ng")) return { status: "invalid", message: "Use your Babcock staff email (name@babcock.edu.ng)." };
  const record = STAFF.find((s) => s.email === value);
  if (!record) return { status: "not-recognised", email: value };
  return startSession(record.instructorId);
}

/** 1.1b — instructor record has no email: send a one-time code to the department admin. */
export async function requestInstructorLink(instructorId: string): Promise<AuthResult> {
  const id = instructorId.trim().toUpperCase();
  await new Promise((r) => setTimeout(r, 450));
  if (!STAFF.some((s) => s.instructorId === id)) return { status: "invalid", message: "We can't find that Instructor ID. It's on your BU Pulse staff profile, for example NIYI." };
  return { status: "code-sent", admin: "Mrs. Grace Olaniyan, Software Engineering office", instructorId: id };
}

export async function verifyInstructorLink(instructorId: string, code: string): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 450));
  if (!/^\d{6}$/.test(code.trim())) return { status: "invalid", message: "Enter the 6-digit code from your department admin." };
  // TODO(api): audit-log the link (instructorId ↔ SSO email) on the backend.
  return startSession(instructorId.trim().toUpperCase());
}

export async function markOnboarded() {
  const jar = await cookies();
  jar.set("lecturer_onboarded", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function signOutLecturer(everywhere = false) {
  // TODO(api): POST /auth/lecturer/sign-out { everywhere } to revoke all sessions.
  void everywhere;
  const jar = await cookies();
  jar.delete(LECTURER_COOKIE);
  redirect("/lecturer/sign-in?reason=signed-out");
}
