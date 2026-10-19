// Types for the Online Exam Portal integration.
// Kept separate from the "use server" action module so client components
// and tests can import them without Next.js server-action bundling issues.

export interface ExamPortalPayload {
  auth_type: "ba";
  session_id: string;
  student_id: string;
  student_name: string;
  photo: string;
  faculty: string;
  department: string;
  program: string;
}

export interface AccessExamPortalResult {
  success: boolean;
  /** The full HTML page returned by the exam portal session endpoint */
  html?: string;
  /** The selected exam portal endpoint URL (e.g. https://exam1.babcock.edu.ng/session) */
  portalUrl?: string;
  /** The origin of the selected exam portal (e.g. https://exam1.babcock.edu.ng) */
  portalOrigin?: string;
  error?: string;
}
