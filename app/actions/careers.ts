"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";
import bundledCareerData from "@/lib/careers/career-paths.json";
import { findProgramme, rankCareers, type CareerData, type RankedCareer } from "@/lib/careers/match";

export interface CareerPathsResult {
  /** The matched programme's degree name, or null when it wasn't recognised */
  programme: string | null;
  /** Closest match first */
  careers: RankedCareer[];
  salaryBasis: string;
}

const isCareerData = (d: unknown): d is CareerData =>
  !!d && typeof d === "object" && "careers" in d && "programmes" in d && Array.isArray((d as CareerData).programmes);

/**
 * The career data. Uses the copy bundled with the app, unless CAREER_PATHS_URL points at a
 * hosted copy of the same JSON (a full URL, or a path on API_URL such as
 * /api/v1/academics/career-paths), so the backend can update it without a frontend release.
 */
async function loadCareerData(): Promise<CareerData> {
  const source = process.env.CAREER_PATHS_URL;
  if (!source) return bundledCareerData as CareerData;

  try {
    const url = source.startsWith("http") ? source : `${process.env.API_URL ?? ""}${source}`;
    const token = await getSessionToken();
    const response = await loggedFetch(url, {
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      const body = await response.json();
      // Accept the file as-is, or wrapped in the API's usual { data: … }
      const data = isCareerData(body) ? body : body?.data;
      if (isCareerData(data)) return data;
    }
    console.warn("[careers] Hosted career data unavailable, using the bundled copy");
  } catch (error) {
    console.warn("[careers] Failed to load hosted career data, using the bundled copy", error);
  }
  return bundledCareerData as CareerData;
}

/** The closest match and two others */
const CAREERS_SHOWN = 3;

/**
 * Careers for the student's programme, ranked by their CGPA (null when results aren't out).
 * All of the programme's careers are ranked, so the closest match is the best of them.
 */
export async function getCareerPathsAction(
  degreeName: string | null,
  department: string | null,
  cgpa: number | null
): Promise<CareerPathsResult> {
  const data = await loadCareerData();
  const programme = findProgramme(data, degreeName, department);
  return {
    programme: programme?.name ?? null,
    careers: rankCareers(data, programme, cgpa).slice(0, CAREERS_SHOWN),
    salaryBasis: data.salary_basis,
  };
}
