import { describe, it, expect } from "vitest";
import rawData from "./career-paths.json";
import { findProgramme, rankCareers, formatSalaryRange, fitMessage, type CareerData } from "./match";

const data = rawData as CareerData;
const programmeId = (degree: string | null, department: string | null) => findProgramme(data, degree, department)?.id ?? null;

describe("career data", () => {
  it("covers every undergraduate programme with 3–4 known careers", () => {
    expect(data.programmes).toHaveLength(45);
    for (const programme of data.programmes) {
      expect(programme.careers.length).toBeGreaterThanOrEqual(3);
      expect(programme.careers.length).toBeLessThanOrEqual(4);
      for (const entry of programme.careers) {
        const id = typeof entry === "string" ? entry : entry.career;
        expect(data.careers[id], `${programme.id} → ${id}`).toBeDefined();
      }
    }
  });

  it("has a salary range and certifications for every career", () => {
    for (const [id, career] of Object.entries(data.careers)) {
      expect(career.salary.min, id).toBeGreaterThan(0);
      expect(career.salary.max, id).toBeGreaterThan(career.salary.min);
      expect(career.certifications.length, id).toBeGreaterThan(0);
      if (career.cgpa) expect(career.cgpa.ideal, id).toBeGreaterThanOrEqual(career.cgpa.min);
    }
  });
});

describe("findProgramme", () => {
  it("matches the department", () => {
    expect(programmeId("Bachelor of Science Finance", "Finance")).toBe("finance");
  });

  it("falls back to the department when the degree name is cut short", () => {
    expect(programmeId("B.A (Hons) Bachelor of", "Software Engineering")).toBe("software-engineering");
  });

  it("lets the degree name pick between programmes that share a department", () => {
    expect(programmeId("B.Sc. Marketing", "Business Administration and Marketing")).toBe("marketing");
    expect(programmeId("B.Sc. Business Administration", "Business Administration and Marketing")).toBe("business-administration");
  });

  it("prefers the longer, more specific programme name", () => {
    expect(programmeId("B.Sc. Biochemistry", null)).toBe("biochemistry");
    expect(programmeId("B.Sc. Chemistry", null)).toBe("chemistry");
    expect(programmeId("B.Sc. Microbiology", null)).toBe("microbiology");
    expect(programmeId("B.Sc. (Ed) Economics Education", "Education")).toBe("economics-education");
    expect(programmeId("B.Sc. Economics", "Economics")).toBe("economics");
    expect(programmeId("B.Eng. Computer Engineering", null)).toBe("computer-engineering");
    expect(programmeId("B.Sc. Computer Science", null)).toBe("computer-science");
    expect(programmeId("B.Sc. Public Health", null)).toBe("public-health");
  });

  it("returns null for an unknown programme", () => {
    expect(programmeId("Bachelor of Underwater Basket Weaving", null)).toBeNull();
    expect(programmeId(null, null)).toBeNull();
  });
});

describe("rankCareers", () => {
  const finance = data.programmes.find((p) => p.id === "finance")!;

  it("puts the most direct career first when the CGPA fits", () => {
    const ranked = rankCareers(data, finance, 3.73);
    expect(ranked[0].title).toBe("Financial Analyst");
    expect(ranked[0].fit).toBe("meets");
    expect(ranked).toHaveLength(4);
  });

  it("can lift a more reachable career above the most direct one", () => {
    const cs = data.programmes.find((p) => p.id === "computer-science")!;
    const ranked = rankCareers(data, cs, 2.2);
    expect(ranked[0].id).toBe("software-engineer");
    expect(ranked.findIndex((c) => c.id === "data-scientist")).toBeGreaterThan(1);
  });

  it("marks licensed careers and unknown CGPAs without judging them", () => {
    const medicine = data.programmes.find((p) => p.id === "medicine-surgery")!;
    expect(rankCareers(data, medicine, 2.1)[0]).toMatchObject({ id: "medical-doctor", fit: "licensed" });
    expect(rankCareers(data, finance, null).every((c) => c.fit === "unknown")).toBe(true);
  });

  it("uses programme-specific titles", () => {
    const maths = data.programmes.find((p) => p.id === "mathematics")!;
    expect(rankCareers(data, maths, 3).map((c) => c.title)).toContain("Mathematics Lecturer");
  });

  it("falls back to general careers when the programme is unknown", () => {
    expect(rankCareers(data, null, null).map((c) => c.id)).toEqual(data.fallback.careers);
  });
});

describe("formatting", () => {
  it("formats salary ranges", () => {
    expect(formatSalaryRange({ min: 180_000, max: 660_000, period: "month" })).toBe("₦180k – ₦660k");
    expect(formatSalaryRange({ min: 220_000, max: 1_120_000, period: "month" })).toBe("₦220k – ₦1.12M");
  });

  it("explains the CGPA fit", () => {
    const finance = data.programmes.find((p) => p.id === "finance")!;
    const [analyst] = rankCareers(data, finance, 3.73);
    expect(fitMessage(analyst, 3.73)).toBe("Your 3.73 CGPA meets what most employers ask for. Reach 4.00 for the most selective ones.");
  });
});
