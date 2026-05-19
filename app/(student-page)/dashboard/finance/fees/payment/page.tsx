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
import { SelectMealPlan } from "@/components/fees/steps/select-meal-plan";
import { SelectWorshipCenter } from "@/components/fees/steps/select-worship-center";
import { PaymentSummary } from "@/components/fees/steps/payment-summary";
import { SelectGateway } from "@/components/fees/steps/select-gateway";
import { PartialPaymentModal } from "@/components/fees/partial-payment-modal";
import { PaymentProgressSheet } from "@/components/fees/payment-progress-sheet";
import { PaymentMethodSheet } from "@/components/fees/payment-method-sheet";
import { ProcessingOverlay } from "@/components/fees/processing-overlay";

function PaymentFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentType = searchParams.get("type"); // "full" or "semester"
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [isMobilePaymentSelectionOpen, setIsMobilePaymentSelectionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Derive labels
  const sessionLabel = "2025/2026";
  const typeLabel = paymentType === "semester" ? "1st Semester Fees" : "Full Session Fees";

  // Selection State
  const [selectedResidence, setSelectedResidence] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null);
  const [selectedWorshipCenter, setSelectedWorshipCenter] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
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
      case 2: return "Select Meal Plan";
      case 3: return "Select Worship Center";
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
      default: return "Proceed";
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1: return !selectedResidence;
      case 2: return !selectedMealPlan;
      case 3: return !selectedWorshipCenter;
      default: return false;
    }
  };

  const handleFullPayment = () => {
    // Navigate to gateway selection step
    setCurrentStep(5);
  };

  const handleCancelPayment = () => {
    // Go back to summary
    setCurrentStep(4);
    setSelectedGateway(null);
  };

  const handlePayNow = () => {
    if (!selectedGateway) return;

    // Show processing overlay
    setIsProcessing(true);

    // Simulate external gateway redirect + response (2s delay)
    setTimeout(() => {
      setIsProcessing(false);
      const total = computeTotal();
      router.push(
        `/dashboard/finance/fees/payment/result?status=success&ref=PAY-${Date.now().toString(36).toUpperCase()}&amount=${total}&gateway=${selectedGateway === "payzeep" ? "Payzeep" : "Flutterwave"}`
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
    <div className="flex flex-col min-h-full h-full bg-white md:bg-transparent relative">
      <div className="hidden md:block">
        <PaymentStepper 
          currentStep={currentStep} 
          sessionLabel={sessionLabel}
          typeLabel={typeLabel}
        />
      </div>

      {/* Mobile Header */}
      <MobileFlowHeader
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={getStepTitle()}
        onProgressClick={() => setIsMobileSheetOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 py-4 md:py-2 flex flex-col items-center">
        {currentStep === 1 && (
          <SelectResidence
            selectedId={selectedResidence}
            onSelect={setSelectedResidence}
          />
        )}

        {currentStep === 2 && (
          <SelectMealPlan
            selectedId={selectedMealPlan}
            onSelect={setSelectedMealPlan}
          />
        )}

        {currentStep === 3 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenter}
            onSelect={setSelectedWorshipCenter}
          />
        )}

        {currentStep === 4 && (
          <PaymentSummary
            selectedResidenceId={selectedResidence}
            selectedMealPlanId={selectedMealPlan}
            selectedWorshipCenterId={selectedWorshipCenter}
            onChangeStep={handleChangeStep}
          />
        )}

        {currentStep === 5 && (
          <SelectGateway
            selectedGateway={selectedGateway}
            onSelect={setSelectedGateway}
            totalAmount={computeTotal()}
            onCancelPayment={handleCancelPayment}
            onPayNow={handlePayNow}
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
              className="rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2 bg-[#f6f8fa] dark:bg-gray-850 text-[#525866] dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline-block">Previous</span>
            </Button>

            {/* Desktop Payment Buttons (Hidden on mobile) */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={() => setIsPartialPaymentOpen(true)}
                variant="outline"
                className="rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium border-[#003cbb] dark:border-[#4d82ff] text-[#003cbb] dark:text-[#4d82ff] hover:bg-[#f8faff] dark:hover:bg-gray-800 transition-all"
              >
                Make Partial Payment
              </Button>
              <Button
                onClick={handleFullPayment}
                className="rounded-[10px] h-11 px-4 md:px-8 text-[14px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white shadow-sm transition-all"
              >
                Make full Payment Now
              </Button>
            </div>

            {/* Mobile Payment Button (Hidden on desktop) */}
            <div className="md:hidden flex-1 pl-3">
              <Button
                onClick={() => setIsMobilePaymentSelectionOpen(true)}
                className="w-full rounded-[10px] h-11 text-[14px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white shadow-sm transition-all"
              >
                Make Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5 has its own bottom actions embedded in SelectGateway */}

      {/* Partial Payment Modal (Desktop and Mobile flow) */}
      <PartialPaymentModal
        isOpen={isPartialPaymentOpen}
        onClose={() => setIsPartialPaymentOpen(false)}
        totalAmount={computeTotal()}
        onPayNow={() => setCurrentStep(5)}
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
