import { NextRequest, NextResponse } from "next/server";

/**
 * Payment callback route handler.
 *
 * The payment merchant redirects here after checkout:
 *   GET /api/v1/payment/status?transaction_reference=...&payment_method=FLW&status=completed&tx_ref=...&transaction_id=...
 *
 * This handler immediately strips all sensitive/noisy params and redirects
 * the user back to the originating page (e.g. /dashboard/finance/fees/payment or /dashboard/finance),
 * keeping only the transaction_reference so the frontend can confirm the payment with the backend.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const transactionReference = searchParams.get("transaction_reference");
  const status = searchParams.get("status");

  // Determine return path (from query parameter or stored cookie)
  const rawReturnTo = searchParams.get("return_to") || request.cookies.get("payment_return_to")?.value;
  let targetPath = "/dashboard/finance";
  if (rawReturnTo) {
    try {
      const decoded = decodeURIComponent(rawReturnTo);
      // Validate path to prevent open redirect
      if (decoded.startsWith("/") && !decoded.startsWith("//")) {
        targetPath = decoded;
      }
    } catch {
      // fallback to /dashboard/finance
    }
  }

  // Build destination URL preserving any existing query parameters on targetPath
  const targetUrl = new URL(targetPath, origin);

  if (transactionReference) {
    // Pass only the reference ID — the landing page useEffect will call
    // /api/v1/wallet/fund and then clear this param from the URL.
    targetUrl.searchParams.set("transaction_reference", transactionReference);
  } else {
    // Merchant returned without a reference (cancelled, errored, or unexpected response).
    targetUrl.searchParams.set("payment_status", status ?? "failed");
  }

  // 302 redirect & clear return cookie
  const response = NextResponse.redirect(targetUrl, { status: 302 });
  response.cookies.delete("payment_return_to");
  return response;
}
