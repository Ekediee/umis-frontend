"use server";

import { getSessionToken } from "@/lib/session";
import { loggedFetch } from "@/lib/logger";
import type {
  PaymentRequirements,
  GetPaymentRequirementsResult,
  InitialisePaymentPayload,
  InitialisePaymentResult,
  FundWalletResult,
  GetWalletBalanceResult,
  StudentFeesData,
  GetStudentFeesResult,
} from "@/app/actions/payment.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken().catch(() => null);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getApiUrl(): string | null {
  return process.env.API_URL ?? null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Fetches the available payment methods and supported currencies
 * from GET /api/v1/payment/payment-requirements.
 */
export async function getPaymentRequirementsAction(): Promise<GetPaymentRequirementsResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { success: false, error: "Internal error: API is not configured." };
  }

  try {
    const response = await loggedFetch(
      `${apiUrl}/api/v1/payment/payment-requirements`,
      {
        method: "GET",
        headers: await getAuthHeaders(),
        cache: "no-store",
      }
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? "Failed to load payment options.",
      };
    }

    return {
      success: true,
      data: json?.data as PaymentRequirements,
    };
  } catch (err) {
    console.error("getPaymentRequirementsAction error:", err);
    return {
      success: false,
      error: "Could not connect to the server. Please try again.",
    };
  }
}

/**
 * Initialises a wallet-funding payment session.
 * POST /api/v1/payment/initialise
 *
 * Returns the merchant checkout URL on success.
 */
export async function initialisePaymentAction(
  payload: InitialisePaymentPayload
): Promise<InitialisePaymentResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { success: false, error: "Internal error: API is not configured." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/payment/initialise`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? "Failed to initialise payment.",
      };
    }

    const redirectUrl: string | undefined =
      typeof json?.data === "string" ? json.data : undefined;

    if (!redirectUrl) {
      return {
        success: false,
        error: "Payment initialised but no redirect URL was returned.",
      };
    }

    return { success: true, redirectUrl };
  } catch (err) {
    console.error("initialisePaymentAction error:", err);
    return {
      success: false,
      error: "Could not connect to the server. Please try again.",
    };
  }
}

/**
 * Confirms wallet funding after returning from the merchant's checkout page.
 * POST /api/v1/wallet/fund
 *
 * @param transaction_reference - The reference returned in the callback URL.
 */
export async function fundWalletAction(
  transaction_reference: string
): Promise<FundWalletResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { success: false, error: "Internal error: API is not configured." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/wallet/fund`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ transaction_reference }),
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? "Wallet funding failed.",
      };
    }

    return {
      success: true,
      message: json?.message ?? "Wallet funded successfully.",
    };
  } catch (err) {
    console.error("fundWalletAction error:", err);
    return {
      success: false,
      error: "Could not connect to the server. Please try again.",
    };
  }
}

/**
 * Fetches the student's current wallet balance.
 * GET /api/v1/wallet/balance
 */
export async function getWalletBalanceAction(): Promise<GetWalletBalanceResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { success: false, error: "Internal error: API is not configured." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/wallet/balance`, {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? "Failed to fetch wallet balance.",
      };
    }

    const rawBalance =
      json?.data?.balance !== undefined ? String(json.data.balance) : undefined;
    const numericBalance =
      rawBalance !== undefined ? parseFloat(rawBalance.replace(/,/g, "")) : 0;

    return {
      success: true,
      balance: isNaN(numericBalance) ? 0 : numericBalance,
      rawBalance,
    };
  } catch (err) {
    console.error("getWalletBalanceAction error:", err);
    return {
      success: false,
      error: "Could not connect to the server. Please try again.",
    };
  }
}

/**
 * Fetches the student's fee summary from GET /api/v1/payment/student-fees.
 */
export async function getStudentFeesAction(): Promise<GetStudentFeesResult> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    return { success: false, error: "Internal error: API is not configured." };
  }

  try {
    const response = await loggedFetch(`${apiUrl}/api/v1/payment/student-fees`, {
      method: "GET",
      headers: await getAuthHeaders(),
      cache: "no-store",
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: json?.message ?? "Failed to fetch student fees.",
      };
    }

    const raw = json?.data;
    const parseNum = (v: unknown): number => {
      if (typeof v === "number") return isNaN(v) ? 0 : v;
      if (typeof v === "string") {
        const cleaned = v.replace(/,/g, "").trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const data: StudentFeesData = {
      estimated_full_session_fee: parseNum(raw?.estimated_full_session_fee),
      estimated_semester_fee: parseNum(raw?.estimated_semester_fee),
      amount_paid_for_semester: parseNum(raw?.amount_paid_for_semester),
      total_outstanding_fees: parseNum(raw?.total_outstanding_fees),
    };

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("getStudentFeesAction error:", err);
    return {
      success: false,
      error: "Could not connect to the server. Please try again.",
    };
  }
}


/**
 * Pays outstanding fees from the student's wallet.
 *
 * NOT CONNECTED YET: the backend has no wallet-debit endpoint for outstanding fees
 * (only /wallet/fund, /wallet/balance and /payment/initialise exist). Rather than
 * pretend a payment went through, this reports that it isn't available. Once the
 * endpoint exists, call it here (amount in NGN) and return its message.
 */
export async function payOutstandingFromWalletAction(amount: number): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!(amount > 0)) return { success: false, error: "Enter an amount to pay." };
  return {
    success: false,
    error: "Paying outstanding fees from your wallet isn't available yet. Please try again later or contact the bursary.",
  };
}
