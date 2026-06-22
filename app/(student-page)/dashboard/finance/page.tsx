"use client";

import { useState, useEffect } from "react";
import { Info, ChevronDown, ChevronRight, CreditCard, ThumbsUp, Eye, Download, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { getUserData } from "@/app/actions/user";
import { UMISResponse } from "@/lib/session";
import { FundWalletModal } from "@/components/fees/fund-wallet-modal";
import { toast } from "sonner";

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

export default function FinancePage() {
  const [showFullfee, toggleFullfee, mountedFullfee] = usePersistentToggle("showFullfee", true);
  const mounted = mountedFullfee;

  const [userData, setUserData] = useState<UMISResponse | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [showWalletBalance, setShowWalletBalance] = useState(true);

  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return (
    <div className="max-w-6x px-4 md:px-8 flex flex-col gap-6 pb-12">

      {/* Top Row: Financial Standing & Financial Approval */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Financial Standing (takes 3 columns) */}
        <div className="lg:col-span-3 bg-[#EAF0FF] dark:bg-[#1e293b]/50 rounded-[24px] p-6 relative overflow-hidden transition-colors flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[15px] font-medium text-gray-600 dark:text-gray-400">Financial Standing</span>
              <div className="bg-[#D3E0FF] dark:bg-[#2563EB]/25 text-[#1E40AF] dark:text-[#60a5fa] px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1.5 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] dark:bg-[#60a5fa]"></span>
                GREAT
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[18px] font-bold text-gray-900 dark:text-gray-100">Payment Progress 100%</span>
                <span className="text-[15px] font-bold text-gray-900 dark:text-gray-100">100%</span>
              </div>
              <div className="h-3 w-full bg-white/60 dark:bg-gray-800 rounded-full overflow-hidden transition-colors">
                <div className="h-full bg-[#003cbb] dark:bg-[#2563EB] rounded-full w-full"></div>
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
        <div className="lg:col-span-1 bg-[#ECFDF3] dark:bg-[#10B981]/10 border border-[#D1FADF] dark:border-[#10B981]/25 rounded-[24px] p-6 flex flex-col justify-between transition-colors min-h-[140px]">
          <p className="text-[15px] font-medium text-gray-600 dark:text-gray-400">Financial Approval</p>
          <div className="flex items-center justify-start flex-1 mt-4">
            <div className="bg-[#ECFDF3] dark:bg-[#10B981]/15 text-[#12B76A] dark:text-[#4ade80] px-4 py-3 rounded-[16px] text-[15px] font-bold inline-flex items-center gap-2 border border-[#D1FADF] dark:border-[#10B981]/25 transition-colors w-full justify-center">
              <ThumbsUp className="w-5 h-5 text-[#12B76A] dark:text-[#4ade80]" fill="currentColor" /> Approved
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="bg-white dark:bg-gray-900 rounded-[24px] flex flex-col justify-between p-6 gap-6 border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">

          {/* Left: Fees Summary (takes 3 columns) */}
          <div className="lg:col-span-3 flex flex-col md:flex-row md:items-center justify-between gap-6 py-2">

            {/* Estimated Full Session Fee */}
            <div className="flex-1 md:border-r border-gray-100 dark:border-gray-800 pr-4">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 font-medium text-[13px] mb-2">Estimated Full Session Fee</span>
                <button
                  type="button"
                  onClick={toggleFullfee}
                  className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-gray-400 active:text-gray-600 md:hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full touch-manipulation shrink-0 ml-1"
                  aria-label={showFullfee ? "Hide CGPA" : "Show CGPA"}
                >
                  {showFullfee ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
              </div>
              {mounted && !showFullfee ? (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">₦4,500,000</p>
              )}
            </div>

            {/* Amount Paid For Semester */}
            <div className="flex-1 md:border-r border-gray-100 dark:border-gray-800 px-0">
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">Amount Paid For Semester</p>
              {mounted && !showFullfee ? (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">₦4,600,000</p>
              )}
            </div>

            {/* Outstanding Payment */}
            <div className="flex-1 px-0">
              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">Outstanding Payment</p>
              {mounted && !showFullfee ? (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">****</p>
              ) : (
                <p className="text-[22px] font-bold text-gray-900 dark:text-gray-100">₦0</p>
              )}
            </div>
          </div>

          {/* Right: Wallet Card (takes 1 column) */}
          <div className="lg:col-span-1 bg-gradient-to-tr from-[#003cbb] via-[#3b82f6] to-[#bc78ec] rounded-[20px] p-4 relative overflow-hidden flex flex-col justify-between min-h-[108px] text-white shadow-sm transition-all">
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
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold tracking-tight">
                  {showWalletBalance ? `₦${walletBalance.toLocaleString()}` : "****"}
                </span>
                <button
                  onClick={() => setShowWalletBalance(!showWalletBalance)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label={showWalletBalance ? "Hide wallet balance" : "Show wallet balance"}
                >
                  {showWalletBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="relative z-10 flex items-end justify-between mt-4">
              <span className="text-[12px] font-mono text-white/80 tracking-wider">
                S{userData?.user_data?.personal_information?.matric_number || "S190087"}
              </span>
              <Button
                onClick={() => setIsFundWalletModalOpen(true)}
                className="bg-white hover:bg-blue-50 text-[#003cbb] text-[12px] font-semibold h-8 px-4 rounded-[10px] shadow-sm transition-all border-none"
              >
                Fund Wallet
              </Button>
            </div>
          </div>
        </div>

        {/* Banner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {/* Card 1 */}
          <div className="bg-[#E4E9FC] dark:bg-gradient-to-br dark:from-[#1b2a4a]/85 dark:to-[#111c30]/85 rounded-[24px] p-6 flex justify-between relative overflow-hidden min-h-[220px] dark:border dark:border-gray-800 transition-colors">
            <div className="relative z-10 w-4/5 flex flex-col justify-center">
              <h3 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 mb-6">Pay for a previous semester</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative w-full max-w-[200px]">
                  <select className="w-full appearance-none bg-white dark:bg-gray-850 border border-transparent dark:border-gray-700 rounded-xl px-4 py-3 text-[14px] text-gray-700 dark:text-gray-100 font-medium focus:outline-none shadow-sm h-[48px] transition-colors">
                    <option>Select Semester</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
                <Button className="w-[150px] bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002BCC] dark:hover:bg-[#1D4ED8] text-white rounded-xl py-0 h-[48px] text-[14px] font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95">
                  Make payment <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="absolute right-[-60px] md:absolute right-[0px] bottom-[-60px] w-[250px] h-[250px] pointer-events-none">
              <Image
                className="w-full h-auto dark:opacity-85"
                src="/images/handsuccesspay.png"
                alt="Next.js logo"
                width={150}
                height={150}
                priority
              />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#E9DFFB] dark:bg-gradient-to-br dark:from-[#2e234a]/85 dark:to-[#1e1430]/85 rounded-[24px] p-6 flex justify-between relative overflow-hidden min-h-[220px] dark:border dark:border-gray-800 transition-colors">
            <div className="relative z-10 w-4/5 flex flex-col justify-center">
              <h3 className="text-[20px] font-bold text-gray-900 dark:text-gray-100 mb-8">Pay for current semester</h3>
              <Link href="/dashboard/finance/fees">
                <Button className="w-[180px] bg-white/60 hover:bg-white/80 dark:bg-white dark:hover:bg-gray-100 text-[#003cbb] dark:text-gray-900 rounded-xl py-0 h-[48px] text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 backdrop-blur-sm">
                  Pay School Fees <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="absolute right-[0px] md:right-8 bottom-[-60px] w-[250px] h-[250px] pointer-events-none">
              <Image
                className="w-full h-auto dark:opacity-85"
                src="/images/handpay.png"
                alt="Next.js logo"
                width={250}
                height={250}
                priority
              />
            </div>
          </div>
        </div>
      </div>



      {/* Payment History */}
      <div className="mt-4">
        <h3 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 mb-6">Payment History</h3>

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
                <div key={row.id} className="grid grid-cols-6 gap-4 px-6 py-5 bg-white dark:bg-gray-900 rounded-[20px] items-center border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
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
            <div key={row.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] p-5 shadow-sm transition-colors">
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

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => setIsFundWalletModalOpen(false)}
        onSuccess={(amount) => {
          setWalletBalance((prev) => prev + amount);
          toast.success(`Successfully funded wallet with ₦${amount.toLocaleString()}`);
        }}
      />
    </div>
  );
}
