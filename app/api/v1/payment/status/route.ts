import { NextRequest, NextResponse } from "next/server";

/**
 * Payment callback route handler.
 *
 * The payment merchant redirects here after checkout:
 *   GET /api/v1/payment/status?transaction_reference=...&payment_method=FLW&status=completed&tx_ref=...&transaction_id=...
 *
 * This handler immediately strips all sensitive/noisy params and redirects
 * the user to the clean finance page, keeping only the transaction_reference
 * so the frontend can confirm the payment with the backend.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const transactionReference = searchParams.get("transaction_reference");
  const status = searchParams.get("status");

  // Build the redirect URL — always lands on the finance page (user-friendly, no raw API URL exposed)
  const financeUrl = new URL("/dashboard/finance", origin);

  if (transactionReference) {
    // Pass only the reference ID — the finance page useEffect will call
    // /api/v1/wallet/fund and then clear this param from the URL.
    financeUrl.searchParams.set("transaction_reference", transactionReference);
  } else {
    // Merchant returned without a reference (cancelled, errored, or unexpected response).
    // Signal the finance page to show an error toast.
    financeUrl.searchParams.set("payment_status", status ?? "failed");
  }

  // 302 redirect — browser immediately navigates away from the raw callback URL.
  return NextResponse.redirect(financeUrl, { status: 302 });
}

