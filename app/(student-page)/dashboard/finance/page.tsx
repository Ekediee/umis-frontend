"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Info, ChevronRight, ThumbsUp, Eye, Download, EyeOff, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { getUserData } from "@/app/actions/user";
import { UMISResponse } from "@/lib/session";
import { FundWalletModal, FundWalletStep } from "@/components/fees/fund-wallet-modal";
import { PayOutstandingModal } from "@/components/fees/pay-outstanding-modal";
import { fundWalletAction, getStudentFeesAction } from "@/app/actions/payment";
import type { StudentFeesData } from "@/app/actions/payment.types";
import { useWalletStore } from "@/hooks/use-wallet-store";
import { useRegistrationStore } from "@/hooks/use-registration-store";
import { getSemesterRegistrationStatusAction } from "@/app/actions/registration";
import { toast } from "sonner";
import { notify } from "@/lib/notifications/bus";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  getWalletFundingHistory, 
  recordWalletFundingEvent, 
  WalletFundingRecord 
} from "@/lib/wallet-history";

const paymentHistoryData = [
  {
    id: 1,
    title: "First Semester 200L",
    year: "2025/2026",
    semesterId: "2",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,000,000",
    statusValue: "500,000",
    statusType: "deficit",
  },
  {
    id: 2,
    title: "Second Semester 100L",
    year: "2025/2026",
    semesterId: "1",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,800,000",
    statusValue: "200,000",
    statusType: "surplus",
  },
  {
    id: 3,
    title: "First Semester 100L",
    year: "2025/2026",
    semesterId: "2",
    amountToPay: "₦4,500,000",
    amountPaid: "₦4,000,000",
    statusValue: "500,000",
    statusType: "deficit",
  },
];

// School fee payments. Sample records like the payment history above: the backend has no
// school-fee payment history endpoint yet.
const schoolFeesHistoryData = [
  {
    id: "SF-2026-091901",
    reference: "FLW-SF-730215",
    date: "Sep 19, 2026",
    time: "09:12 AM",
    year: "2025/2026",
    semesterId: "2",
    amount: 2000000,
    channel: "Wallet",
  },
  {
    id: "SF-2026-091102",
    reference: "FLW-SF-881342",
    date: "Sep 11, 2026",
    time: "02:40 PM",
    year: "2025/2026",
    semesterId: "2",
    amount: 2000000,
    channel: "Wallet",
  },
  {
    id: "SF-2026-020303",
    reference: "FLW-SF-412987",
    date: "Feb 3, 2026",
    time: "11:05 AM",
    year: "2025/2026",
    semesterId: "1",
    amount: 4800000,
    channel: "Card",
  },
];

function formatFee(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₦0";
  const absAmount = Math.abs(amount);
  const hasDecimals = absAmount % 1 !== 0;
  return `₦${absAmount.toLocaleString(undefined, {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function FinancePageContent() {
  const router = useRouter();
  const [showFullfee, toggleFullfee, mountedFullfee] = usePersistentToggle("showFullfee", true);
  const mounted = mountedFullfee;
  const searchParams = useSearchParams();

  const [userData, setUserData] = useState<UMISResponse | null>(null);
  const { balance, isLoading: isWalletLoading, fetchBalance } = useWalletStore();
  const { semesterInfo, setSemesterInfo, isFinancialSubmitted, payState } = useRegistrationStore();
  const isRegisteredForSemester = Boolean(semesterInfo?.check);
  const [studentFees, setStudentFees] = useState<StudentFeesData | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [isPayOutstandingOpen, setIsPayOutstandingOpen] = useState(false);
  const [fundWalletStep, setFundWalletStep] = useState<FundWalletStep>("amount");
  const [showWalletBalance, setShowWalletBalance] = useState(true);
  const [successAmount, setSuccessAmount] = useState<number | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"payment" | "school-fees" | "wallet">("payment");
  const [walletFundingHistory, setWalletFundingHistory] = useState<WalletFundingRecord[]>([]);

  const amountParam = searchParams.get("amount");
  const defaultFundAmount = amountParam && !isNaN(parseFloat(amountParam)) ? parseFloat(amountParam) : undefined;

  const loadStudentFees = useCallback(() => {
    getStudentFeesAction().then((res) => {
      if (res.success && res.data) {
        setStudentFees(res.data);
      }
    }).catch((err) => {
      console.warn("Failed to reload student fees:", err);
    });
  }, []);

  const loadWalletHistory = useCallback(async () => {
    try {
      const history = await getWalletFundingHistory();
      setWalletFundingHistory(history);
    } catch (err) {
      console.warn("Failed to load wallet funding history:", err);
    }
  }, []);

  useEffect(() => {
    getUserData().then(setUserData);
    fetchBalance();
    getSemesterRegistrationStatusAction().then((res) => {
      if (res.data) {
        setSemesterInfo(res.data);
      }
    }).catch((err) => {
      console.warn("Failed to load semester registration status:", err);
    });
    getStudentFeesAction().then((res) => {
      if (res.success && res.data) {
        setStudentFees(res.data);
      }
      setIsLoadingFees(false);
    }).catch((err) => {
      console.warn("Failed to load student fees:", err);
      setIsLoadingFees(false);
    });
    getWalletFundingHistory().then((history) => {
      setWalletFundingHistory(history);
    }).catch((err) => {
      console.warn("Failed to load wallet funding history:", err);
    });
  }, [fetchBalance, setSemesterInfo]);

  // Open a modal from the URL: ?action=fund (Fund Wallet) or ?action=pay-outstanding (from registration)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "fund" || action === "pay-outstanding") {
      const timer = setTimeout(() => {
        if (action === "fund") {
          setFundWalletStep("amount");
          setIsFundWalletModalOpen(true);
        } else {
          setIsPayOutstandingOpen(true);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Handle the payment callback redirected from the backend after merchant checkout.
  // URL format: /dashboard/finance?status=1&message=Payment+settled+successfully&data=flw-S230039-...
  useEffect(() => {
    const txRef = searchParams.get("data") || searchParams.get("transaction_reference");
    const status = searchParams.get("status");
    const message = searchParams.get("message");
    const paymentStatus = searchParams.get("payment_status");

    // Do nothing if there are no payment callback parameters in the URL
    if (!txRef && !status && !paymentStatus) return;

    // Clean the URL immediately so parameters don't persist on page reload
    router.replace("/dashboard/finance");

    if (txRef && (status === "1" || status === "completed" || !status)) {
      // Optimistically read amount if the backend adds it to the callback in future
      const amountParam = searchParams.get("amount");
      const callbackAmount = amountParam ? parseFloat(amountParam) : undefined;

      fundWalletAction(txRef).then((result) => {
        if (result.success) {
          const displayMsg = result.message || message || "Wallet funded successfully!";
          const fundedAmt = callbackAmount && callbackAmount > 0 ? callbackAmount : 500000;
          if (callbackAmount && callbackAmount > 0) {
            setSuccessAmount(callbackAmount);
          } else {
            setSuccessAmount(undefined);
          }
          setSuccessMessage(displayMsg);
          notify({
            // Keyed on the transaction, so a reloaded callback URL never posts it twice
            key: `wallet-funded:${txRef}`,
            type: "PAYMENT_RECEIVED",
            title: "Payment received",
            message: callbackAmount && callbackAmount > 0 ? `₦${callbackAmount.toLocaleString()} was added to your wallet. Ref ${txRef}.` : `Your wallet top-up was confirmed. Ref ${txRef}.`,
            href: "/dashboard/finance",
            silent: true,
          });
          setFundWalletStep("success");
          setIsFundWalletModalOpen(true);
          // Refetch fresh balance from backend
          fetchBalance();
          loadStudentFees();

          // Record wallet funding transaction event
          recordWalletFundingEvent({
            reference: String(txRef),
            amount: fundedAmt,
            gateway: "Flutterwave",
            status: "successful",
            description: "Wallet Credit • Online Checkout Settlement",
          }).then(() => {
            loadWalletHistory();
          }).catch((err) => {
            console.warn("Failed to record wallet callback event:", err);
          });
        } else {
          toast.error(result.error || "Wallet funding failed. Please contact support.");
        }
      });
    } else {
      // Payment was cancelled, failed, or returned a non-success status
      toast.error(message || "Payment was not completed. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paidAmount = studentFees?.amount_paid_for_semester ?? 0;
  const rawOutstanding = studentFees?.total_outstanding_fees ?? 0;
  const outstandingAmount = studentFees ? Math.abs(rawOutstanding) : 0;
  const isCredit = studentFees !== null && rawOutstanding < 0;
  const isDebt = studentFees !== null && rawOutstanding > 0;
  const hasOutstandingFees = isDebt;

  // Option 1: Holistic Net Obligation Evaluation
  // Total obligation accounts for amount already paid + total remaining outstanding debt (past + current)
  const totalObligation = paidAmount + outstandingAmount;

  const progressPercent = totalObligation > 0
    ? Math.min(100, Math.max(0, Math.round((paidAmount / totalObligation) * 100)))
    : (outstandingAmount === 0 && paidAmount > 0 ? 100 : 0);

  const isFinancialApproved = progressPercent >= 75;

  const standingBadge = progressPercent >= 100
    ? {
        label: "GREAT",
        badgeClass: "bg-[#D3E0FF] dark:bg-[#2563EB]/25 text-[#1E40AF] dark:text-[#60a5fa]",
        dotClass: "bg-[#1E40AF] dark:bg-[#60a5fa]",
      }
    : progressPercent >= 75
    ? {
        label: "GOOD",
        badgeClass: "bg-[#D3E0FF] dark:bg-[#2563EB]/25 text-[#1E40AF] dark:text-[#60a5fa]",
        dotClass: "bg-[#1E40AF] dark:bg-[#60a5fa]",
      }
    : progressPercent >= 50
    ? {
        label: "FAIR",
        badgeClass: "bg-[#FEF0C7] dark:bg-[#F59E0B]/20 text-[#B54708] dark:text-[#FBBF24]",
        dotClass: "bg-[#B54708] dark:bg-[#FBBF24]",
      }
    : {
        label: "DEFICIT",
        badgeClass: "bg-[#FEE4E2] dark:bg-[#D92D20]/20 text-[#D92D20] dark:text-[#F87171]",
        dotClass: "bg-[#D92D20] dark:text-[#F87171]",
      };

  return (
    <div className="max-w-6x px-4 md:px-8 flex flex-col gap-6 pb-12">

      {/* Top Row: Financial Standing & Financial Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Financial Standing (takes 3 columns) */}
        <div className="lg:col-span-3 bg-[#EAF0FF] dark:bg-[#1e293b]/50 rounded-[24px] p-6 relative overflow-hidden transition-colors flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[15px] font-medium text-gray-600 dark:text-gray-400">Financial Standing</span>
              <div className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-colors",
                standingBadge.badgeClass
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", standingBadge.dotClass)}></span>
                {isLoadingFees && !studentFees ? "..." : standingBadge.label}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[18px] font-bold text-gray-900 dark:text-gray-100">
                  Payment Progress {isLoadingFees && !studentFees ? "..." : `${progressPercent}%`}
                </span>
                <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                  {isLoadingFees && !studentFees ? "..." : `${progressPercent}%`}
                </span>
              </div>
              <div className="h-3 w-full bg-white/60 dark:bg-white/20 rounded-full overflow-hidden transition-colors">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    progressPercent >= 75
                      ? "bg-[#003cbb] dark:bg-[#2563EB]"
                      : progressPercent >= 50
                      ? "bg-[#f59e0b] dark:bg-[#eab308]"
                      : "bg-[#d92d20] dark:bg-[#ef4444]"
                  )}
                  style={{ width: `${isLoadingFees && !studentFees ? 0 : progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-start text-[#1E40AF] dark:text-[#60a5fa]">
            <Info className="w-5 h-5 shrink-0" />
            <p className="text-[14px] leading-relaxed">
              You must achieve a payment of at least <span className="font-bold">75% payment</span> in order for you to be allowed to write your mid-semester
            </p>
          </div>
        </div>

        {/* Right: Financial Approval (takes 1 column) */}
        <div className={cn(
          "lg:col-span-1 border rounded-[24px] p-6 flex flex-col justify-between transition-colors min-h-[140px]",
          isFinancialApproved
            ? "bg-[#ECFDF3] dark:bg-[#10B981]/10 border-[#D1FADF] dark:border-[#10B981]/25"
            : "bg-[#FFF4ED] dark:bg-[#F79009]/10 border-[#FEDF89] dark:border-[#F79009]/25"
        )}>
          <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400">Financial Approval</p>
          <div className="flex items-center justify-start flex-1 mt-4">
            <div className={cn(
              "px-4 py-3 rounded-[16px] text-[15px] font-bold inline-flex items-start gap-2 leading-snug border transition-colors w-full justify-center",
              isFinancialApproved
                ? "bg-[#ECFDF3] dark:bg-[#10B981]/15 text-[#12B76A] dark:text-[#4ade80] border-[#D1FADF] dark:border-[#10B981]/25"
                : "bg-[#FFF4ED] dark:bg-[#F79009]/15 text-[#B54708] dark:text-[#FDB022] border-[#FEDF89] dark:border-[#F79009]/25"
            )}>
              {isFinancialApproved ? (
                <>
                  <ThumbsUp className="w-5 h-5 shrink-0 text-[#12B76A] dark:text-[#4ade80]" fill="currentColor" /> <span>Approved</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 shrink-0 text-[#B54708] dark:text-[#FDB022]" /> <span>Pending Approval</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="@container bg-white dark:bg-gray-900 rounded-[24px] flex flex-col justify-between p-6 gap-6 border border-gray-100 dark:border-gray-800 transition-colors">
        {/* The wallet keeps a minimum width so the balance is always readable; the fee summary takes the rest */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] gap-6 items-stretch">

          {/* Left: Fees Summary — stacks when its own column gets narrow (container query) */}
          <div className="@container min-w-0">
          <div className="flex flex-col @[40rem]:flex-row @[40rem]:items-center justify-between gap-6 py-2 h-full">

            {/* Estimated Full Session Fee */}
            <div className="flex-1 min-w-0 @[40rem]:border-r border-gray-100 dark:border-gray-800 pr-4">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 font-medium text-[13px] @[40rem]:text-[12px] @[64rem]:text-[13px] mb-2">Estimated Full Session Fee</span>
                <button
                  type="button"
                  onClick={toggleFullfee}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 active:text-gray-600 md:hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0 ml-1 mb-2"
                  aria-label={showFullfee ? "Hide fee figures" : "Show fee figures"}
                >
                  {showFullfee ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              {mounted && !showFullfee ? (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.estimated_full_session_fee)}
                </p>
              )}
            </div>

            {/* Estimated Semester Fee */}
            <div className="flex-1 min-w-0 @[40rem]:border-r border-gray-100 dark:border-gray-800 @[40rem]:pr-4">
              <p className="text-[13px] @[40rem]:text-[12px] @[64rem]:text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">Estimated Semester Fee</p>
              {mounted && !showFullfee ? (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.estimated_semester_fee)}
                </p>
              )}
            </div>

            {/* Amount Paid For Semester */}
            <div className="flex-1 min-w-0 @[40rem]:border-r border-gray-100 dark:border-gray-800 @[40rem]:pr-4">
              <p className="text-[13px] @[40rem]:text-[12px] @[64rem]:text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">Amount Paid For Semester</p>
              {mounted && !showFullfee ? (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                  {isLoadingFees && !studentFees ? "₦..." : formatFee(studentFees?.amount_paid_for_semester)}
                </p>
              )}
            </div>

            {/* Outstanding Payment */}
            <div className="flex-1 min-w-0 px-0">
              <p className="text-[13px] @[40rem]:text-[12px] @[64rem]:text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">Outstanding Payment</p>
              {mounted && !showFullfee ? (
                <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <div className="flex items-center flex-wrap gap-2">
                  <p className="text-[20px] @[40rem]:text-[18px] @[52rem]:text-[20px] @[64rem]:text-[22px] font-bold tabular-nums whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {isLoadingFees && !studentFees ? "₦..." : formatFee(outstandingAmount)}
                  </p>
                  {isCredit && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF3] dark:bg-[#12B76A]/20 text-[#12B76A] dark:text-[#4ade80] border border-[#D1FADF] dark:border-[#12B76A]/30 whitespace-nowrap transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      Credit
                    </span>
                  )}
                  {isDebt && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE4E2] dark:bg-[#D92D20]/20 text-[#D92D20] dark:text-[#F87171] border border-[#FECDCA] dark:border-[#D92D20]/30 whitespace-nowrap transition-colors">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Debt
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Right: Wallet Card */}
          <div className="@container min-w-0 bg-gradient-to-tr from-[#003cbb] via-[#3b82f6] to-[#bc78ec] rounded-[20px] p-4 relative overflow-hidden flex flex-col justify-between min-h-[120px] text-white transition-all">
            {/* Watermark Logo */}
            <div className="absolute left-[-15px] bottom-[-72px] w-32 h-56 opacity-[100%] pointer-events-none mix-blend-overlay">
              <Image
                src="/images/bu_logo2.png"
                alt="BU Torch watermark"
                width={112}
                height={112}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Abstract Art Overlay */}
            <div className="absolute right-0 top-0 bottom-0 left-0 overflow-hidden pointer-events-none select-none">
              {/* Overlapping rounded cards/squares */}
              <div className="absolute -right-8 -top-8 w-28 h-28 border border-white/[0.08] rounded-[24px] rotate-[15deg] mix-blend-overlay" />
              <div className="absolute -right-4 top-8 w-24 h-24 border border-white/[0.05] rounded-[20px] rotate-[35deg] mix-blend-overlay" />
              <div className="absolute -right-12 -top-16 w-32 h-32 bg-white/[0.02] rounded-full blur-xl" />
              <div className="absolute right-12 top-4 w-16 h-16 bg-white/[0.02] border border-white/[0.12] rounded-[16px] -rotate-[15deg]" />
              <div className="absolute right-2 bottom-2 w-12 h-12 border border-white/[0.08] rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col gap-1">
              <span className="text-[12px] font-medium text-white/80">Wallet Balance</span>
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Scales with the card's width (cqi) so any balance fits on one line */}
                <span className="text-[clamp(18px,8.5cqi,26px)] leading-tight font-bold tracking-tight tabular-nums whitespace-nowrap">
                  {!showWalletBalance
                    ? "****"
                    : isWalletLoading && balance === null
                    ? "₦..."
                    : balance !== null
                    ? `₦${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "₦0.00"}
                </span>
                <button
                  onClick={() => setShowWalletBalance(!showWalletBalance)}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={showWalletBalance ? "Hide wallet balance" : "Show wallet balance"}
                >
                  {showWalletBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mt-4">
              <span className="text-[12px] font-mono text-white/80 tracking-wider">
                S{userData?.user_data?.personal_information?.matric_number || "S190087"}
              </span>
              <Button
                onClick={() => {
                  setFundWalletStep("amount");
                  setSuccessAmount(undefined);
                  setSuccessMessage(undefined);
                  setIsFundWalletModalOpen(true);
                }}
                className="bg-white hover:bg-blue-50 text-[#003cbb] text-[12px] font-semibold h-8 px-4 rounded-[10px] transition-all border-none"
              >
                Fund Wallet
              </Button>
            </div>
          </div>
        </div>

        {/* Banner Cards */}
        <div className="grid grid-cols-1 @[44rem]:grid-cols-2 gap-6 mt-2">
          {/* Card 1 */}
          <div className="bg-[#E4E9FC] dark:bg-gradient-to-br dark:from-[#1b2a4a]/85 dark:to-[#111c30]/85 @container rounded-[24px] p-6 flex justify-between relative overflow-clip min-h-[220px] dark:border dark:border-gray-800 transition-colors">
            <div className="relative z-10 max-w-[60%] flex flex-col justify-center">
              <h3 className="text-[18px] @[24rem]:text-[20px] font-bold leading-snug text-gray-900 dark:text-gray-100 mb-6 @[24rem]:mb-8">Pay outstanding fees</h3>
              <Button 
                disabled={!hasOutstandingFees}
                onClick={() => {
                  // Enter an amount and pay it from the wallet
                  if (hasOutstandingFees) setIsPayOutstandingOpen(true);
                }}
                className={cn(
                  "w-fit px-6 whitespace-nowrap rounded-xl py-0 h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0",
                  hasOutstandingFees 
                    ? "bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002BCC] dark:hover:bg-[#1D4ED8] text-white cursor-pointer shadow-sm" 
                    : "bg-[#E2E4E9] dark:bg-gray-800 text-[#CDD0D5] dark:text-gray-600 cursor-not-allowed"
                )}
              >
                Pay Now <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="absolute -right-8 @[26rem]:right-0 bottom-[-48px] @[26rem]:bottom-[-60px] w-[190px] h-[190px] @[26rem]:w-[250px] @[26rem]:h-[250px] pointer-events-none">
              <Image
                className="w-full h-auto dark:opacity-85"
                src="/images/HandSuccessPay.png"
                alt="Payment graphic"
                width={150}
                height={150}
                priority
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#E9DFFB] dark:bg-gradient-to-br dark:from-[#2e234a]/85 dark:to-[#1e1430]/85 @container rounded-[24px] p-6 flex justify-between relative overflow-clip min-h-[220px] dark:border dark:border-gray-800 transition-colors">
            <div className="relative z-10 max-w-[60%] flex flex-col justify-center">
              <h3 className="text-[18px] @[24rem]:text-[20px] font-bold leading-snug text-gray-900 dark:text-gray-100 mb-6 @[24rem]:mb-8">Pay for current semester</h3>
              <Button
                disabled={!isRegisteredForSemester}
                onClick={() => {
                  if (isRegisteredForSemester) {
                    if (payState === "in_progress" || isFinancialSubmitted) {
                      router.push("/dashboard/finance/fees/payment?step=5");
                    } else {
                      router.push("/dashboard/finance/fees");
                    }
                  }
                }}
                className={cn(
                  "w-fit px-5 whitespace-nowrap rounded-xl py-0 h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0",
                  isRegisteredForSemester
                    ? "bg-white/60 hover:bg-white/80 dark:bg-white dark:hover:bg-gray-100 text-[#003cbb] dark:text-gray-900 backdrop-blur-sm cursor-pointer"
                    : "bg-[#E2E4E9] dark:bg-gray-800 text-[#CDD0D5] dark:text-gray-600 cursor-not-allowed"
                )}
              >
                Pay School Fees <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute -right-6 @[26rem]:right-8 bottom-[-48px] @[26rem]:bottom-[-60px] w-[190px] h-[190px] @[26rem]:w-[250px] @[26rem]:h-[250px] pointer-events-none">
              <Image
                className="w-full h-auto dark:opacity-85"
                src="/images/HandPay.png"
                alt="Next.js logo"
                width={250}
                height={250}
                priority
              />
            </div>
          </div>
        </div>
      </div>



      {/* Transaction & Funding History Section */}
      <div className="mt-4 flex flex-col gap-6">
        {/* Tab Switcher Header */}
        {/* Wide row: full tab names with the description beside (or below) them.
            Narrow row (tablets with the sidebar, phones): short names sharing the width, no description. */}
        <div className="@container border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex items-center gap-1.5 @[40rem]:gap-2 p-1.5 bg-[#f6f8fa] dark:bg-gray-800/80 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 w-full @[40rem]:w-fit">
            {([
              { id: "payment", label: "Payment History", short: "Payments", count: paymentHistoryData.length },
              { id: "school-fees", label: "School Fees History", short: "School Fees", count: schoolFeesHistoryData.length },
              { id: "wallet", label: "Wallet Funding History", short: "Wallet", count: walletFundingHistory.length },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveHistoryTab(tab.id)}
                aria-label={tab.label}
                className={cn(
                  "flex-1 @[40rem]:flex-none min-w-0 flex items-center justify-center gap-1.5 @[40rem]:gap-2 px-2 @[40rem]:px-4 py-2 rounded-xl text-[13px] @[40rem]:text-[14px] font-semibold whitespace-nowrap transition-all duration-200",
                  activeHistoryTab === tab.id
                    ? "bg-white dark:bg-gray-900 text-[#003cbb] dark:text-[#4d82ff] shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                <span className="@[40rem]:hidden">{tab.short}</span>
                <span className="hidden @[40rem]:inline">{tab.label}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-bold",
                  activeHistoryTab === tab.id
                    ? "bg-[#eaf0ff] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]"
                    : "bg-gray-200/70 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <p className="hidden @[40rem]:block text-[12px] text-gray-500 dark:text-gray-400">
            {activeHistoryTab === "payment"
              ? "Official semester invoice records and tuition clearance receipts"
              : activeHistoryTab === "school-fees"
              ? "School fee payments made from your wallet or card, with receipts"
              : "Verifiable student digital wallet credits and top-up receipts"}
          </p>
        </div>
        </div>

        {/* TAB 1: Payment History */}
        {activeHistoryTab === "payment" && (
          <div>
            {/* Desktop View: Table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 border-b-0 transition-colors">
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Semester</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Amount to pay</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Amount paid</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Deficit/Surplus</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 text-center">View Invoice</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 text-center">Download Invoice</div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col gap-2 mt-2">
                  {paymentHistoryData.map((row) => (
                    <div key={row.id} className="grid grid-cols-6 gap-4 px-6 py-5 bg-white dark:bg-gray-900 rounded-[20px] items-center border border-gray-100 dark:border-gray-800 transition-colors">
                      <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                        {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                      </div>
                      <div className="text-[14px] text-gray-600 dark:text-gray-300">{row.amountToPay}</div>
                      <div className="text-[14px] text-gray-600 dark:text-gray-300">{row.amountPaid}</div>
                      <div>
                        <span className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors ${row.statusType === 'deficit' ? 'bg-[#FEE4E2] dark:bg-[#D92D20]/15 text-[#D92D20] dark:text-[#f87171]' : 'bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] dark:text-[#4ade80]'}`}>
                          {row.statusValue}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <Link href="/dashboard/finance/receipt" className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                      <div className="flex justify-center">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {paymentHistoryData.map((row) => (
                <div key={row.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] p-5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 mb-1">{row.title}</h4>
                      <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                        {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/dashboard/finance/receipt" className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#F8F9FB] dark:bg-gray-950 rounded-[16px] p-4 mt-5 flex flex-col gap-3 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-gray-500 dark:text-gray-400">Amount to pay</span>
                      <span className="bg-white dark:bg-gray-900 rounded-full px-4 py-1.5 font-bold text-[#1E293B] dark:text-gray-100 text-[15px] border dark:border-gray-850">
                        {row.amountToPay}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] text-gray-500 dark:text-gray-400">Amount paid</span>
                      <span className="bg-white dark:bg-gray-900 rounded-full px-4 py-1.5 font-bold text-[#1E293B] dark:text-gray-100 text-[15px] border dark:border-gray-850">
                        {row.amountPaid}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[14px] text-gray-500 dark:text-gray-400">
                        {row.statusType === 'deficit' ? 'Deficit:' : 'Surplus:'}
                      </span>
                      <span className={`rounded-full px-4 py-1.5 font-bold text-[15px] transition-colors ${row.statusType === 'deficit' ? 'bg-[#FEE4E2] dark:bg-[#D92D20]/15 text-[#D92D20] dark:text-[#f87171]' : 'bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] dark:text-[#4ade80]'}`}>
                        {row.statusValue}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: School Fees History */}
        {activeHistoryTab === "school-fees" && (
          <div>
            {/* Desktop View: Table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 border-b-0 transition-colors">
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Reference</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Date &amp; Time</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Semester</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Amount Paid</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Paid With</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 text-center">Receipt Actions</div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col gap-2 mt-2">
                  {schoolFeesHistoryData.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                      No school fee payments recorded yet.
                    </div>
                  ) : (
                    schoolFeesHistoryData.map((row) => {
                      const receiptHref = `/dashboard/finance/receipt?status=success&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.channel)}`;
                      return (
                        <div key={row.id} className="grid grid-cols-6 gap-4 px-6 py-5 bg-white dark:bg-gray-900 rounded-[20px] items-center border border-gray-100 dark:border-gray-800 transition-colors">
                          <div className="font-mono text-[13.5px] font-bold text-gray-900 dark:text-gray-100 truncate">
                            {row.reference}
                          </div>
                          <div className="text-[13px] text-gray-600 dark:text-gray-300">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{row.date}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{row.time}</p>
                          </div>
                          <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                            {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                          </div>
                          <div className="text-[15px] font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {formatFee(row.amount)}
                          </div>
                          <div>
                            <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700">
                              {row.channel}
                            </span>
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={receiptHref}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`${receiptHref}&action=download`}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title="Download Receipt PDF"
                            >
                              <Download className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {schoolFeesHistoryData.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  No school fee payments recorded yet.
                </div>
              ) : (
                schoolFeesHistoryData.map((row) => {
                  const receiptHref = `/dashboard/finance/receipt?status=success&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.channel)}`;
                  return (
                    <div key={row.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] p-5 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                            {row.year}<span className="text-orange-500">.{row.semesterId}</span>
                          </div>
                          <h4 className="font-mono text-[13px] font-bold text-gray-700 dark:text-gray-300 mt-0.5">{row.reference}</h4>
                          <p className="text-[12px] text-gray-500 dark:text-gray-400">{row.date} • {row.time}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={receiptHref}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <Link
                            href={`${receiptHref}&action=download`}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="Download Receipt"
                          >
                            <Download className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>

                      <div className="bg-[#F8F9FB] dark:bg-gray-950 rounded-[16px] p-4 mt-4 flex flex-col gap-3 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-gray-500 dark:text-gray-400">Amount Paid</span>
                          <span className="bg-white dark:bg-gray-900 rounded-full px-4 py-1.5 font-bold text-[#1E293B] dark:text-gray-100 text-[15px] border dark:border-gray-850">
                            {formatFee(row.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[14px] text-gray-500 dark:text-gray-400">Paid With</span>
                          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700">
                            {row.channel}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Wallet Funding History */}
        {activeHistoryTab === "wallet" && (
          <div>
            {/* Desktop View: Table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 border-b-0 transition-colors">
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Reference</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Date &amp; Time</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Amount Funded</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Payment Channel</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400">Status</div>
                  <div className="text-[13px] font-medium text-gray-500 dark:text-gray-400 text-center">Receipt Actions</div>
                </div>

                {/* Table Rows */}
                <div className="flex flex-col gap-2 mt-2">
                  {walletFundingHistory.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                      No wallet funding transactions recorded yet.
                    </div>
                  ) : (
                    walletFundingHistory.map((row) => (
                      <div key={row.id} className="grid grid-cols-6 gap-4 px-6 py-5 bg-white dark:bg-gray-900 rounded-[20px] items-center border border-gray-100 dark:border-gray-800 transition-colors">
                        <div className="font-mono text-[13.5px] font-bold text-gray-900 dark:text-gray-100 truncate">
                          {row.reference}
                        </div>
                        <div className="text-[13px] text-gray-600 dark:text-gray-300">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{row.date}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{row.time}</p>
                        </div>
                        <div className="text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                          {row.formattedAmount}
                        </div>
                        <div>
                          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-gray-700">
                            {row.gateway}
                          </span>
                        </div>
                        <div>
                          <span className="px-3 py-1.5 rounded-full text-[12px] font-bold bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] dark:text-[#4ade80] border border-[#D1FADF]/60 dark:border-[#12B76A]/20">
                            Successful
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/dashboard/finance/receipt?type=wallet&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.gateway)}&date=${encodeURIComponent(row.date)}&time=${encodeURIComponent(row.time)}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="View Receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/finance/receipt?type=wallet&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.gateway)}&date=${encodeURIComponent(row.date)}&time=${encodeURIComponent(row.time)}&action=download`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="Download Receipt PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Mobile View: Wallet Funding Cards */}
            <div className="md:hidden flex flex-col gap-4">
              {walletFundingHistory.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                  No wallet funding transactions recorded yet.
                </div>
              ) : (
                walletFundingHistory.map((row) => (
                  <div key={row.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] p-5 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Top-up Ref</span>
                        <h4 className="font-mono text-[15px] font-bold text-gray-900 dark:text-gray-100 mb-0.5">{row.reference}</h4>
                        <p className="text-[12px] text-gray-500 dark:text-gray-400">{row.date} • {row.time}</p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/finance/receipt?type=wallet&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.gateway)}&date=${encodeURIComponent(row.date)}&time=${encodeURIComponent(row.time)}`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title="View Receipt"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/dashboard/finance/receipt?type=wallet&ref=${encodeURIComponent(row.reference)}&amount=${row.amount}&gateway=${encodeURIComponent(row.gateway)}&date=${encodeURIComponent(row.date)}&time=${encodeURIComponent(row.time)}&action=download`}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-[#003cbb] dark:text-[#4d82ff] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>

                    <div className="bg-[#F8F9FB] dark:bg-gray-950 rounded-[16px] p-4 mt-4 flex flex-col gap-3 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-gray-500 dark:text-gray-400">Amount Funded</span>
                        <span className="bg-white dark:bg-gray-900 rounded-full px-4 py-1.5 font-bold text-emerald-600 dark:text-emerald-400 text-[15px] border dark:border-gray-850">
                          {row.formattedAmount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[14px] text-gray-500 dark:text-gray-400">Payment Channel</span>
                        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                          {row.gateway}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[14px] text-gray-500 dark:text-gray-400">Status</span>
                        <span className="rounded-full px-3 py-1 font-bold text-[13px] bg-[#ECFDF3] dark:bg-[#12B76A]/15 text-[#12B76A] dark:text-[#4ade80]">
                          Successful
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <PayOutstandingModal
        isOpen={isPayOutstandingOpen}
        onClose={() => setIsPayOutstandingOpen(false)}
        outstanding={outstandingAmount}
        onFundWallet={() => {
          setIsPayOutstandingOpen(false);
          setFundWalletStep("amount");
          setIsFundWalletModalOpen(true);
        }}
        onPaid={() => {
          fetchBalance();
          loadStudentFees();
        }}
      />

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => {
          setIsFundWalletModalOpen(false);
          setFundWalletStep("amount");
          setSuccessAmount(undefined);
          setSuccessMessage(undefined);
        }}
        onSuccess={() => {
          fetchBalance();
          loadWalletHistory();
          loadStudentFees();
        }}
        initialStep={fundWalletStep}
        defaultAmount={defaultFundAmount}
        successAmount={successAmount}
        successMessage={successMessage}
      />
    </div>
  );
}

export default function FinancePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb] dark:border-[#4d82ff]"></div>
      </div>
    }>
      <FinancePageContent />
    </Suspense>
  );
}
