/**
 * Helpers for re-opening the receipt of a completed financial registration straight from
 * the finance page ("Print Receipt"), without walking back through the registration flow.
 */

import type { FinanceRegistrationData, FinancialRegSummaryData } from "@/app/actions/registration";
import type { StudentFeesData } from "@/app/actions/payment.types";
import { buildReceiptItems, receiptItemsTotal, type RegistrationPlan } from "./receipt-items";

const REFERENCE_KEYS = ["payment_reference", "transaction_reference", "reference"] as const;

/**
 * A payment/transaction reference supplied by the backend, if any of the given payloads
 * carries one. The backend doesn't send one yet; once it does, it wins over the generated ref
 * with no further frontend change.
 */
export function getBackendReference(...sources: unknown[]): string | undefined {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of REFERENCE_KEYS) {
      const value = (source as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return undefined;
}

/**
 * Same inputs, same ref, so a reprinted receipt always matches the first one.
 * Uses the backend reference when there is one.
 */
export function stableReceiptRef(parts: {
  matric?: string | null;
  session?: string | null;
  plan: RegistrationPlan;
  backendRef?: string;
}): string {
  if (parts.backendRef) return parts.backendRef;
  const seed = [parts.matric ?? "", parts.session ?? "", parts.plan].join("|").toUpperCase();
  // 32-bit FNV-1a, enough to be stable and short
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `REG-${hash.toString(36).toUpperCase().padStart(7, "0")}`;
}

/** Total cost of the student's locked selections under a plan. */
export function registrationTotal(
  finance: FinanceRegistrationData | null,
  summary: FinancialRegSummaryData | null,
  plan: RegistrationPlan
): number {
  return receiptItemsTotal(buildReceiptItems(finance, summary, plan));
}

/**
 * Which plan the student registered with. The backend doesn't say, so: the plan remembered
 * from the registration flow, else the plan whose total matches the student's estimated fee
 * for it, else a semester registration.
 */
export function resolveRegistrationPlan(args: {
  remembered?: RegistrationPlan | null;
  finance: FinanceRegistrationData | null;
  summary: FinancialRegSummaryData | null;
  fees: StudentFeesData | null;
}): RegistrationPlan {
  if (args.remembered) return args.remembered;
  const { finance, summary, fees } = args;
  if (fees) {
    const near = (a: number, b: number) => b > 0 && Math.abs(a - b) < 1;
    if (near(registrationTotal(finance, summary, "semester"), fees.estimated_semester_fee)) return "semester";
    if (near(registrationTotal(finance, summary, "full"), fees.estimated_full_session_fee)) return "full";
  }
  return "semester";
}

/** Complete = selections locked on the backend AND the amount paid covers the total cost. */
export function isFinancialRegComplete(locked: boolean, total: number, paid: number): boolean {
  return locked && total > 0 && total <= paid;
}

export function buildPrintReceiptUrl(args: { ref: string; amount: number; plan: RegistrationPlan }): string {
  const params = new URLSearchParams({
    status: "success",
    ref: args.ref,
    amount: String(args.amount),
    gateway: "Wallet",
    plan: args.plan,
    action: "download",
  });
  return `/dashboard/finance/receipt?${params.toString()}`;
}

