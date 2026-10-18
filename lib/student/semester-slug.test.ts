import { describe, expect, it } from "vitest";
import { semesterFromParam, semesterResultHref, semesterSlug } from "./semester-slug";

describe("semester addresses", () => {
  it("never puts a slash (or %2F) in the address", () => {
    expect(semesterSlug("2025/2026.1")).toBe("2025-2026.1");
    expect(semesterResultHref("2025/2026.1")).toBe("/academic-details/semester-results/2025-2026.1");
    expect(semesterResultHref("2023/2024.1C", true)).toBe("/academic-details/semester-results/2023-2024.1C/preview");
    expect(semesterResultHref("2025/2026.1")).not.toContain("%2F");
  });

  it("reads the address back into the real semester code", () => {
    expect(semesterFromParam("2025-2026.1")).toBe("2025/2026.1");
    expect(semesterFromParam("2023-2024.1C")).toBe("2023/2024.1C");
  });

  it("still understands old %2F links", () => {
    expect(semesterFromParam("2018%2F2019.1")).toBe("2018/2019.1");
    expect(semesterFromParam("2018/2019.1")).toBe("2018/2019.1");
  });

  it("round-trips, and copes with odd input", () => {
    for (const s of ["2025/2026.1", "2023/2024.1C", "2019/2020.2"]) expect(semesterFromParam(semesterSlug(s))).toBe(s);
    expect(semesterFromParam(undefined)).toBe("");
    expect(semesterFromParam("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
