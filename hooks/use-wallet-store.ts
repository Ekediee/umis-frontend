import { create } from "zustand";
import { getWalletBalanceAction } from "@/app/actions/payment";

interface WalletState {
  /** Numeric wallet balance, or null if not yet loaded */
  balance: number | null;
  /** Raw balance string from backend (e.g. "791000.00"), or null */
  rawBalance: string | null;
  /** True while fetching wallet balance */
  isLoading: boolean;
  /** Last error message if fetch failed */
  error: string | null;

  /** Fetch or refresh wallet balance from GET /api/v1/wallet/balance */
  fetchBalance: () => Promise<void>;
  /** Manually update wallet balance in local state */
  setBalance: (balance: number, rawBalance?: string) => void;
  /** Reset wallet state (e.g. on logout) */
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: null,
  rawBalance: null,
  isLoading: false,
  error: null,

  fetchBalance: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await getWalletBalanceAction();
      if (result.success && result.balance !== undefined) {
        set({
          balance: result.balance,
          rawBalance: result.rawBalance ?? null,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.error ?? "Failed to fetch wallet balance.",
        });
      }
    } catch (err) {
      console.error("useWalletStore fetchBalance error:", err);
      set({
        isLoading: false,
        error: "An unexpected error occurred while fetching wallet balance.",
      });
    }
  },

  setBalance: (balance, rawBalance) =>
    set({
      balance,
      rawBalance: rawBalance ?? balance.toFixed(2),
      error: null,
    }),

  clearWallet: () =>
    set({
      balance: null,
      rawBalance: null,
      isLoading: false,
      error: null,
    }),
}));

