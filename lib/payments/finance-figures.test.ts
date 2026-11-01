import { describe, it, expect } from "vitest";
import { paymentProgress, semesterAmountDue } from "./fee-progress";
import { buildReceiptItems, receiptItemsTotal } from "./receipt-items";
import type { FinanceRegistrationData, FinancialRegSummaryData } from "@/app/actions/registration";

describe("paymentProgress", () => {
  it("measures against the semester fee when outstanding leaves out the current semester", () => {
    expect(paymentProgress(2_000_000, 0, 0)).toBe(0);
    expect(paymentProgress(2_000_000, 1_000_000, 0)).toBe(50);
    expect(paymentProgress(2_000_000, 1_500_000, 0)).toBe(75);
  });

  it("still counts older debt", () => {
    expect(paymentProgress(1_000_000, 1_000_000, 1_000_000)).toBe(50);
  });

  it("doesn't count the same fee twice when outstanding includes the semester", () => {
    expect(paymentProgress(2_000_000, 500_000, 1_500_000)).toBe(25);
  });

  it("stays within 0–100", () => {
    expect(paymentProgress(1_000_000, 3_000_000, 0)).toBe(100);
    expect(paymentProgress(0, 0, 0)).toBe(0);
  });
});

describe("semesterAmountDue", () => {
  it("takes off what's been paid", () => {
    expect(semesterAmountDue(2_000_000, 500_000)).toBe(1_500_000);
    expect(semesterAmountDue(2_000_000, 2_500_000)).toBe(0);
  });
});

describe("buildReceiptItems", () => {
  const finance = {
    general_charges: { fees: 1_730_239.5, fullfees: 2_525_353.81, meal2fees: 476_000, fullmeal2fees: 952_000 },
    residence: [{ qresidenceid: 7, residencename: "Samuel Akande Hall1", charges: 263_284, full_charges: 526_568 }],
    meal_types: [{ qselectionid: 1, mealtype: "LS", selection: "Lunch and Supper" }],
    worship_centers: [],
  } as unknown as FinanceRegistrationData;

  const summary: FinancialRegSummaryData = {
    lock_financial_reg: true,
    semester_residence: { residence_name: "Samuel Akande Hall1", residence_charges: 263_284 },
    meal_type: { meal_type: "Lunch and Supper", semester_meal_charge: 476_000 },
    worship_center: { worship_center_name: "Canaan Land Chapel", location_on_campus: "", pastor_in_charge: "" },
  };

  it("itemises the student's real semester registration", () => {
    const items = buildReceiptItems(finance, summary, "semester");

    expect(items).toEqual([
      { label: "Mandatory Basic Fees", amount: 1_730_239.5 },
      { label: "Residence (Samuel Akande Hall1)", amount: 263_284 },
      { label: "Meal Plan (Lunch and Supper)", amount: 476_000 },
      { label: "Worship Center (Canaan Land Chapel)", amount: null },
    ]);
    expect(receiptItemsTotal(items)).toBeCloseTo(2_469_523.5);
  });

  it("shows the meal plan's name when the summary holds its code", () => {
    const items = buildReceiptItems(finance, { ...summary, meal_type: { meal_type: "LS" } }, "semester");

    expect(items[2]).toEqual({ label: "Meal Plan (Lunch and Supper)", amount: 476_000 });
  });

  it("uses full-session prices for a full-session payment", () => {
    expect(receiptItemsTotal(buildReceiptItems(finance, summary, "full"))).toBeCloseTo(4_003_921.81);
  });

  it("leaves out what an off-campus student didn't choose", () => {
    const items = buildReceiptItems(finance, { ...summary, semester_residence: null, meal_type: null }, "semester");

    expect(items.map((i) => i.label)).toEqual(["Mandatory Basic Fees", "Worship Center (Canaan Land Chapel)"]);
  });

  it("shows nothing rather than guessing when the data isn't available", () => {
    expect(buildReceiptItems(null, summary, "semester")).toEqual([]);
    expect(buildReceiptItems(finance, null, "semester")).toEqual([]);
  });
});
