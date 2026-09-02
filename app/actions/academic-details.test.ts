import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock server-only before import
vi.mock("server-only", () => ({}));

// Mock next/headers
const cookieStore = {
  _store: {} as Record<string, string>,
  set(name: string, value: string) {
    this._store[name] = value;
  },
  get(name: string) {
    const val = this._store[name];
    return val !== undefined ? { value: val } : undefined;
  },
  delete(name: string) {
    delete this._store[name];
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(cookieStore)),
}));

const getSessionTokenMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSessionToken: () => getSessionTokenMock(),
}));

import {
  getRegisteredCoursesAction,
  getAcademicProgressAction,
  getAcademicResultsAction,
  getCarryoverRepeatedAction,
} from "@/app/actions/academic-details";

describe("academic-details actions", () => {
  const originalApiUrl = process.env.API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_URL = "https://api.test.com";
    getSessionTokenMock.mockResolvedValue("test-token");
  });

  afterEach(() => {
    process.env.API_URL = originalApiUrl;
    vi.restoreAllMocks();
  });

  describe("getRegisteredCoursesAction", () => {
    it("returns error if unauthenticated", async () => {
      getSessionTokenMock.mockResolvedValueOnce(null);
      const result = await getRegisteredCoursesAction();
      expect(result).toEqual({
        error: "You are not authenticated. Please log in again.",
      });
    });

    it("normalises registered courses data properly", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              status: true,
              message: "Courses retrieved",
              data: [
                {
                  course_id: "COSC 311",
                  course_title: "Advanced Java",
                  instructor: "Dr. Smith",
                  classoption: "Group A",
                  credithours: 3,
                  is_carry_over: false,
                },
              ],
            }),
        })
      );

      const result = await getRegisteredCoursesAction();
      expect(result.data).toEqual([
        {
          courseId: "COSC 311",
          title: "Advanced Java",
          instructor: "Dr. Smith",
          classOption: "Group A",
          units: 3,
          isCarryOver: false,
        },
      ]);
      expect(result.message).toBe("Courses retrieved");
    });
  });

  describe("getAcademicProgressAction", () => {
    it("normalises academic progress and semester items", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              status: true,
              data: {
                total_expected_semesters: 8,
                registered_semesters: 4,
                remaining_semesters: 4,
                semester_progression: [
                  {
                    semester: "2023/2024.1C",
                    semester_gpa: 4.5,
                    level: 100,
                  },
                ],
              },
            }),
        })
      );

      const result = await getAcademicProgressAction();
      expect(result.data?.totalExpectedSemesters).toBe(8);
      expect(result.data?.registeredSemesters).toBe(4);
      expect(result.data?.remainingSemesters).toBe(4);
      expect(result.data?.progressPercent).toBe(50);
      expect(result.data?.semesterProgression.length).toBe(1);
      expect(result.data?.semesterProgression[0].label).toBe("100L 1st");
    });
  });

  describe("getAcademicResultsAction", () => {
    it("handles error response gracefully", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({ message: "No results published" }),
        })
      );

      const result = await getAcademicResultsAction();
      expect(result).toEqual({ error: "No results published" });
    });
  });

  describe("getCarryoverRepeatedAction", () => {
    it("fetches carryover and repeated courses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              status: true,
              data: {
                carry_courses: [
                  {
                    courseid: "COSC 201",
                    coursetitle: "Data Structures",
                    credithours: 3,
                    lecturehours: 3,
                    yeartaken: 200,
                  },
                ],
                repeated_courses: [],
              },
            }),
        })
      );

      const result = await getCarryoverRepeatedAction();
      expect(result.data?.carryCourses.length).toBe(1);
      expect(result.data?.carryCourses[0].courseId).toBe("COSC 201");
    });
  });
});
