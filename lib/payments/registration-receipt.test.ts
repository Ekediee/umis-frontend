import { describe, it, expect } from "vitest";
import {
  buildPrintReceiptUrl,
  getBackendReference,
  isFinancialRegComplete,
  resolveRegistrationPlan,
  stableReceiptRef,
} from "./registration-receipt";
import type { FinanceRegistrationData, FinancialRegSummaryData } from "@/app/actions/registration";

describe("stableReceiptRef", () => {
  it("is the same for the same student, session and plan", () => {
    const a = stableReceiptRef({ matric: "19/0001", session: "2026/2027.1", plan: "semester" });
    const b = stableReceiptRef({ matric: "19/0001", session: "2026/2027.1", plan: "semester" });
    expect(a).toBe(b);
    expect(a).toMatch(/^REG-/);
  });

  it("differs when the plan or student differs", () => {
    const base = { matric: "19/0001", session: "2026/2027.1" };
    expect(stableReceiptRef({ ...base, plan: "semester" })).not.toBe(stableReceiptRef({ ...base, plan: "full" }));
    expect(stableReceiptRef({ ...base, plan: "full" })).not.toBe(
      stableReceiptRef({ ...base, matric: "19/0002", plan: "full" })
    );
  });

  it("prefers a backend reference", () => {
    expect(stableReceiptRef({ plan: "full", backendRef: "FLW-123" })).toBe("FLW-123");
  });
});

describe("getBackendReference", () => {
  it("reads a reference from any payload that has one", () => {
    expect(getBackendReference(null, { a: 1 }, { payment_reference: " ABC " })).toBe("ABC");
    expect(getBackendReference({}, undefined)).toBeUndefined();
  });
});

describe("isFinancialRegComplete", () => {
  it("needs the lock and a covering payment", () => {
    expect(isFinancialRegComplete(true, 100, 100)).toBe(true);
    expect(isFinancialRegComplete(true, 100, 150)).toBe(true);
    expect(isFinancialRegComplete(false, 100, 150)).toBe(false);
    expect(isFinancialRegComplete(true, 100, 99)).toBe(false);
    expect(isFinancialRegComplete(true, 0, 0)).toBe(false);
  });
});

describe("resolveRegistrationPlan", () => {
  const finance = {
    residence: [],
    general_charges: { fullfees: 3000, fees: 1500, fullmeal2fees: 0, fullmeal3fees: 0, meal2fees: 0, meal3fees: 0 },
    meal_types: [],
    worship_centers: [],
  } as unknown as FinanceRegistrationData;
  const summary = { semester_residence: null, worship_center: null, meal_type: null, lock_financial_reg: true } as FinancialRegSummaryData;
  const fees = (sem: number, full: number) => ({
    estimated_semester_fee: sem,
    estimated_full_session_fee: full,
    amount_paid_for_semester: 0,
    total_outstanding_fees: 0,
  });

  it("uses the remembered plan first", () => {
    expect(resolveRegistrationPlan({ remembered: "full", finance, summary, fees: fees(1500, 3000) })).toBe("full");
  });

  it("infers the plan from the estimated fees", () => {
    expect(resolveRegistrationPlan({ finance, summary, fees: fees(9999, 3000) })).toBe("full");
    expect(resolveRegistrationPlan({ finance, summary, fees: fees(1500, 9999) })).toBe("semester");
  });

  it("falls back to semester", () => {
    expect(resolveRegistrationPlan({ finance: null, summary: null, fees: null })).toBe("semester");
  });
});

describe("buildPrintReceiptUrl", () => {
  it("opens the receipt print view", () => {
    const url = buildPrintReceiptUrl({ ref: "REG-1", amount: 2143786, plan: "full" });
    expect(url.startsWith("/dashboard/finance/receipt?")).toBe(true);
    expect(url).toContain("action=download");
    expect(url).toContain("plan=full");
    expect(url).toContain("amount=2143786");
  });
});

