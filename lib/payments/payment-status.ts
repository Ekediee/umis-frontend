/**
 * The status a payment gateway or the backend sends back after checkout.
 * Flutterwave uses "successful" / "completed" / "cancelled" / "failed"; the backend uses "1".
 * No status at all isn't a failure: the backend still has the final say on the reference.
 */
const SUCCESSFUL_STATUSES = new Set(["1", "true", "success", "successful", "completed"]);

export function isSuccessfulPaymentStatus(status: string | null | undefined): boolean {
  if (status === null || status === undefined || status === "") return true;
  return SUCCESSFUL_STATUSES.has(status.trim().toLowerCase());
}
