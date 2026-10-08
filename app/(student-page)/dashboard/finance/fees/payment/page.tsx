"use client";

import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaymentStepper } from "@/components/fees/payment-stepper";
import type { StepDefinition } from "@/components/fees/payment-stepper";
import { MobileFlowHeader } from "@/components/registration/mobile-flow-header";
import { BottomActionBar } from "@/components/registration/bottom-action-bar";
import { SelectResidence } from "@/components/fees/steps/select-residence";
import { SelectWorshipCenter } from "@/components/registration/steps/select-worship-center";
import { SelectMealPlan, getMealPlanPrice } from "@/components/fees/steps/select-meal-plan";
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
import { useFinanceRegistration } from "@/hooks/use-finance-registration";
import { useWalletStore } from "@/hooks/use-wallet-store";
import { useRegistrationStore } from "@/hooks/use-registration-store";
import {
  saveOfflineDraft,
  getOfflineDraft,
  clearOfflineDraft,
  OFFLINE_FINANCE_REG_KEY,
  FinanceRegistrationDraft,
} from "@/lib/offline-storage";
import type { FinanceWorshipCenter } from "@/app/actions/registration-finance";

// ─────────────────────────────────────────────────────────────────────────────
// Hall → Worship Center keyword map
//
// Keys   = hall residenceid from the API
// Values = substrings to match against
//          `"${sabbath_class_name} ${location_on_campus}".toLowerCase()`
//
// Adjust these strings whenever hall / chapel names change in the API.
// ─────────────────────────────────────────────────────────────────────────────
const HALL_WORSHIP_KEYWORDS: Record<string, string[]> = {
  BC:    ["bethel"],
  EMER2: ["emerald"],
  EMER4: ["emerald"],
  I2:    ["gamaliel"],
  PM:    ["gideon", "beula"],
  NM:    ["neal wilson"],
  ROYL:  ["nelson mandela", "canaan"],
  WE:    ["welch"],
  WI:    ["winslow"],
};

/** Returns the worship center pre-assigned to a hall, or null if none. */
function findHallWorshipCenter(
  residenceid: string,
  worshipCenters: FinanceWorshipCenter[]
): FinanceWorshipCenter | null {
  const keywords = HALL_WORSHIP_KEYWORDS[residenceid];
  if (!keywords?.length) return null;
  return (
    worshipCenters.find((wc) => {
      const haystack =
        `${wc.sabbath_class_name} ${wc.location_on_campus}`.toLowerCase();
      return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
    }) ?? null
  );
}

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────

function PaymentFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentType = searchParams.get("type");
  const userData = useUserData();

  const { data: financeData, isLoading, error } = useFinanceRegistration();
  const { balance: storeWalletBalance, fetchBalance, setBalance: setStoreWalletBalance } = useWalletStore();
  const walletBalance = storeWalletBalance ?? 0;

  const {
    lockedWorshipCenterId,
    worshipCenterLockedUntil,
    setWorshipCenterLock,
  } = useRegistrationStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [isMobilePaymentSelectionOpen, setIsMobilePaymentSelectionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isRestored, setIsRestored] = useState(false);

  // Core selection state
  const [selectedResidence, setSelectedResidence] = useState<string | null>(null);
  const [selectedWorshipCenterId, setSelectedWorshipCenterId] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null);
  const [isFinancialConfirmOpen, setIsFinancialConfirmOpen] = useState(false);
  const [isFinancialSuccessOpen, setIsFinancialSuccessOpen] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const studentName = userData?.user_data?.student_name || userData?.entity_name || "Student";
  const academicLevel = userData?.user_data?.academic_information?.study_level || "200L";
  const currentSemester =
    (userData?.user_data?.academic_information as Record<string, unknown> | undefined)
      ?.current_semester as string || "First Semester";
  const academicInfo = `Academic Year 2025/2026 - ${currentSemester} ${academicLevel}`;

  const sessionLabel = "2025/2026";
  const typeLabel = paymentType === "semester" ? "1st Semester Registration" : "Full Session Registration";

  // ── Core derived flags — read directly from state, no intermediate variable ─
  // NOTE: These are plain constants recomputed on every render.
  // Do NOT wrap them in useMemo; that would delay the update by one render tick
  // when the dependency comparison runs stale.
  const isOffCampus = selectedResidence === "OFF_CAMPUS";

  const isWorshipLocked =
    !!lockedWorshipCenterId &&
    !!worshipCenterLockedUntil &&
    Date.now() < worshipCenterLockedUntil;

  // ── Derived selected objects ──────────────────────────────────────────────

  const selectedResidenceObj = useMemo(() => {
    if (!selectedResidence || isOffCampus || !financeData?.residence) return null;
    return (
      financeData.residence.find((r) => String(r.qresidenceid) === selectedResidence) || null
    );
  }, [selectedResidence, isOffCampus, financeData]);

  /** Worship center auto-assigned by the hall (null when off-campus or no keyword match). */
  const hallAssignedWC = useMemo((): FinanceWorshipCenter | null => {
    if (isOffCampus || isWorshipLocked || !selectedResidenceObj || !financeData?.worship_centers) {
      return null;
    }
    return findHallWorshipCenter(selectedResidenceObj.residenceid, financeData.worship_centers);
  }, [isOffCampus, isWorshipLocked, selectedResidenceObj, financeData]);

  /** True when the worship center is silently assigned by the selected hall. */
  const isWorshipAutoAssigned = !isOffCampus && !!hallAssignedWC;

  const selectedWorshipCenterObj = useMemo(() => {
    if (!selectedWorshipCenterId || !financeData?.worship_centers) return null;
    return (
      financeData.worship_centers.find(
        (wc) => String(wc.sabbath_class_id) === selectedWorshipCenterId
      ) || null
    );
  }, [selectedWorshipCenterId, financeData]);

  const selectedMealTypeObj = useMemo(() => {
    if (!selectedMealPlan || !financeData?.meal_types) return null;
    return (
      financeData.meal_types.find(
        (m) => String(m.qselectionid) === selectedMealPlan || m.mealtype === selectedMealPlan
      ) || null
    );
  }, [selectedMealPlan, financeData]);

  /** Details of the currently locked worship center (for the read-only lock panel). */
  const lockedWCDetails = useMemo(() => {
    if (!isWorshipLocked || !lockedWorshipCenterId || !financeData?.worship_centers) return null;
    const wc = financeData.worship_centers.find(
      (w) => String(w.sabbath_class_id) === lockedWorshipCenterId
    );
    return wc
      ? { name: wc.sabbath_class_name, location: wc.location_on_campus, pastor: wc.pastor_in_charge }
      : null;
  }, [isWorshipLocked, lockedWorshipCenterId, financeData]);

  const mappedWorshipCenters = useMemo(() => {
    if (!financeData?.worship_centers) return [];
    return financeData.worship_centers.map((wc) => ({
      id: String(wc.sabbath_class_id),
      name: wc.sabbath_class_name,
      location: wc.location_on_campus,
      pastor: wc.pastor_in_charge,
      declaredCapacity: wc.declared_capacity,
      spacesLeft: wc.space_left,
    }));
  }, [financeData]);

  /** The hall's chapel ID to hide from the free-choice list in step 2. */
  const excludedWorshipCenterId = useMemo(() => {
    if (!selectedResidenceObj || !financeData?.worship_centers) return null;
    const wc = findHallWorshipCenter(selectedResidenceObj.residenceid, financeData.worship_centers);
    return wc ? String(wc.sabbath_class_id) : null;
  }, [selectedResidenceObj, financeData]);

  // ── Dynamic step navigation ───────────────────────────────────────────────
  //
  //  Internal step IDs:
  //    1 = Select Residence
  //    2 = Select Worship Center
  //    3 = Select Meal Plan      ← skipped when off-campus
  //    4 = Summary
  //
  //  NOTE: These are plain functions (not useCallback) so they ALWAYS read
  //  the freshest render's values of selectedResidence and hallAssignedWC,
  //  with zero risk of a stale closure causing wrong navigation.
  // ─────────────────────────────────────────────────────────────────────────

  const getNextStep = (step: number): number => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    if (step === 1) return 2;
    if (step === 2) return offCampus ? 4 : 3;
    if (step === 3) return 4;
    return step;
  };

  const getPrevStep = (step: number): number => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    

    if (step === 4) return offCampus ? 2 : 3;         // skip back over meal when off-campus
    if (step === 3) return 2;
    if (step === 2) return 1;
    return step;
  };

  // ── Safety net: auto-correct invalid step ─────────────────────────────────
  // If the student somehow arrives at step 3 (meal) while off-campus is selected
  // (e.g. a draft was restored with step=3 from a previous hall session, then
  // the student switched to off-campus), automatically advance to summary.
  useEffect(() => {
    if (isOffCampus && currentStep === 3) {
      setCurrentStep(4);
    }
  }, [isOffCampus, isWorshipAutoAssigned, currentStep]);

  // ── Visible steps for stepper / progress sheet ────────────────────────────
  // Re-derived from the raw state variables (not from derived booleans) so
  // React's useMemo dependency tracking is as direct as possible.
  const visibleSteps = useMemo((): StepDefinition[] => {
    const offCampus = selectedResidence === "OFF_CAMPUS";
    

    return [
      { id: 1, title: "Select Residence" },
      { id: 2, title: "Select Worship Center" },
      { id: 3, title: "Select Meal Plan" },
      { id: 4, title: "Summary" },
    ].filter((s) => {
      
      if (s.id === 3 && offCampus) return false;     // off-campus → hide meal step
      return true;
    });
  }, [selectedResidence, hallAssignedWC]);

  // ── Restore draft from offline storage ────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadDraft() {
      try {
        const draft = await getOfflineDraft<FinanceRegistrationDraft>(OFFLINE_FINANCE_REG_KEY);
        if (draft && isMounted) {
          if (draft.selectedResidence !== undefined) setSelectedResidence(draft.selectedResidence);
          if (draft.selectedWorshipCenterId !== undefined) setSelectedWorshipCenterId(draft.selectedWorshipCenterId);
          if (draft.selectedMealPlan !== undefined) setSelectedMealPlan(draft.selectedMealPlan);
          if (draft.customAmount !== undefined) setCustomAmount(draft.customAmount);
          if (draft.currentStep && draft.currentStep >= 1 && draft.currentStep <= 4) {
            setCurrentStep(draft.currentStep);
          }
        }
      } catch (err) {
        console.warn("Failed to restore finance draft:", err);
      } finally {
        if (isMounted) setIsRestored(true);
      }
    }
    loadDraft();
    return () => { isMounted = false; };
  }, []);

  // ── Enforce worship lock after draft restore ──────────────────────────────
  useEffect(() => {
    if (!isRestored) return;
    if (isWorshipLocked && lockedWorshipCenterId) {
      setSelectedWorshipCenterId(lockedWorshipCenterId);
    }
  }, [isRestored, isWorshipLocked, lockedWorshipCenterId]);


  // ── Save draft to offline storage ─────────────────────────────────────────
  useEffect(() => {
    if (!isRestored) return;
    const draft: FinanceRegistrationDraft = {
      currentStep: currentStep <= 4 ? currentStep : 4,
      selectedResidence,
      selectedWorshipCenterId,
      selectedMealPlan,
      customAmount,
      updatedAt: Date.now(),
    };
    saveOfflineDraft(OFFLINE_FINANCE_REG_KEY, draft).catch((err) => {
      console.warn("Failed to save finance draft:", err);
    });
  }, [isRestored, currentStep, selectedResidence, selectedWorshipCenterId, selectedMealPlan, customAmount]);

  const hasProgress = useMemo(() => {
    return (
      currentStep > 1 ||
      selectedResidence !== null ||
      selectedWorshipCenterId !== null ||
      selectedMealPlan !== null ||
      customAmount !== null
    );
  }, [currentStep, selectedResidence, selectedWorshipCenterId, selectedMealPlan, customAmount]);

  const handleResetProgress = async () => {
    try { await clearOfflineDraft(OFFLINE_FINANCE_REG_KEY); } catch {}
    setSelectedResidence(null);
    if (!isWorshipLocked) setSelectedWorshipCenterId(null);
    setSelectedMealPlan(null);
    setCustomAmount(null);
    setCurrentStep(1);
  };

  // ── Residence selection — clears dependent state ──────────────────────────
  const handleResidenceSelect = useCallback(
    (id: string) => {
      setSelectedResidence(id);
      // Off-campus has no meal plan
      if (id === "OFF_CAMPUS") {
        setSelectedMealPlan(null);
      }
      // Clear worship when residence changes (unless the 2-year lock holds it)
      if (!isWorshipLocked) {
        setSelectedWorshipCenterId(null);
      }
    },
    [isWorshipLocked]
  );

  // ── Navigation handlers ────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 4) {
      setIsFinancialConfirmOpen(true);
      return;
    }
    setCurrentStep(getNextStep(currentStep));
  };

  const handlePrevious = () => {
    if (currentStep <= 1) return;
    setCurrentStep(getPrevStep(currentStep));
  };

  const handleChangeStep = (step: number) => setCurrentStep(step);

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    if (currentStep === 4) return "Submit";
    if (getNextStep(currentStep) === 4) return "Proceed to Summary";
    return "Proceed";
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1: return !selectedResidence;
      case 2: return !selectedWorshipCenterId;
      case 3: return !selectedMealPlan;
      default: return false;
    }
  };

  // ── Financial submission ───────────────────────────────────────────────────

  const handleFullPayment = () => setIsFinancialConfirmOpen(true);

  const handleConfirmFinancialSubmit = () => {
    setIsFinancialConfirmOpen(false);
    // Apply 2-year worship lock on successful submission
    if (selectedWorshipCenterId && !isWorshipLocked) {
      setWorshipCenterLock(selectedWorshipCenterId, Date.now() + TWO_YEARS_MS);
    }
    setIsFinancialSuccessOpen(true);
  };

  const handleProceedToPayment = () => {
    setIsFinancialSuccessOpen(false);
    setCustomAmount(null);
    setCurrentStep(5);
  };

  const handleCancelPayment = () => {
    setCustomAmount(null);
    setCurrentStep(4);
  };

  // ── Total computation ─────────────────────────────────────────────────────

  const computeTotal = () => {
    const mandatory = financeData?.general_charges?.fees || 0;
    const residenceCost = isOffCampus ? 0 : (selectedResidenceObj?.charges || 0);
    // Off-campus students have no meal plan
    const mealCost =
      !isOffCampus && selectedMealTypeObj
        ? getMealPlanPrice(selectedMealTypeObj.mealtype, financeData?.general_charges)
        : 0;
    return mandatory + residenceCost + mealCost;
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    const total = customAmount ?? computeTotal();
    setTimeout(() => {
      setIsProcessing(false);
      setStoreWalletBalance(Math.max(0, walletBalance - total));
      clearOfflineDraft(OFFLINE_FINANCE_REG_KEY).catch(() => {});
      router.push(
        `/dashboard/finance/fees/payment/result?status=success&ref=PAY-${Date.now().toString(36).toUpperCase()}&amount=${total}&gateway=Wallet`
      );
    }, 2500);
  };

  // ─────────────────────────────────────────────────────────────────────────

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
            hasProgress={hasProgress}
            onCancelProgress={handleResetProgress}
          />
        </div>
      )}

      {/* Desktop Stepper */}
      {currentStep < 5 && (
        <div className="hidden md:block">
          <PaymentStepper
            currentStep={currentStep}
            steps={visibleSteps}
            sessionLabel={sessionLabel}
            typeLabel={typeLabel}
            hasProgress={hasProgress}
            onCancelProgress={handleResetProgress}
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
            onSelect={handleResidenceSelect}
            residences={financeData?.residence || []}
            isLoading={isLoading}
            error={error}
          />
        )}

        {/* Step 2: Worship Center — shown for ALL residence types (including off-campus),
            but put into locked read-only mode when a 2-year lock is active. */}
        {currentStep === 2 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={setSelectedWorshipCenterId}
            worshipCenters={mappedWorshipCenters}
            isLoading={isLoading}
            error={error}
            isLocked={isWorshipLocked}
            lockedUntil={worshipCenterLockedUntil}
            lockedCenter={lockedWCDetails}

            excludedId={excludedWorshipCenterId}
          />
        )}

        {/* Step 3: Meal Plan — only shown for on-campus students.
            The isOffCampus guard here is the last line of defence: even if
            navigation somehow reaches step 3 for an off-campus student, we
            render nothing and the safety-net useEffect will advance to step 4. */}
        {currentStep === 3 && !isOffCampus && (
          <SelectMealPlan
            selectedId={selectedMealPlan}
            onSelect={setSelectedMealPlan}
            mealTypes={financeData?.meal_types?.filter((m: any) => !m.selection.toLowerCase().includes("off campus")) || []}
            generalCharges={financeData?.general_charges || null}
            isLoading={isLoading}
            error={error}
          />
        )}

        {currentStep === 4 && (
          <PaymentSummary
            selectedResidence={selectedResidenceObj}
            isOffCampus={isOffCampus}
            selectedWorshipCenter={selectedWorshipCenterObj}
            selectedMealType={selectedMealTypeObj}
            generalCharges={financeData?.general_charges || null}
            onChangeStep={handleChangeStep}
            isWorshipAutoAssigned={false}
            isWorshipLocked={isWorshipLocked}
            worshipLockedUntil={worshipCenterLockedUntil}
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

      {/* Bottom Action Bar — Steps 1–3 */}
      {currentStep < 4 && (
        <BottomActionBar
          currentStep={currentStep}
          totalSteps={visibleSteps.length}
          onPrevious={handlePrevious}
          onNext={handleNext}
          nextLabel={getNextLabel()}
          isNextDisabled={isNextDisabled()}
        />
      )}

      {/* Step 4 — custom action bar */}
      {currentStep === 4 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-4 md:px-8 md:py-6 z-40 transition-colors">
          <div className="flex items-center justify-between max-w-[1200px] mx-auto">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2 bg-[#f6f8fa] dark:bg-gray-800 text-[#525866] dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline-block">Previous</span>
            </Button>
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

      {/* Modals */}
      <PartialPaymentModal
        isOpen={isPartialPaymentOpen}
        onClose={() => setIsPartialPaymentOpen(false)}
        totalAmount={computeTotal()}
        onPayNow={(amount) => {
          setCustomAmount(amount);
          setCurrentStep(4);
        }}
      />

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
        steps={visibleSteps}
      />

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => setIsFundWalletModalOpen(false)}
        onSuccess={(amount) => setStoreWalletBalance(walletBalance + amount)}
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

      <ProcessingOverlay isVisible={isProcessing} />
    </div>
  );
}

export default function PaymentFlow() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003cbb] dark:border-[#4d82ff]" />
      </div>
    }>
      <PaymentFlowContent />
    </Suspense>
  );
}
