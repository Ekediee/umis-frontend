import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/session", () => ({
  getSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
}));

vi.mock("@/lib/logger", () => ({
  loggedFetch: vi.fn(),
  sanitize: (data: unknown) => data,
}));

import { getFinanceRegistrationAction } from "@/app/actions/registration-finance";
import { getResidenceImages, deriveHallType } from "@/components/fees/steps/select-residence";
import { loggedFetch } from "@/lib/logger";

describe("getFinanceRegistrationAction", () => {
  const originalApiUrl = process.env.API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_URL = "https://api.example.com";
  });

  afterEach(() => {
    process.env.API_URL = originalApiUrl;
  });

  it("returns error when API_URL is not configured", async () => {
    delete process.env.API_URL;
    const result = await getFinanceRegistrationAction();
    expect(result.error).toContain("Missing API configuration");
  });

  it("maps residenceoption to majors and extracts residence_images", async () => {
    const mockApiResponse = {
      status: true,
      message: "Registration data retrieved successfully!",
      data: {
        residence: [
          {
            qresidenceid: 6308,
            residenceoption: "Full",
            full_charges: 526568,
            charges: 263284,
            residenceid: "CRST",
            residencename: "Crystal1",
            sex: "F",
            min_level: 200,
            max_level: 500,
            majors: "Hall Type: Classic",
            blockname: "B",
            capacity: 508,
            roomsize: 4,
            org_id: 0,
            residence_images: [
              {
                image_path: "http://umis-sb.babcock.edu.ng/storage/01M5CHKG7EH4MGN6WWG400DVCB.jpeg",
              },
            ],
          },
          {
            qresidenceid: 6346,
            residenceoption: "Full",
            full_charges: 397712,
            charges: 198856,
            residenceid: "OG",
            residencename: "Ogden1",
            sex: "F",
            min_level: 200,
            max_level: 500,
            majors: "Hall Type: Regular",
            blockname: "A",
            capacity: 230,
            roomsize: 4,
            org_id: 0,
            residence_images: [],
          },
        ],
        general_charges: [
          {
            fullfees: 540000,
            fullmeal2fees: 952000,
            fullmeal3fees: 1428000,
            fees: 340000,
            meal2fees: 476000,
            meal3fees: 714000,
          },
        ],
        meal_types: [
          {
            qselectionid: 2,
            mealtype: "BL",
            selection: "Breakfast and Lunch",
          },
        ],
        worship_centers: [
          {
            sabbath_class_id: 1,
            sabbath_class_name: "Bethel Chapel",
            pastor_in_charge: "Adebowale Adesanya",
            location_on_campus: "Bethel Hall Auditorium",
            declared_capacity: 280,
            occupied_space: 252,
            space_left: 28,
          },
        ],
      },
    };

    vi.mocked(loggedFetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const result = await getFinanceRegistrationAction();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();

    const crystal = result.data?.residence.find((r) => r.qresidenceid === 6308);
    expect(crystal).toBeDefined();
    // residenceoption is replaced with majors
    expect(crystal?.residenceoption).toBe("Hall Type: Classic");
    expect(crystal?.majors).toBe("Hall Type: Classic");
    expect(crystal?.residence_images).toEqual([
      { image_path: "http://umis-sb.babcock.edu.ng/storage/01M5CHKG7EH4MGN6WWG400DVCB.jpeg" },
    ]);

    const ogden = result.data?.residence.find((r) => r.qresidenceid === 6346);
    expect(ogden?.residenceoption).toBe("Hall Type: Regular");
    expect(ogden?.majors).toBe("Hall Type: Regular");
    expect(ogden?.residence_images).toEqual([]);
  });
});

describe("getResidenceImages and deriveHallType helpers", () => {
  it("uses API residence_images proxied via /api/image-proxy to bypass expired SSL", () => {
    const hallWithImages = {
      qresidenceid: 6308,
      residenceoption: "Hall Type: Classic",
      charges: 263284,
      residenceid: "CRST",
      residencename: "Crystal1",
      sex: "F",
      min_level: 200,
      max_level: 500,
      majors: "Hall Type: Classic",
      residence_images: [
        { image_path: "http://umis-sb.babcock.edu.ng/storage/crystal.jpeg" },
      ],
    };

    const images = getResidenceImages(hallWithImages);
    expect(images).toEqual([
      `/api/image-proxy?url=${encodeURIComponent("http://umis-sb.babcock.edu.ng/storage/crystal.jpeg")}`,
    ]);
  });

  it("falls back to local mapping or placeholder when residence_images is empty", () => {
    const hallWithoutImages = {
      qresidenceid: 6346,
      residenceoption: "Hall Type: Regular",
      charges: 198856,
      residenceid: "WI",
      residencename: "Winslow",
      sex: "M",
      min_level: 100,
      max_level: 500,
      majors: "Hall Type: Classic",
      residence_images: [],
    };

    const images = getResidenceImages(hallWithoutImages);
    expect(images).toEqual(["/winslow.png", "/winslow-2.png"]);
  });

  it("derives badge types including REGULAR", () => {
    expect(deriveHallType("Hall Type: Regular")).toBe("REGULAR");
    expect(deriveHallType("Type: Premium\n")).toBe("PREMIUM");
    expect(deriveHallType("Type: Classic")).toBe("CLASSIC");
    expect(deriveHallType("Classic Plus")).toBe("CLASSIC+");
  });
});

