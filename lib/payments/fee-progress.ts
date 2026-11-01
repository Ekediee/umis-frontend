/**
 * How far a student is through paying for the semester.
 *
 * Progress is measured against the semester fee, because the backend's outstanding figure
 * can leave out the current semester: ₦0 outstanding with ₦2.4M unpaid must not read as paid.
 * Older debts still count, so what's owed is never less than paid + outstanding.
 */
export function paymentProgress(semesterFee: number, paid: number, outstanding: number): number {
  const obligation = Math.max(semesterFee, paid + outstanding);
  if (obligation <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((paid / obligation) * 100)));
}

/** What's left to pay for the semester */
export function semesterAmountDue(semesterFee: number, paid: number): number {
  return Math.max(0, semesterFee - paid);
}
