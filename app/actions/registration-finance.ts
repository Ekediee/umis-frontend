"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";

// ── Raw API shapes ─────────────────────────────────────────────────────────────

interface RawFinanceResidenceImage {
  image_path: string;
}

interface RawFinanceResidence {
  qresidenceid: number;
  residenceoption: string;
  full_charges: number;
  charges: number;
  residenceid: string;
  residencename: string;
  sex: string;
  min_level: number;
  max_level: number;
  majors: string;
  blockname?: string;
  capacity?: number;
  roomsize?: number;
  org_id?: number;
  residence_images?: RawFinanceResidenceImage[];
}

interface RawFinanceGeneralCharges {
  fullfees: number;
  fullmeal2fees: number;
  fullmeal3fees: number;
  fees: number;
  meal2fees: number;
  meal3fees: number;
}

interface RawFinanceMealType {
  qselectionid: number;
  mealtype: string;
  selection: string;
}

interface RawFinanceWorshipCenter {
  sabbath_class_id: number;
  sabbath_class_name: string;
  pastor_in_charge: string;
  location_on_campus: string;
  declared_capacity: number;
  occupied_space: number;
  space_left: number;
}

interface RawFinanceRegistrationResponse {
  status: boolean;
  message: string;
  data: {
    residence: RawFinanceResidence[];
    general_charges: RawFinanceGeneralCharges[];
    meal_types: RawFinanceMealType[];
    worship_centers: RawFinanceWorshipCenter[];
    matric_no?: string;
  };
}

// ── Normalised shapes used by the UI ─────────────────────────────────────────

export interface ResidenceImage {
  image_path: string;
}

export interface FinanceResidence {
  qresidenceid: number;
  residenceoption: string;
  charges: number;
  full_charges?: number;
  residenceid: string;
  residencename: string;
  sex: string;
  min_level: number;
  max_level: number;
  majors: string;
  blockname?: string;
  capacity?: number;
  roomsize?: number;
  org_id?: number;
  residence_images?: ResidenceImage[];
}

export interface FinanceGeneralCharges {
  fullfees: number;
  fullmeal2fees: number;
  fullmeal3fees: number;
  fees: number;
  meal2fees: number;
  meal3fees: number;
}

export interface FinanceMealType {
  qselectionid: number;
  mealtype: string;
  selection: string;
}

export interface FinanceWorshipCenter {
  sabbath_class_id: number;
  sabbath_class_name: string;
  pastor_in_charge: string;
  location_on_campus: string;
  declared_capacity: number;
  occupied_space: number;
  space_left: number;
}

export interface FinanceRegistrationData {
  residence: FinanceResidence[];
  general_charges: FinanceGeneralCharges;
  meal_types: FinanceMealType[];
  worship_centers: FinanceWorshipCenter[];
}

export interface FinanceRegistrationResult {
  data?: FinanceRegistrationData;
  message?: string;
  error?: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Fetches all finance registration data (residence options, charges, meal plans, worship centers).
 * Endpoint: GET /api/v1/student/finance-registration
 */
export const getFinanceRegistrationAction =
  async (): Promise<FinanceRegistrationResult> => {
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error("API_URL is not defined in environment variables");
      return { error: "Internal server error: Missing API configuration" };
    }

    const token = await getSessionToken();
    if (!token) {
      return { error: "You are not authenticated. Please log in again." };
    }

    try {
      const response = await loggedFetch(
        `${apiUrl}/api/v1/student/finance-registration`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to fetch finance registration data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response body wasn't JSON — keep the fallback message
        }
        return { error: errorMessage };
      }

      const json: RawFinanceRegistrationResponse = await response.json();

      const rawResidences: RawFinanceResidence[] = Array.isArray(
        json?.data?.residence
      )
        ? json.data.residence
        : [];

      // Extract general_charges whether returned as an array [ { ... } ] or a single object { ... }
      const rawGeneralCharges = json?.data?.general_charges;
      const rawChargeObj: Record<string, unknown> = Array.isArray(rawGeneralCharges)
        ? ((rawGeneralCharges[0] as unknown as Record<string, unknown>) ?? {})
        : rawGeneralCharges && typeof rawGeneralCharges === "object"
        ? (rawGeneralCharges as unknown as Record<string, unknown>)
        : {};

      const parseFee = (...keys: string[]): number => {
        for (const k of keys) {
          const val = rawChargeObj[k];
          if (typeof val === "number" && !isNaN(val)) return val;
          if (typeof val === "string") {
            const parsed = parseFloat(val.replace(/,/g, "").trim());
            if (!isNaN(parsed)) return parsed;
          }
        }
        return 0;
      };

      const parsedCharges: FinanceGeneralCharges = {
        fullfees: parseFee("fullfees", "full_fees", "fullFees"),
        fullmeal2fees: parseFee("fullmeal2fees", "full_meal_2_fees", "fullmeal2_fees", "fullMeal2Fees"),
        fullmeal3fees: parseFee("fullmeal3fees", "full_meal_3_fees", "fullmeal3_fees", "fullMeal3Fees"),
        fees: parseFee("fees", "tuition_fees", "tuition", "base_fees", "basefees"),
        meal2fees: parseFee("meal2fees", "meal_2_fees", "meal2_fees", "meal2Fees"),
        meal3fees: parseFee("meal3fees", "meal_3_fees", "meal3_fees", "meal3Fees"),
      };

      if (
        parsedCharges.fees === 0 &&
        parsedCharges.fullfees === 0 &&
        parsedCharges.meal2fees === 0 &&
        parsedCharges.meal3fees === 0
      ) {
        console.warn(
          "[registration-finance] Warning: All general_charges parsed to 0. Raw API general_charges was:",
          JSON.stringify(rawGeneralCharges)
        );
      }

      const rawMeals: RawFinanceMealType[] = Array.isArray(
        json?.data?.meal_types
      )
        ? json.data.meal_types
        : [];

      const rawWorship: RawFinanceWorshipCenter[] = Array.isArray(
        json?.data?.worship_centers
      )
        ? json.data.worship_centers
        : [];

      return {
        data: {
          residence: rawResidences.map((r) => {
            const trimmedMajors = r.majors ? r.majors.trim() : "";
            return {
              qresidenceid: r.qresidenceid,
              residenceoption: trimmedMajors || r.residenceoption,
              charges: r.charges,
              full_charges: r.full_charges,
              residenceid: r.residenceid,
              residencename: r.residencename,
              sex: r.sex,
              min_level: r.min_level,
              max_level: r.max_level,
              majors: trimmedMajors,
              blockname: r.blockname,
              capacity: r.capacity,
              roomsize: r.roomsize,
              org_id: r.org_id,
              residence_images: Array.isArray(r.residence_images) ? r.residence_images : [],
            };
          }),
          general_charges: parsedCharges,
          meal_types: rawMeals.map((m) => ({
            qselectionid: m.qselectionid,
            mealtype: m.mealtype,
            selection: m.selection,
          })),
          worship_centers: rawWorship.map((wc) => ({
            sabbath_class_id: wc.sabbath_class_id,
            sabbath_class_name: wc.sabbath_class_name,
            pastor_in_charge: wc.pastor_in_charge,
            location_on_campus: wc.location_on_campus,
            declared_capacity: wc.declared_capacity,
            occupied_space: wc.occupied_space,
            space_left: wc.space_left,
          })),
        },
        message: json?.message,
      };
    } catch (error) {
      console.error("getFinanceRegistrationAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };
