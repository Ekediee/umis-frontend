/**
 * Career paths for a student's programme, ranked by how well their CGPA fits.
 *
 * The data (lib/careers/career-paths.json) lists every Babcock undergraduate programme with
 * 3–4 careers, most direct first, plus a catalogue of careers with Nigerian salary ranges,
 * certifications and the CGPA employers usually ask for.
 */

export interface CareerData {
  version: string;
  currency: string;
  salary_basis: string;
  careers: Record<string, Career>;
  programmes: Programme[];
  fallback: { name: string; careers: ProgrammeCareer[] };
}

export interface Career {
  title: string;
  summary: string;
  salary: { min: number; max: number; period: "month" | "year" };
  /** null: licensed by professional exams (MDCN, NMCN…), not CGPA */
  cgpa: { min: number; ideal: number } | null;
  certifications: string[];
  salary_source?: string;
}

/** A career id, or one with a programme-specific title (e.g. "Mathematics Teacher") */
export type ProgrammeCareer = string | { career: string; title?: string };

export interface Programme {
  id: string;
  name: string;
  school: string;
  department: string;
  /** Words that identify the programme in the student's degree name or department */
  match: string[];
  careers: ProgrammeCareer[];
}

export type CgpaFit = "competitive" | "meets" | "below" | "licensed" | "unknown";

export interface RankedCareer extends Career {
  id: string;
  fit: CgpaFit;
}

const normalise = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;

/** The programme whose longest keyword appears (as whole words) in the text */
function bestMatch(programmes: Programme[], text: string): Programme | null {
  const haystack = normalise(text);
  if (!haystack.trim()) return null;
  let best: Programme | null = null;
  let bestLength = 0;
  for (const programme of programmes) {
    for (const keyword of programme.match) {
      const k = normalise(keyword);
      if (k.length > bestLength && haystack.includes(k)) {
        best = programme;
        bestLength = k.length;
      }
    }
  }
  return best;
}

/**
 * The student's programme. The degree name decides first ("Bachelor of Science Marketing"),
 * since a department can hold two programmes (Business Administration and Marketing); the
 * department is the fallback when the degree name is cut short ("B.A (Hons) Bachelor of").
 */
export function findProgramme(
  data: CareerData,
  degreeName: string | null | undefined,
  department: string | null | undefined
): Programme | null {
  return bestMatch(data.programmes, degreeName ?? "") ?? bestMatch(data.programmes, department ?? "");
}

export function cgpaFit(career: Career, cgpa: number | null): CgpaFit {
  if (!career.cgpa) return "licensed";
  if (cgpa === null) return "unknown";
  if (cgpa >= career.cgpa.ideal) return "competitive";
  if (cgpa >= career.cgpa.min) return "meets";
  return "below";
}

// Programme order says how direct a career is; CGPA fit can lift a more reachable one above it
const RELEVANCE = [1, 0.94, 0.88, 0.82];
const READINESS: Record<CgpaFit, number> = { competitive: 1, licensed: 1, unknown: 1, meets: 0.88, below: 0.7 };

/** The programme's careers, closest match first */
export function rankCareers(data: CareerData, programme: Programme | null, cgpa: number | null): RankedCareer[] {
  const entries = programme?.careers ?? data.fallback.careers;
  return entries
    .map((entry, index) => {
      const id = typeof entry === "string" ? entry : entry.career;
      const career = data.careers[id];
      if (!career) return null;
      const title = typeof entry === "string" ? career.title : entry.title ?? career.title;
      const fit = cgpaFit(career, cgpa);
      const score = (RELEVANCE[index] ?? 0.75) * READINESS[fit];
      return { career: { ...career, id, title, fit }, score, index };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.career);
}

/** "₦180k – ₦660k" (and "₦1.12M") */
export function formatSalaryRange(salary: Career["salary"]): string {
  const short = (n: number) =>
    n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M` : `₦${Math.round(n / 1000)}k`;
  return `${short(salary.min)} – ${short(salary.max)}`;
}

/** One line on how the student's CGPA compares with what employers ask for */
export function fitMessage(career: RankedCareer, cgpa: number | null): string {
  const c = career.cgpa;
  switch (career.fit) {
    case "licensed":
      return "You qualify through professional licensing exams, not your CGPA.";
    case "competitive":
      return `Your ${cgpa!.toFixed(2)} CGPA is competitive, even for the most selective employers.`;
    case "meets":
      return `Your ${cgpa!.toFixed(2)} CGPA meets what most employers ask for. Reach ${c!.ideal.toFixed(2)} for the most selective ones.`;
    case "below":
      return `Many employers ask for ${c!.min.toFixed(2)}+. Certifications and internships help you stand out.`;
    default:
      return c ? `Most employers ask for a CGPA of ${c.min.toFixed(2)} or higher.` : "";
  }
}
