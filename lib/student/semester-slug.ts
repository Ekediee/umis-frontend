/**
 * Semester codes in page addresses.
 *
 * Codes look like "2025/2026.1". Put in an address as-is, the slash becomes "%2F", which
 * Apache (and nginx/IIS by default) reject with a plain "Not Found" before the request
 * reaches the app. So addresses use "2025-2026.1" instead, turned back into the real code
 * when the page reads it. Old "%2F" links keep working.
 */

/** "2025/2026.1" → "2025-2026.1" (safe in any server's address) */
export function semesterSlug(semester: string): string {
  return semester.replace(/\//g, "-");
}

/** The route parameter ("2025-2026.1", or an old "2025%2F2026.1") → "2025/2026.1" */
export function semesterFromParam(param: string | string[] | undefined): string {
  const raw = Array.isArray(param) ? param.join("/") : (param ?? "");
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    // A malformed escape: use it as it is
  }
  return value.replace(/^(\d{4})-(\d{4})(?=\.|$)/, "$1/$2");
}

/** Address of a semester's result page, or its print preview */
export function semesterResultHref(semester: string, preview = false): string {
  return `/academic-details/semester-results/${encodeURIComponent(semesterSlug(semester))}${preview ? "/preview" : ""}`;
}
