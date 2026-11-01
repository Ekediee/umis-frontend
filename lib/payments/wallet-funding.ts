/**
 * Confirming a wallet top-up after the student returns from checkout.
 *
 * The backend accepting the reference doesn't prove the wallet changed, so the balance is
 * the proof: the student is only told their wallet was funded once it has gone up.
 */

import { fundWalletAction, getWalletBalanceAction } from "@/app/actions/payment";

const PENDING_KEY = "pulse:pending-wallet-funding";
const PENDING_MAX_AGE_MS = 60 * 60 * 1000;
/** Waits before each balance check: the backend may credit the wallet just after replying */
const BALANCE_CHECK_DELAYS_MS = [0, 1500, 3000, 5000];

interface PendingFunding {
  amount: number;
  /** The balance before checkout, or null if it couldn't be read */
  balanceBefore: number | null;
  startedAt: number;
}

/** Remembered across the redirect to checkout (same tab, so sessionStorage survives it) */
export function rememberPendingFunding(amount: number, balanceBefore: number | null) {
  try {
    const pending: PendingFunding = { amount, balanceBefore, startedAt: Date.now() };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Ignore storage errors: confirmation falls back to reading the balance on return
  }
}

function readPendingFunding(): PendingFunding | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const pending = JSON.parse(raw) as PendingFunding;
    return Date.now() - pending.startedAt <= PENDING_MAX_AGE_MS ? pending : null;
  } catch {
    return null;
  }
}

function clearPendingFunding() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Ignore storage errors
  }
}

export type WalletFundingOutcome =
  /** The balance went up: `amount` is what actually arrived */
  | { outcome: "credited"; amount: number; balance: number }
  /** The backend accepted the payment, but the balance hasn't shown it (or couldn't be read) */
  | { outcome: "pending"; reference: string }
  /** The backend refused the payment */
  | { outcome: "failed"; error: string };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readBalance(): Promise<number | null> {
  try {
    const result = await getWalletBalanceAction();
    return result.success && result.balance !== undefined ? result.balance : null;
  } catch {
    return null;
  }
}

async function confirm(reference: string): Promise<WalletFundingOutcome> {
  const pending = readPendingFunding();
  const baseline = pending?.balanceBefore ?? (await readBalance());

  const result = await fundWalletAction(reference).catch(() => null);
  if (!result?.success) {
    clearPendingFunding();
    return { outcome: "failed", error: result?.error ?? "We couldn't confirm your payment. Please contact support." };
  }

  for (const delay of BALANCE_CHECK_DELAYS_MS) {
    if (delay) await wait(delay);
    const balance = await readBalance();
    if (balance !== null && baseline !== null && balance > baseline) {
      clearPendingFunding();
      return { outcome: "credited", amount: Math.round((balance - baseline) * 100) / 100, balance };
    }
  }

  clearPendingFunding();
  return { outcome: "pending", reference };
}

const confirmations = new Map<string, Promise<WalletFundingOutcome>>();

/** Each reference is confirmed once, even if the page's effect runs twice */
export function confirmWalletFunding(reference: string): Promise<WalletFundingOutcome> {
  let confirmation = confirmations.get(reference);
  if (!confirmation) {
    confirmation = confirm(reference);
    confirmations.set(reference, confirmation);
  }
  return confirmation;
}
