/**
 * The lines on a registration receipt, built from the student's real selections: what
 * /academics/financial-reg-summary says they chose, priced from the finance catalogue.
 */

import type { FinanceRegistrationData, FinancialRegSummaryData, FinanceResidence } from "@/app/actions/registration";
import { getMealPlanPrice } from "@/components/fees/steps/select-meal-plan";

export type RegistrationPlan = "full" | "semester";

export interface ReceiptItem {
  label: string;
  /** null: part of the registration, with no charge of its own */
  amount: number | null;
}

/** Match a residence by name against the catalog, tolerating case/spacing/punctuation differences. */
export function findCatalogResidence(list: FinanceResidence[], name: string): FinanceResidence | undefined {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(name);
  if (!target) return undefined;
  return (
    list.find((r) => r.qresidenceid > 0 && norm(r.residencename) === target) ||
    list.find((r) => {
      if (r.qresidenceid <= 0) return false;
      const n = norm(r.residencename);
      return n.length > 3 && (n.startsWith(target) || target.startsWith(n));
    })
  );
}

export function buildReceiptItems(
  finance: FinanceRegistrationData | null,
  summary: FinancialRegSummaryData | null,
  plan: RegistrationPlan
): ReceiptItem[] {
  if (!finance || !summary) return [];
  const isFull = plan === "full";
  const charges = finance.general_charges;
  const items: ReceiptItem[] = [
    { label: "Mandatory Basic Fees", amount: (isFull ? charges?.fullfees : charges?.fees) || 0 },
  ];

  const residence = summary.semester_residence;
  if (residence?.residence_name) {
    const catalog = findCatalogResidence(finance.residence ?? [], residence.residence_name);
    const amount = isFull
      ? catalog?.full_charges ?? residence.residence_charges * 2
      : residence.residence_charges;
    items.push({ label: `Residence (${residence.residence_name})`, amount });
  }

  const meal = summary.meal_type;
  if (meal?.meal_type) {
    const target = meal.meal_type.trim().toLowerCase();
    const catalog = finance.meal_types?.find(
      (m) => m.selection.trim().toLowerCase() === target || m.mealtype.trim().toLowerCase() === target
    );
    const listed = catalog ? getMealPlanPrice(catalog.mealtype, charges, isFull) : 0;
    const fromSummary = (meal.semester_meal_charge ?? 0) * (isFull ? 2 : 1);
    // The summary can hold the code ("LS"); the catalogue has the name students recognise
    items.push({ label: `Meal Plan (${catalog?.selection ?? meal.meal_type})`, amount: listed || fromSummary });
  }

  if (summary.worship_center?.worship_center_name) {
    items.push({ label: `Worship Center (${summary.worship_center.worship_center_name})`, amount: null });
  }

  return items;
}

export const receiptItemsTotal = (items: ReceiptItem[]) => items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
