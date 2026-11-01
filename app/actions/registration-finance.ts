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
  majors: string | null;
  blockname?: string;
  capacity?: number;
  roomsize?: number;
  org_id?: number;
  occupied_space?: number;
  space_left?: number;
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
  residenceid?: string | null;
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
  occupied_space?: number;
  space_left?: number;
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
  residenceid?: string | null;
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

// ── Financial Registration Summary (/api/v1/academics/financial-reg-summary) ──

export interface FinancialRegSummaryMeal {
  meal_type: string;
  meal_description?: string;
  semester_meal_charge?: number;
}

export interface FinancialRegSummaryWorshipCenter {
  worship_center_name: string;
  location_on_campus: string;
  pastor_in_charge: string;
}

export interface FinancialRegSummaryResidence {
  residence_name: string;
  residence_charges: number;
  residence_images?: ResidenceImage[];
  residence_dean?: string;
  majors?: string | null;
}

export interface FinancialRegSummaryData {
  meal_type: FinancialRegSummaryMeal | null;
  worship_center: FinancialRegSummaryWorshipCenter | null;
  semester_residence: FinancialRegSummaryResidence | null;
  lock_financial_reg: boolean;
}

export interface FinancialRegSummaryResult {
  data?: FinancialRegSummaryData;
  message?: string;
  error?: string;
}

export interface SubmitFinanceRegistrationPayload {
  qresidenceid: number;
  meal_type: string;
  sabbath_class_id: number;
}

export interface SubmitFinanceRegistrationResult {
  success: boolean;
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
              occupied_space: r.occupied_space,
              space_left: r.space_left,
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
            residenceid: wc.residenceid ?? null,
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

/**
 * Fetches the student's current financial registration summary (existing selections + lock flag).
 * Endpoint: GET /api/v1/academics/financial-reg-summary
 */
export const getFinancialRegSummaryAction =
  async (): Promise<FinancialRegSummaryResult> => {
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
        `${apiUrl}/api/v1/academics/financial-reg-summary`,
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
        if (response.status === 404) {
          return {
            data: {
              meal_type: null,
              worship_center: null,
              semester_residence: null,
              lock_financial_reg: false,
            },
          };
        }
        let errorMessage = "Failed to fetch financial registration summary";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // keep fallback
        }
        return { error: errorMessage };
      }

      const json = await response.json();
      const rawData = json?.data ?? {};

      const rawMeal = rawData?.meal_type;
      const mealType: FinancialRegSummaryMeal | null =
        rawMeal &&
        typeof rawMeal === "object" &&
        typeof rawMeal.meal_type === "string" &&
        rawMeal.meal_type.trim().length > 0
          ? {
              meal_type: rawMeal.meal_type.trim(),
              meal_description: rawMeal.meal_description,
              semester_meal_charge:
                typeof rawMeal.semester_meal_charge === "number"
                  ? rawMeal.semester_meal_charge
                  : undefined,
            }
          : null;

      const rawWC = rawData?.worship_center;
      const worshipCenter: FinancialRegSummaryWorshipCenter | null =
        rawWC &&
        typeof rawWC === "object" &&
        typeof rawWC.worship_center_name === "string" &&
        rawWC.worship_center_name.trim().length > 0
          ? {
              worship_center_name: rawWC.worship_center_name.trim(),
              location_on_campus: rawWC.location_on_campus ?? "",
              pastor_in_charge: rawWC.pastor_in_charge ?? "",
            }
          : null;

      const rawRes = rawData?.semester_residence;
      const semesterResidence: FinancialRegSummaryResidence | null =
        rawRes &&
        typeof rawRes === "object" &&
        typeof rawRes.residence_name === "string" &&
        rawRes.residence_name.trim().length > 0
          ? {
              residence_name: rawRes.residence_name.trim(),
              residence_charges:
                typeof rawRes.residence_charges === "number"
                  ? rawRes.residence_charges
                  : 0,
              residence_images: Array.isArray(rawRes.residence_images)
                ? rawRes.residence_images
                : [],
              residence_dean: rawRes.residence_dean,
              majors: rawRes.majors ? String(rawRes.majors).trim() : null,
            }
          : null;

      return {
        data: {
          meal_type: mealType,
          worship_center: worshipCenter,
          semester_residence: semesterResidence,
          lock_financial_reg: Boolean(rawData?.lock_financial_reg),
        },
        message: json?.message,
      };
    } catch (error) {
      console.error("getFinancialRegSummaryAction error:", error);
      return {
        error: "Could not connect to the server. Please try again later.",
      };
    }
  };

/**
 * Submits the student's financial registration selections (residence, meal plan, worship center).
 * Endpoint: POST /api/v1/student/submit-finance-registration
 */
export const submitFinanceRegistrationAction = async (
  payload: SubmitFinanceRegistrationPayload
): Promise<SubmitFinanceRegistrationResult> => {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error("API_URL is not defined in environment variables");
    return {
      success: false,
      error: "Internal server error: Missing API configuration",
    };
  }

  const token = await getSessionToken();
  if (!token) {
    return {
      success: false,
      error: "You are not authenticated. Please log in again.",
    };
  }

  try {
    const response = await loggedFetch(
      `${apiUrl}/api/v1/student/submit-finance-registration`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const json = await response.json().catch(() => null);

    if (!response.ok || json?.status === false) {
      return {
        success: false,
        error:
          json?.message ||
          "Failed to submit financial registration. Please try again.",
      };
    }

    return {
      success: true,
      message:
        json?.message || "Financial registration submitted successfully!",
    };
  } catch (error) {
    console.error("submitFinanceRegistrationAction error:", error);
    return {
      success: false,
      error: "Could not connect to the server. Please try again later.",
    };
  }
};

