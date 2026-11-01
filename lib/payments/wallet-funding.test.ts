import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isSuccessfulPaymentStatus } from "./payment-status";
import { confirmWalletFunding, rememberPendingFunding } from "./wallet-funding";
import { fundWalletAction, getWalletBalanceAction } from "@/app/actions/payment";

vi.mock("@/app/actions/payment", () => ({
  fundWalletAction: vi.fn(),
  getWalletBalanceAction: vi.fn(),
}));

const fund = vi.mocked(fundWalletAction);
const balance = vi.mocked(getWalletBalanceAction);
const balanceOf = (n: number) => ({ success: true, balance: n, rawBalance: String(n) });
let reference = 0;
const nextReference = () => `FLW-${++reference}`;

/** Runs past the waits between balance checks */
async function settle<T>(promise: Promise<T>) {
  await vi.runAllTimersAsync();
  return promise;
}

describe("isSuccessfulPaymentStatus", () => {
  it("accepts success statuses and a missing status", () => {
    for (const status of ["1", "completed", "successful", "SUCCESS", null, undefined, ""]) {
      expect(isSuccessfulPaymentStatus(status)).toBe(true);
    }
  });

  it("rejects cancelled and failed payments", () => {
    for (const status of ["cancelled", "failed", "0", "pending"]) {
      expect(isSuccessfulPaymentStatus(status)).toBe(false);
    }
  });
});

describe("confirmWalletFunding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    fund.mockResolvedValue({ success: true, message: "ok" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports the amount that actually arrived, against the balance before checkout", async () => {
    rememberPendingFunding(50_000, 10_000);
    balance.mockResolvedValue(balanceOf(60_000));

    await expect(settle(confirmWalletFunding(nextReference()))).resolves.toEqual({
      outcome: "credited",
      amount: 50_000,
      balance: 60_000,
    });
  });

  it("keeps checking when the credit arrives after the backend replies", async () => {
    rememberPendingFunding(50_000, 0);
    balance.mockResolvedValueOnce(balanceOf(0)).mockResolvedValueOnce(balanceOf(0)).mockResolvedValue(balanceOf(50_000));

    await expect(settle(confirmWalletFunding(nextReference()))).resolves.toMatchObject({ outcome: "credited", amount: 50_000 });
  });

  it("is pending, not successful, when the balance never goes up", async () => {
    rememberPendingFunding(50_000, 10_000);
    balance.mockResolvedValue(balanceOf(10_000));
    const ref = nextReference();

    await expect(settle(confirmWalletFunding(ref))).resolves.toEqual({ outcome: "pending", reference: ref });
    expect(balance).toHaveBeenCalledTimes(4);
  });

  it("is pending when the balance can't be read at all", async () => {
    balance.mockResolvedValue({ success: false, error: "An error occurred while getting wallet balance" });

    await expect(settle(confirmWalletFunding(nextReference()))).resolves.toMatchObject({ outcome: "pending" });
  });

  it("fails when the backend refuses the payment", async () => {
    rememberPendingFunding(50_000, 10_000);
    fund.mockResolvedValue({ success: false, error: "Transaction not found" });

    await expect(settle(confirmWalletFunding(nextReference()))).resolves.toEqual({ outcome: "failed", error: "Transaction not found" });
    expect(balance).not.toHaveBeenCalled();
  });

  it("confirms a reference only once", async () => {
    rememberPendingFunding(50_000, 0);
    balance.mockResolvedValue(balanceOf(50_000));
    const ref = nextReference();

    const [first, second] = await settle(Promise.all([confirmWalletFunding(ref), confirmWalletFunding(ref)]));

    expect(second).toEqual(first);
    expect(fund).toHaveBeenCalledTimes(1);
  });
});
