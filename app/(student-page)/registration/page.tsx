"use client";

import Image from "next/image";
import { SummaryCard } from "@/components/registration/summary-card";
import { ActionBanner } from "@/components/registration/action-banner";
import { ClearanceRequirement, ClearanceStatus } from "@/components/registration/clearance-requirement";
import { 
  FileText, 
  CreditCard, 
  UserCheck, 
  Users, 
  Building2, 
  AlertTriangle,
  Info,
  MonitorPlay,
  ListTodo
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getSemesterRegistrationStatusAction, registerSemesterAction, SemesterInfo } from "@/app/actions/registration";
import { SemesterRegistrationConfirmModal } from "@/components/registration/registration-status-modals";
import { FundWalletModal } from "@/components/fees/fund-wallet-modal";

// Mock data for registration states
const REGISTRATION_STATE = "not_started"; // "not_started" | "in_progress" | "completed"
const PAYMENT_STATE = "not_started"; // "not_started" | "in_progress" | "completed"


// ── Helpers ───────────────────────────────────────────────────────────────────

/** Formats an ISO date string ("YYYY-MM-DD") to "DD Mon YYYY", e.g. "05 Jan 2026". */
function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function RegistrationPage() {
  const router = useRouter();
  const [regState, setRegState] = useState(REGISTRATION_STATE);
  const [payState, setPayState] = useState(PAYMENT_STATE);

  /** Holds the active semester info; null means not yet registered / unknown. */
  const [semesterInfo, setSemesterInfo] = useState<SemesterInfo | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSemesterConfirmOpen, setIsSemesterConfirmOpen] = useState(false);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  // Derived convenience boolean — truthy when semester info has been fetched
  const isRegisteredForSemester = semesterInfo !== null;

  useEffect(() => {
    async function fetchRegistrationStatus() {
      setIsLoadingStatus(true);
      const result = await getSemesterRegistrationStatusAction();
      if (result.error) {
        toast.error(result.error);
        setSemesterInfo(null); // fallback — treat as not registered
      } else {
        setSemesterInfo(result.data ?? null);
        if (result.message) {
          toast.success(result.message);
        }
      }
      setIsLoadingStatus(false);
    }
    fetchRegistrationStatus();
  }, []);

  const getRegBannerProps = () => {
    if (isLoadingStatus) {
      return {
        buttonText: "Loading...",
        buttonVariant: "primary" as const,
        description: "Checking your registration status..."
      };
    }
    if (!isRegisteredForSemester) {
      return {
        buttonText: "Commence Registration",
        buttonVariant: "primary" as const,
        description: "You must register for the semester before you can register courses."
      };
    }
    if (regState === "completed") {
      return {
        buttonText: "Print Course Form",
        buttonVariant: "dark" as const,
        description: "Your registration is complete. You can now print your course form."
      };
    }
    if (regState === "in_progress") {
      return {
        buttonText: "Continue Registration",
        buttonVariant: "primary" as const,
        description: "You have some pending steps. Continue to finalize your registration."
      };
    }
    return {
      buttonText: "Register Courses",
      buttonVariant: "primary" as const,
      description: "Review your term details and begin the registration process"
    };
  };

  const getPayBannerProps = () => {
    if (payState === "completed") {
      return {
        buttonText: "View Receipt",
        buttonVariant: "outline" as const,
        description: "Payment successful. You can view or download your receipt."
      };
    }
    if (payState === "in_progress") {
      return {
        buttonText: "Complete Payment",
        buttonVariant: "primary" as const,
        description: "Your payment is in progress. Complete it to clear your finance requirement."
      };
    }
    return {
      buttonText: "Pay School Fees",
      buttonVariant: "outline" as const,
      description: "Review your term details and begin the registration process"
    };
  };

  const regProps = getRegBannerProps();
  const payProps = getPayBannerProps();

  return (
    <div className="flex flex-col md:mx-8 mx-4 gap-6 md:gap-8 pb-10">
      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        <SummaryCard 
          title="Session" 
          value={semesterInfo?.semester.split(".")[0] ?? "—"}
          subValue={semesterInfo ? "." + semesterInfo.semester.split(".")[1] : undefined}
          badgeText="Current Semester" 
        />
        <SummaryCard 
          title="Start Date" 
          value={formatDate(semesterInfo?.startDate)} 
        />
        <SummaryCard 
          title="End Date" 
          value={formatDate(semesterInfo?.endDate)} 
        />
        <SummaryCard 
          title="Last date for Registration" 
          value={formatDate(semesterInfo?.lateRegDate)} 
          isWarning 
        />
      </div>

      {/* Action Banners */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActionBanner 
          title="Register your courses for the semester"
          description={regProps.description}
          buttonText={regProps.buttonText}
          buttonVariant={regProps.buttonVariant}
          gradientClass="bg-gradient-to-br from-[#c2d6ff] to-[#ebf1ff] dark:from-[#1b2a4a] dark:to-[#111c30]"
          illustrationSrc="/Reg-image.png"
          onClick={() => {
            if (isLoadingStatus) return;
            if (!semesterInfo) {
              // No active semester registered yet — open the commencement confirm modal
              setIsSemesterConfirmOpen(true);
            } else if (regState !== "completed") {
              router.push("/registration/courses");
            } else {
              router.push("/dashboard/registration/course-form");
            }
          }}
          
        />
        <ActionBanner 
          title="Make your payment"
          description={payProps.description}
          buttonText={payProps.buttonText}
          buttonVariant={payProps.buttonVariant}
          gradientClass={payState === 'completed' ? "bg-gradient-to-br from-[#c2f5e1] to-[#e6fff5] dark:from-[#0a3825] dark:to-[#042114]" : "bg-gradient-to-br from-[#dcd6ff] to-[#cbc2ff] dark:from-[#2e234a] dark:to-[#1e1430]"}
          illustrationSrc="/Pay-image.png"
          onClick={() => {
            if (payState !== "completed") {
              router.push("/dashboard/finance/fees");
            } else {
              router.push("/dashboard/finance/receipt");
            }
          }}
        />
      </div>

      {/* Clearance Requirements Section */}
      <div className="bg-white dark:bg-gray-900 rounded-[24px] p-4 md:p-8 border border-gray-100/50 dark:border-gray-800 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-[20px] font-bold text-[#0a0a0a] dark:text-gray-100">Clearance Requirements</h2>
            <p className="text-[14px] text-[#525866] dark:text-gray-400">Complete all steps below to finalize your registration</p>
          </div>
          
          <div className="bg-[#F8F9FB] dark:bg-gray-850 border border-gray-100 dark:border-gray-700 rounded-full px-5 py-2.5 flex items-center gap-4 self-start transition-colors duration-200">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#0a0a0a] dark:text-gray-100">1 of 7 Cleared</span>
            </div>
            <div className="w-[80px] h-2 bg-gray-200 dark:bg-gray-750 rounded-full overflow-hidden">
              <div className="w-[14%] h-full bg-[#10b981] rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClearanceRequirement 
            icon={FileText}
            title="Submitted Registration"
            description="Initial registration form submission online"
            status="pending"
            actionText="View Course Form"
            onAction={() => router.push("/dashboard/registration/course-form")}
          />
          <ClearanceRequirement 
            icon={CreditCard}
            title="Finance"
            description="Tuition and fee clearance from Bursary"
            status="not_approved"
            actionText="Fund Wallet"
            onAction={() => setIsFundWalletModalOpen(true)}
          />
          <ClearanceRequirement 
            icon={UserCheck}
            title="Course Advisor"
            description="Approval of selected courses for the semester"
            status="approved"
          />
          <ClearanceRequirement 
            icon={Users}
            title="Student Development"
            description="Clearance from Student Affairs / Development"
            status="pending"
          />
          <ClearanceRequirement 
            icon={Building2}
            title="Registry"
            description="Final approval from Academic Registry"
            status="pending"
          />
          <ClearanceRequirement 
            icon={AlertTriangle}
            title="Overload Request"
            description="Approval for exceeding maximum credit units"
            status="no_request"
          />
        </div>
      </div>

      {/* Alert & Exam Portal */}
      <div className="flex flex-col gap-6">
        {/* Info Alert */}
        <div className="bg-[#eff6ff] dark:bg-[#1e3a8a]/5 border border-[#dbeafe]/80 dark:border-[#1e3a8a]/20 rounded-[24px] p-4 md:p-5 flex gap-4 transition-colors duration-200">
          <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shrink-0 shadow-sm transition-colors duration-200">
            <Info className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff]" />
          </div>
          <div className="flex flex-col gap-1">
            <h5 className="text-[15px] font-bold text-[#1e3a8a] dark:text-[#93c5fd]">Reason For No Approval</h5>
            <p className="text-[14px] text-[#1e40af] dark:text-[#bfdbfe]/80 leading-relaxed">
              You must clear your Finance and Registry requirements before your registration can be marked as complete. 
              Please visit the Bursary department for financial clearance.
            </p>
          </div>
        </div>

        {/* Online Exam Portal Banner */}
        <div className="bg-[#313cac] dark:bg-gradient-to-r dark:from-[#2e3796] dark:to-[#1f266b] rounded-[24px] p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
          {/* Background Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-20" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
              <MonitorPlay className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[20px] md:text-[24px] font-bold text-white">Online Exam Portal</h3>
              <p className="text-[14px] md:text-[16px] text-[#dbeafe] max-w-[450px]">
                Access your scheduled computer-based tests and examinations securely through the dedicated portal.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <button className="bg-white text-[#313cac] px-8 py-3 rounded-[12px] font-bold hover:bg-[#f8faff] transition-all shadow-lg active:scale-95">
              Access Portal
            </button>
          </div>

          {/* Illustration */}
          <div className="absolute right-[-40px] top-[-40px] w-[300px] h-[300px] opacity-45 md:opacity-100 mix-blend-overlay md:mix-blend-normal">
            <Image
              src="/Users/pfy-210/.gemini/antigravity/brain/ad3981aa-aa22-4fec-aa6b-18fd311d5513/exam_portal_illustration_1777980904014.png"
              alt=""
              width={300}
              height={300}
              className="object-contain"
            />
          </div>
        </div>
      </div>

      <SemesterRegistrationConfirmModal 
        isOpen={isSemesterConfirmOpen}
        onClose={() => setIsSemesterConfirmOpen(false)}
        onConfirm={async () => {
          setIsRegistering(true);
          const result = await registerSemesterAction();
          setIsRegistering(false);
          if (result.error) {
            toast.error(result.error);
          } else if (result.success) {
            // Re-fetch semester info so semesterInfo state is populated with real data
            const statusResult = await getSemesterRegistrationStatusAction();
            setSemesterInfo(statusResult.data ?? null);
            setIsSemesterConfirmOpen(false);
            toast.success(result.message || "Successfully registered for the semester!");
          }
        }}
        isLoading={isRegistering}
      />

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => setIsFundWalletModalOpen(false)}
        onSuccess={(amount) => {
          setWalletBalance(prev => prev + amount);
          toast.success(`Successfully funded wallet with ₦${amount.toLocaleString()}`);
        }}
      />
    </div>
  );
}
