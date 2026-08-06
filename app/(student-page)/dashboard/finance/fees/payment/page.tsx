"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentStepper } from "@/components/fees/payment-stepper";
import { MobileFlowHeader } from "@/components/registration/mobile-flow-header";
import { BottomActionBar } from "@/components/registration/bottom-action-bar";
import { SelectResidence } from "@/components/fees/steps/select-residence";
import { SelectWorshipCenter } from "@/components/registration/steps/select-worship-center";
import { SelectMealPlan } from "@/components/fees/steps/select-meal-plan";
import { PaymentSummary } from "@/components/fees/steps/payment-summary";
import { WalletPayment } from "@/components/fees/steps/wallet-payment";
import { PartialPaymentModal } from "@/components/fees/partial-payment-modal";
import { PaymentProgressSheet } from "@/components/fees/payment-progress-sheet";
import { PaymentMethodSheet } from "@/components/fees/payment-method-sheet";
import { ProcessingOverlay } from "@/components/fees/processing-overlay";
import { FundWalletModal } from "@/components/fees/fund-wallet-modal";
import { FinancialConfirmationModal } from "@/components/fees/financial-confirmation-modal";
import { FinancialSuccessModal } from "@/components/registration/registration-status-modals";
import { useUserData } from "@/contexts/user-data-context";

function PaymentFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentType = searchParams.get("type"); // "full" or "semester"
  const userData = useUserData();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [isMobilePaymentSelectionOpen, setIsMobilePaymentSelectionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  // Derive dynamic student details from context
  const studentName = userData?.user_data?.student_name || userData?.entity_name || "Yakubu Onome Joy";
  const academicLevel = userData?.user_data?.academic_information?.study_level || "200L";
  const currentSemester = (userData?.user_data?.academic_information as Record<string, unknown> | undefined)?.current_semester as string || "First Semester";
  const academicInfo = `Academic Year 2025/2026 - ${currentSemester} ${academicLevel}`;

  // Derive labels
  const sessionLabel = "2025/2026";
  const typeLabel = paymentType === "semester" ? "1st Semester Registration" : "Full Session Registration";

  // Selection State
  const [selectedResidence, setSelectedResidence] = useState<string | null>(null);
  const [selectedWorshipCenterId, setSelectedWorshipCenterId] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null);
  const [isFinancialConfirmOpen, setIsFinancialConfirmOpen] = useState(false);
  const [isFinancialSuccessOpen, setIsFinancialSuccessOpen] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === 4) {
      setIsFinancialConfirmOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleChangeStep = (step: number) => {
    setCurrentStep(step);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Residence";
      case 2: return "Select Worship Center";
      case 3: return "Select Meal Plan";
      case 4: return "Summary";
      case 5: return "Payment";
      default: return "Make Payment";
    }
  };

  const getNextLabel = () => {
    switch (currentStep) {
      case 1: return "Proceed";
      case 2: return "Proceed";
      case 3: return "Proceed to Summary";
      case 4: return "Submit";
      default: return "Proceed";
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1: return !selectedResidence;
      case 2: return !selectedWorshipCenterId;
      case 3: return !selectedMealPlan;
      default: return false;
    }
  };

  const handleFullPayment = () => {
    setIsFinancialConfirmOpen(true);
  };

  const handleConfirmFinancialSubmit = () => {
    setIsFinancialConfirmOpen(false);
    setIsFinancialSuccessOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsFinancialSuccessOpen(false);
    setCustomAmount(null);
    setCurrentStep(5);
  };

  const handleCancelPayment = () => {
    setCustomAmount(null);
    setCurrentStep(3);
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    const total = customAmount ?? computeTotal();

    // Simulate payment via wallet (2.5s delay)
    setTimeout(() => {
      setIsProcessing(false);
      setWalletBalance(prev => Math.max(0, prev - total));
      
      router.push(
        `/dashboard/finance/fees/payment/result?status=success&ref=PAY-${Date.now().toString(36).toUpperCase()}&amount=${total}&gateway=Wallet`
      );
    }, 2500);
  };

  // Compute total for partial payment modal and gateway screen
  const computeTotal = () => {
    const MANDATORY_TOTAL = 185000;
    const MEAL_PRICES: Record<string, number> = {
      "breakfast-lunch": 40000,
      "breakfast-supper": 45000,
      "lunch-supper": 42000,
      "breakfast-lunch-supper": 60000,
    };
    const RESIDENCE_PRICES: Record<string, number> = {
      "off-campus": 0,
      "neal-wilson-classic": 102000,
      "neal-wilson-premium": 750000,
      "winslow-premium": 100000,
      "winslow-classic": 152000,
      "gideon-troopers": 500000,
      "bethel-splendor": 500000,
      "samuel-akande": 500000,
      "nelson-mandela": 500000,
      "welch-hall": 400000,
      "topaz-hall": 600000,
      "emerald-classic": 1000000,
      "emerald-classic-plus": 1000000,
      "gamaliel": 450000,
    };
    const residencePrice = selectedResidence ? (RESIDENCE_PRICES[selectedResidence] || 0) : 0;
    const mealPrice = selectedMealPlan ? (MEAL_PRICES[selectedMealPlan] || 0) : 0;
    return MANDATORY_TOTAL + residencePrice + mealPrice;
  };

  return (
    <div className={cn(
      "flex flex-col w-full h-full px-4 md:px-6 relative select-none",
      currentStep === 5 ? "-mt-4 md:-mt-6 pb-0 md:pb-0" : "pb-20 md:pb-6"
    )}>
      
      {/* Mobile Flow Header */}
      {currentStep < 5 && (
        <div className="md:hidden">
          <MobileFlowHeader
            title={getStepTitle()}
            onProgressClick={() => setIsMobileSheetOpen(true)}
          />
        </div>
      )}

      {/* Web Stepper (Hidden on mobile and on step 5) */}
      {currentStep < 5 && (
        <div className="hidden md:block">
          <PaymentStepper
            currentStep={currentStep}
            sessionLabel={sessionLabel}
            typeLabel={typeLabel}
          />
        </div>
      )}

      {/* Main Content Pane */}
      <div className={cn(
        "flex-1 flex justify-center items-start overflow-y-auto",
        currentStep === 5 ? "pt-3 md:pt-4" : "pt-6"
      )}>
        {currentStep === 1 && (
          <SelectResidence
            selectedId={selectedResidence}
            onSelect={setSelectedResidence}
          />
        )}

        {currentStep === 2 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={setSelectedWorshipCenterId}
          />
        )}

        {currentStep === 3 && (
          <SelectMealPlan
            selectedId={selectedMealPlan}
            onSelect={setSelectedMealPlan}
          />
        )}

        {currentStep === 4 && (
          <PaymentSummary
            selectedResidenceId={selectedResidence}
            selectedWorshipCenterId={selectedWorshipCenterId}
            selectedMealPlanId={selectedMealPlan}
            onChangeStep={handleChangeStep}
          />
        )}

        {currentStep === 5 && (
          <WalletPayment
            walletBalance={walletBalance}
            totalAmount={customAmount ?? computeTotal()}
            studentName={studentName}
            academicInfo={academicInfo}
            onCancelPayment={handleCancelPayment}
            onPayNow={handlePayNow}
            onFundWallet={() => setIsFundWalletModalOpen(true)}
          />
        )}
      </div>

      {/* Bottom Action Bar — Steps 1-3 use standard bar */}
      {currentStep < 4 && (
        <BottomActionBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          nextLabel={getNextLabel()}
          isNextDisabled={isNextDisabled()}
        />
      )}

      {/* Step 4: Custom Payment Bottom Bar */}
      {currentStep === 4 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 md:px-8 md:py-6 z-40 transition-colors">
          <div className="flex items-center justify-between max-w-[1200px] mx-auto">
            {/* Previous */}
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2 bg-[#f6f8fa] dark:bg-gray-800 text-[#525866] dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline-block">Previous</span>
            </Button>

            {/* Submit Selection Button */}
            <div className="flex-1 md:flex-none flex items-center justify-end pl-3 md:pl-0">
              <Button
                onClick={handleFullPayment}
                className="w-full md:w-auto rounded-[10px] h-11 px-6 md:px-8 text-[14px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white transition-all"
              >
                Submit selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Payment Modal (Desktop and Mobile flow) */}
      <PartialPaymentModal
        isOpen={isPartialPaymentOpen}
        onClose={() => setIsPartialPaymentOpen(false)}
        totalAmount={computeTotal()}
        onPayNow={(amount) => {
          setCustomAmount(amount);
          setCurrentStep(4);
        }}
      />

      {/* Mobile Payment Selection Sheet */}
      <PaymentMethodSheet
        isOpen={isMobilePaymentSelectionOpen}
        onClose={() => setIsMobilePaymentSelectionOpen(false)}
        onSelectPartial={() => setIsPartialPaymentOpen(true)}
        onSelectFull={handleFullPayment}
        sessionLabel={`${sessionLabel} Session`}
      />

      <PaymentProgressSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        currentStep={currentStep}
      />

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => setIsFundWalletModalOpen(false)}
        onSuccess={(amount) => setWalletBalance(prev => prev + amount)}
      />

      <FinancialConfirmationModal
        isOpen={isFinancialConfirmOpen}
        onClose={() => setIsFinancialConfirmOpen(false)}
        onConfirm={handleConfirmFinancialSubmit}
        studentName={studentName}
      />

      <FinancialSuccessModal
        isOpen={isFinancialSuccessOpen}
        onClose={() => setIsFinancialSuccessOpen(false)}
        onPrimaryAction={handleProceedToPayment}
      />

      {/* Processing Overlay */}
      <ProcessingOverlay isVisible={isProcessing} />
    </div>
  );
}

export default function PaymentFlow() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb] dark:border-[#4d82ff]"></div>
      </div>
    }>
      <PaymentFlowContent />
    </Suspense>
  );
}
