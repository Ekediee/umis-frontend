"use client";

/**
 * "Pay outstanding fees" from the wallet: enter an amount (pre-filled with what's owed),
 * then Continue To Pay checks the real wallet balance. Not enough → "Insufficient wallet
 * balance" with a Fund Wallet button; enough → debit the wallet.
 * Styled like FundWalletModal.
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronRight, Loader2, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { getWalletBalanceAction, payOutstandingFromWalletAction } from "@/app/actions/payment";

interface PayOutstandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** What the student owes, used to pre-fill and cap the amount */
  outstanding: number;
  /** Opens the Fund Wallet window */
  onFundWallet: () => void;
  /** Called after a successful payment with the amount paid */
  onPaid?: (amount: number) => void;
}

const naira = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export function PayOutstandingModal({ isOpen, onClose, outstanding, onFundWallet, onPaid }: PayOutstandingModalProps) {
  const [amount, setAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [shortfall, setShortfall] = useState<{ balance: number; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Fresh form each time it opens, pre-filled with the full outstanding amount
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the form on open
    setAmount(outstanding > 0 ? String(Math.round(outstanding * 100) / 100) : "");
    setShortfall(null);
    setError(null);
  }, [isOpen, outstanding]);

  if (!isOpen) return null;

  const parsed = parseFloat(amount) || 0;
  const tooMuch = outstanding > 0 && parsed > outstanding + 0.005;
  const isValid = parsed > 0 && !tooMuch;

  const close = () => {
    if (!isPaying) onClose();
  };

  const continueToPay = async () => {
    if (!isValid) return;
    setIsPaying(true);
    setError(null);
    setShortfall(null);
    try {
      const wallet = await getWalletBalanceAction();
      if (!wallet.success || wallet.balance === undefined) {
        setError(wallet.error || "We couldn't check your wallet balance. Please try again.");
        return;
      }
      if (wallet.balance < parsed) {
        setShortfall({ balance: wallet.balance, amount: parsed });
        return;
      }
      const result = await payOutstandingFromWalletAction(parsed);
      if (!result.success) {
        setError(result.error || "The payment didn't go through. Please try again.");
        return;
      }
      toast.success(result.message || `${naira(parsed)} paid from your wallet.`);
      onPaid?.(parsed);
      onClose();
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-in fade-in duration-200 px-4"
      onClick={(e) => e.target === backdropRef.current && close()}
    >
      <div role="dialog" aria-label="Pay outstanding fees" className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-[16px] w-full max-w-[480px] shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0 shrink-0">
          <div>
            <h3 className="text-[18px] font-bold text-[#0a0d14] dark:text-gray-100">Pay Outstanding Fees</h3>
            <p className="text-[14px] text-[#525866] dark:text-gray-400 mt-1">
              Enter the amount to pay from your wallet. You owe <span className="font-semibold text-[#0a0d14] dark:text-gray-100">{naira(outstanding)}</span>.
            </p>
          </div>
          <button
            onClick={close}
            disabled={isPaying}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <X className="w-5 h-5 text-[#525866] dark:text-gray-400" />
          </button>
        </div>

        <div className="h-px bg-gray-200 dark:bg-gray-800 mx-6 my-4 shrink-0" />

        <div className="px-6 pb-6 overflow-y-auto flex flex-col">
          <label htmlFor="outstanding-amount" className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100 mb-2 block">
            Enter amount<span className="text-red-500">*</span>
          </label>
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden focus-within:border-[#003cbb] dark:focus-within:border-[#4d82ff] focus-within:ring-1 focus-within:ring-[#003cbb]/20 transition-all">
            <div className="flex items-center px-3 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 h-11">
              <span className="text-[16px] font-medium text-[#0a0d14] dark:text-gray-100">₦</span>
            </div>
            <input
              id="outstanding-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                setShortfall(null);
                setError(null);
              }}
              placeholder="0.00"
              disabled={isPaying}
              className="flex-1 px-3 py-3 text-[15px] text-[#0a0d14] dark:text-gray-100 placeholder:text-[#868c98] dark:placeholder:text-gray-500 outline-none bg-white dark:bg-gray-900"
            />
            <div className="flex items-center gap-1.5 px-3 bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-700 h-11">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-[#008751] flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">🇳🇬</span>
              </div>
              <span className="text-[13px] font-medium text-[#0a0d14] dark:text-gray-100">NGN</span>
            </div>
          </div>
          {tooMuch && <p className="mt-2 text-[13px] text-red-500 dark:text-red-400">You can pay up to {naira(outstanding)}, the amount you owe.</p>}

          {/* Not enough in the wallet */}
          {shortfall && (
            <div role="alert" className="mt-4 rounded-[12px] border border-[#FFE0E1] bg-[#FFF0F0] dark:bg-red-950/30 dark:border-red-900/50 p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#E60000] dark:text-red-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[#E60000] dark:text-red-400">Insufficient wallet balance</p>
                <p className="text-[13px] text-[#B42318] dark:text-red-300/90 mt-0.5">
                  {shortfall.balance > 0
                    ? `Your wallet has ${naira(shortfall.balance)}, which isn't enough to pay ${naira(shortfall.amount)}.`
                    : "Your wallet is empty."}{" "}
                  Fund your wallet, then pay your outstanding fees.
                </p>
                <button
                  type="button"
                  onClick={onFundWallet}
                  className="mt-3 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-[10px] bg-[#003cbb] hover:bg-[#002e8f] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white text-[13px] font-semibold transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Fund Wallet
                </button>
              </div>
            </div>
          )}

          {error && <p role="alert" className="mt-4 text-[13px] text-red-500 dark:text-red-400">{error}</p>}

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={close}
              disabled={isPaying}
              className="flex-1 px-4 py-3 rounded-[10px] border border-gray-200 dark:border-gray-700 text-[14px] font-medium text-[#525866] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={continueToPay}
              // Not enough in the wallet: Fund Wallet is the next step, so this greys out
              // (changing the amount clears the warning and re-enables it)
              disabled={!isValid || isPaying || !!shortfall}
              className="flex-1 px-4 py-3 rounded-[10px] bg-[#003cbb] dark:bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#002d8f] dark:hover:bg-[#1D4ED8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isPaying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking wallet…
                </>
              ) : (
                <>
                  Continue To Pay
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
