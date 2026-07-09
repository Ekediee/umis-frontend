import "server-only";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "token";
const USER_DATA_COOKIE_NAME = "user_data";

// /** Matches the shape returned by the API at data.data.user */
// export interface UserData {
//   id?: string | number;
//   entity_name?: string;
//   user_name?: string;
//   email?: string;
//   matric_no?: string;
//   department?: string;
//   faculty?: string;
//   level?: string | number;
//   status?: string;
//   programme?: string;
//   school?: string;
//   // Catch-all for any additional fields the API may return
//   [key: string]: unknown;
// }

// 1. Define the nested interfaces first
export interface ContactInformation {
  country: string | null;
  email: string;
  phone: string | null; // Set to null in the image
  residency_status: string | null;
  residential_address: string | null;
  town: string | null;
}

export interface GuardianInformation {
  guardian_address: string | null;
  guardian_country: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_town: string | null;
}

export interface PersonalInformation {
  student_name: string | null;
  matric_number: string | null;
  denomination: string | null;
  gender: string | null;
  marital_status: string | null;
  nationality: string | null;
  religion: string | null;
}
export interface AcademicInformation {
  status: string | null;
  study_level: number | null;
  cummulative_gpa: number | null;
  financial_approval: string | null;
  is_off_campus: boolean | null;
  off_campus_apprpval: string | null;
  residency_status: string | null;
}

// 2. Define the user_data object that holds the nested interfaces
export interface StudentData {
  account_number: string | null;
  contact_information: ContactInformation;
  cummulative_gpa: number | null;
  current_level: number | null;
  degree_id: string | null;
  degree_name: string | null;
  department: string | null;
  financial_approval: boolean;
  guardian_information: GuardianInformation;
  is_off_campus: boolean;
  matric_number: string | null;
  off_campus_apprpval: boolean;
  personal_information: PersonalInformation;
  school_name: string | null;
  status: string | null;
  student_name: string | null;
  academic_information: AcademicInformation;
}

// 3. Define the main/root response object
export interface UMISResponse {
  entity_id: string | number | null; // Set to null in the image
  entity_name: string | null;
  user_data: StudentData;
}

// Use secure cookies only when the public-facing URL is HTTPS.
// Switching HTTP → HTTPS is a single .env change (NEXTAUTH_URL); no code changes.
const useSecureCookies =
  (process.env.NEXTAUTH_URL ?? "").startsWith("https://");

export async function createSession(token: string, userData?: UMISResponse) {
  const cookieStore = await cookies();

  // Store the JWT token
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  // Store user data alongside the token if provided
  if (userData) {
    cookieStore.set(USER_DATA_COOKIE_NAME, JSON.stringify(userData), {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week (same lifetime as token)
    });
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(USER_DATA_COOKIE_NAME);
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return session;
}

export async function getSessionUser(): Promise<UMISResponse | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_DATA_COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UMISResponse;
  } catch {
    return null;
  }
}
