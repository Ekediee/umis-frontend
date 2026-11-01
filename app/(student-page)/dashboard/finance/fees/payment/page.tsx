"use client";

import { useState, useMemo, Suspense, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { confirmWalletFunding } from "@/lib/payments/wallet-funding";
import { toast } from "sonner";
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
import {
  submitFinanceRegistrationAction,
  type FinanceResidence,
  type FinanceMealType,
  type FinanceWorshipCenter,
} from "@/app/actions/registration-finance";

/** Derives a meal plan code (BL, BS, LS, BLS, NONE) from a descriptive label. */
function deriveMealCode(label: string): string {
  const upper = label.trim().toUpperCase();
  if (upper === "BL" || upper === "BS" || upper === "LS" || upper === "BLS" || upper === "NONE") {
    return upper;
  }
  if (upper.includes("OFF CAMPUS")) return "NONE";
  const hasB = upper.includes("BREAKFAST");
  const hasL = upper.includes("LUNCH");
  const hasS = upper.includes("SUPPER");
  if (hasB && hasL && hasS) return "BLS";
  if (hasB && hasL) return "BL";
  if (hasB && hasS) return "BS";
  if (hasL && hasS) return "LS";
  return label;
}

/** Returns the worship center associated with a hall by matching residenceid, or null if none. */
function findHallWorshipCenter(
  residenceid: string,
  worshipCenters: FinanceWorshipCenter[]
): FinanceWorshipCenter | null {
  if (!residenceid) return null;
  const targetId = residenceid.trim().toLowerCase();
  return (
    worshipCenters.find(
      (wc) => wc.residenceid && wc.residenceid.trim().toLowerCase() === targetId
    ) ?? null
  );
}

const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────

/** Match a residence by name against the catalog, tolerating case/spacing/punctuation differences. */
function findCatalogResidence(list: FinanceResidence[], name: string): FinanceResidence | undefined {
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(name);
  if (!target) return undefined;
  return (
    list.find((r) => r.qresidenceid > 0 && norm(r.residencename) === target) ||
    list.find((r) => {
      if (r.qresidenceid <= 0) return false;
      const n = norm(r.residencename);
      return n.length > 3 && (n.startsWith(target) || target.startsWith(n));
    })
  );
}

function PaymentFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentType = searchParams.get("type");
  const userData = useUserData();

  const {
    data: financeData,
    summary: financeSummary,
    studentFees,
    isLoading,
    error,
    markAsLocked,
    refreshSummaryAndFees,
  } = useFinanceRegistration();
  const { balance: storeWalletBalance, error: walletError, fetchBalance, setBalance: setStoreWalletBalance } = useWalletStore();
const walletBalance = storeWalletBalance ?? 0;

  const {
    lockedWorshipCenterId,
    worshipCenterLockedUntil,
    setWorshipCenterLock,
    isFinancialSubmitted,
    setIsFinancialSubmitted,
    payState,
    setPayState,
  } = useRegistrationStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isPartialPaymentOpen, setIsPartialPaymentOpen] = useState(false);
  const [isMobilePaymentSelectionOpen, setIsMobilePaymentSelectionOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingFinanceReg, setIsSubmittingFinanceReg] = useState(false);
  const [isFundWalletModalOpen, setIsFundWalletModalOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const hasAppliedSummaryRef = useRef(false);

  // Core selection state
  const [selectedResidence, setSelectedResidence] = useState<string | null>(null);
  const [selectedWorshipCenterId, setSelectedWorshipCenterId] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<string | null>(null);
  const [isFinancialConfirmOpen, setIsFinancialConfirmOpen] = useState(false);
  const [isFinancialSuccessOpen, setIsFinancialSuccessOpen] = useState(false);

  const isBackendLocked = Boolean(financeSummary?.lock_financial_reg);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Handle return from merchant payment callback
  useEffect(() => {
    const txRef = searchParams.get("transaction_reference") || searchParams.get("data");
    const paymentStatus = searchParams.get("payment_status");
    if (!txRef && !paymentStatus) return;

    // Clean callback params from address bar
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("transaction_reference");
    currentUrl.searchParams.delete("data");
    currentUrl.searchParams.delete("status");
    currentUrl.searchParams.delete("payment_status");
    window.history.replaceState({}, "", currentUrl.toString());

    setCurrentStep(5);

    if (!txRef) {
      toast.error("Payment was not completed. Please try again.");
      return;
    }

    const confirming = toast.loading("Confirming your payment…");
    confirmWalletFunding(txRef).then((result) => {
      toast.dismiss(confirming);
      fetchBalance();
      if (result.outcome === "credited") {
        toast.success(`₦${result.amount.toLocaleString()} was added to your wallet.`);
      } else if (result.outcome === "pending") {
        toast.warning(`Your wallet hasn't updated yet. Please check again in a few minutes, and don't pay again. Ref ${result.reference}.`, { duration: 15000 });
      } else {
        toast.error(result.error);
      }
    });
  }, [searchParams, fetchBalance]);

  // If navigated here explicitly with ?step=5 (e.g. wallet funding return), land on step 5
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam === "5") {
      setCurrentStep(5);
    }
  }, [searchParams]);

  const studentName = userData?.user_data?.student_name || userData?.entity_name || "Student";
  const academicLevel = userData?.user_data?.academic_information?.study_level || "200L";
  const currentSemester =
    (userData?.user_data?.academic_information as Record<string, unknown> | undefined)
      ?.current_semester as string || "First Semester";
  const academicInfo = `Academic Year 2025/2026 - ${currentSemester} ${academicLevel}`;

  const sessionLabel = "2025/2026";
  const isFullSession = paymentType === "full";
  const typeLabel = paymentType === "semester" ? "1st Semester Registration" : "Full Session Registration";

  // ── Effective lists (catalog + fallback from financial-reg-summary) ───────

  const effectiveResidences = useMemo((): FinanceResidence[] => {
    const list = financeData?.residence || [];
    const sr = financeSummary?.semester_residence;
    if (!sr?.residence_name) return list;
    const exists = !!findCatalogResidence(list, sr.residence_name);
    if (exists) return list;
    const isOC = sr.residence_name.trim().toLowerCase().includes("off campus");
    const fallback: FinanceResidence = {
      qresidenceid: -1,
      residenceoption: sr.majors || "Full",
      full_charges: (sr.residence_charges || 0) * 2,
      charges: sr.residence_charges || 0,
      residenceid: isOC ? "OC" : "SUMMARY_RES",
      residencename: sr.residence_name,
      sex: "",
      min_level: 100,
      max_level: 500,
      majors: sr.majors || "Hall Type: Classic",
      blockname: "A",
      capacity: 0,
      roomsize: 0,
      org_id: 0,
      occupied_space: 0,
      space_left: 1,
      residence_images: sr.residence_images || [],
    };
    return [fallback, ...list];
  }, [financeData, financeSummary]);

  const effectiveWorshipCenters = useMemo((): FinanceWorshipCenter[] => {
    const list = financeData?.worship_centers || [];
    const swc = financeSummary?.worship_center;
    if (!swc?.worship_center_name) return list;
    const exists = list.some(
      (wc) => wc.sabbath_class_name.trim().toLowerCase() === swc.worship_center_name.trim().toLowerCase()
    );
    if (exists) return list;
    const fallback: FinanceWorshipCenter = {
      sabbath_class_id: -1,
      sabbath_class_name: swc.worship_center_name,
      pastor_in_charge: swc.pastor_in_charge || "TBA",
      location_on_campus: swc.location_on_campus || "Main Campus",
      declared_capacity: 0,
      occupied_space: 0,
      space_left: 1,
      residenceid: null,
    };
    return [fallback, ...list];
  }, [financeData, financeSummary]);

  const effectiveMealTypes = useMemo((): FinanceMealType[] => {
    const list = financeData?.meal_types || [];
    const sm = financeSummary?.meal_type;
    if (!sm?.meal_type) return list;
    const target = sm.meal_type.trim().toLowerCase();
    const exists = list.some(
      (m) =>
        m.selection.trim().toLowerCase() === target ||
        m.mealtype.trim().toLowerCase() === target
    );
    if (exists) return list;
    const fallback: FinanceMealType = {
      qselectionid: -1,
      mealtype: deriveMealCode(sm.meal_type),
      selection: sm.meal_type,
    };
    return [fallback, ...list];
  }, [financeData, financeSummary]);

  // ── Derived selected objects & flags ──────────────────────────────────────

  const summaryMatchedResidenceId = useMemo((): string | null => {
    const targetName = financeSummary?.semester_residence?.residence_name?.trim().toLowerCase();
    if (!targetName) return null;
    const matchRes = findCatalogResidence(effectiveResidences, targetName);
    return matchRes ? String(matchRes.qresidenceid) : null;
  }, [financeSummary, effectiveResidences]);

  const summaryMatchedWorshipCenterId = useMemo((): string | null => {
    const targetWc = financeSummary?.worship_center?.worship_center_name?.trim().toLowerCase();
    if (!targetWc) return null;
    const matchWc = effectiveWorshipCenters.find(
      (wc) => wc.sabbath_class_name.trim().toLowerCase() === targetWc
    );
    return matchWc ? String(matchWc.sabbath_class_id) : null;
  }, [financeSummary, effectiveWorshipCenters]);

  const summaryMatchedMealPlanId = useMemo((): string | null => {
    const targetMeal = financeSummary?.meal_type?.meal_type?.trim().toLowerCase();
    if (!targetMeal) return null;
    const matchMeal = effectiveMealTypes.find(
      (m) =>
        m.selection.trim().toLowerCase() === targetMeal ||
        m.mealtype.trim().toLowerCase() === targetMeal
    );
    return matchMeal ? String(matchMeal.qselectionid) : null;
  }, [financeSummary, effectiveMealTypes]);

  const activeResidence = selectedResidence ?? summaryMatchedResidenceId;
  const activeWorshipCenterId = selectedWorshipCenterId ?? summaryMatchedWorshipCenterId;
  const activeMealPlan = selectedMealPlan ?? summaryMatchedMealPlanId;

  const selectedResidenceObj = useMemo(() => {
    if (!activeResidence) return null;
    return (
      effectiveResidences.find((r) => String(r.qresidenceid) === activeResidence) || null
    );
  }, [activeResidence, effectiveResidences]);

  const isOffCampus =
    activeResidence === "OFF_CAMPUS" ||
    selectedResidenceObj?.residenceid?.trim().toUpperCase() === "OC" ||
    Boolean(selectedResidenceObj?.residencename?.toLowerCase().includes("off campus"));

  const isWorshipLocked =
    !!lockedWorshipCenterId &&
    !!worshipCenterLockedUntil &&
    Date.now() < worshipCenterLockedUntil;

  /** Worship center auto-assigned by the hall (null when off-campus or no match). */
  const hallAssignedWC = useMemo((): FinanceWorshipCenter | null => {
    if (isOffCampus || isWorshipLocked || !selectedResidenceObj) {
      return null;
    }
    return findHallWorshipCenter(selectedResidenceObj.residenceid, effectiveWorshipCenters);
  }, [isOffCampus, isWorshipLocked, selectedResidenceObj, effectiveWorshipCenters]);

  /** True when the worship center is silently assigned by the selected hall. */
  const isWorshipAutoAssigned = !isOffCampus && !!hallAssignedWC;

  const selectedWorshipCenterObj = useMemo(() => {
    if (!activeWorshipCenterId) return null;
    return (
      effectiveWorshipCenters.find(
        (wc) => String(wc.sabbath_class_id) === activeWorshipCenterId
      ) || null
    );
  }, [activeWorshipCenterId, effectiveWorshipCenters]);

  const selectedMealTypeObj = useMemo(() => {
    if (!activeMealPlan) return null;
    return (
      effectiveMealTypes.find(
        (m) => String(m.qselectionid) === activeMealPlan || m.mealtype === activeMealPlan
      ) || null
    );
  }, [activeMealPlan, effectiveMealTypes]);

  /** Details of the currently locked worship center (for the read-only lock panel). */
  const lockedWCDetails = useMemo(() => {
    if (isWorshipLocked && lockedWorshipCenterId) {
      const wc = effectiveWorshipCenters.find(
        (w) => String(w.sabbath_class_id) === lockedWorshipCenterId
      );
      if (wc) {
        return {
          name: wc.sabbath_class_name,
          location: wc.location_on_campus,
          pastor: wc.pastor_in_charge,
        };
      }
    }
    if ((isWorshipLocked || isBackendLocked) && selectedWorshipCenterObj) {
      return {
        name: selectedWorshipCenterObj.sabbath_class_name,
        location: selectedWorshipCenterObj.location_on_campus,
        pastor: selectedWorshipCenterObj.pastor_in_charge,
      };
    }
    if ((isWorshipLocked || isBackendLocked) && financeSummary?.worship_center) {
      return {
        name: financeSummary.worship_center.worship_center_name,
        location: financeSummary.worship_center.location_on_campus || "Main Campus",
        pastor: financeSummary.worship_center.pastor_in_charge || "TBA",
      };
    }
    return null;
  }, [
    isWorshipLocked,
    lockedWorshipCenterId,
    effectiveWorshipCenters,
    isBackendLocked,
    selectedWorshipCenterObj,
    financeSummary,
  ]);

  const mappedWorshipCenters = useMemo(() => {
    const selectedResId = selectedResidenceObj?.residenceid?.trim().toLowerCase();
    return effectiveWorshipCenters
      .filter((wc) => {
        if (String(wc.sabbath_class_id) === activeWorshipCenterId) return true;
        if (!selectedResId || !wc.residenceid) return true;
        return wc.residenceid.trim().toLowerCase() !== selectedResId;
      })
      .map((wc) => ({
        id: String(wc.sabbath_class_id),
        name: wc.sabbath_class_name,
        location: wc.location_on_campus,
        pastor: wc.pastor_in_charge,
        declaredCapacity: wc.declared_capacity,
        spacesLeft: wc.space_left,
        residenceid: wc.residenceid ?? null,
      }));
  }, [effectiveWorshipCenters, selectedResidenceObj, activeWorshipCenterId]);

  /** The hall's chapel ID to hide from the free-choice list in step 2. */
  const excludedWorshipCenterId = useMemo(() => {
    if (!selectedResidenceObj) return null;
    const wc = findHallWorshipCenter(selectedResidenceObj.residenceid, effectiveWorshipCenters);
    if (!wc) return null;
    if (String(wc.sabbath_class_id) === activeWorshipCenterId) return null;
    return String(wc.sabbath_class_id);
  }, [selectedResidenceObj, effectiveWorshipCenters, activeWorshipCenterId]);

  // ── Dynamic step navigation ───────────────────────────────────────────────
  //
  //  Internal step IDs:
  //    1 = Select Residence
  //    2 = Select Worship Center
  //    3 = Select Meal Plan      ← skipped when off-campus
  //    4 = Summary
  // ─────────────────────────────────────────────────────────────────────────

  const getNextStep = (step: number): number => {
    if (step === 1) return 2;
    if (step === 2) return isOffCampus ? 4 : 3;
    if (step === 3) return 4;
    return step;
  };

  const getPrevStep = (step: number): number => {
    if (step === 4) return isOffCampus ? 2 : 3;         // skip back over meal when off-campus
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
  const visibleSteps = useMemo((): StepDefinition[] => {
    return [
      { id: 1, title: "Select Residence" },
      { id: 2, title: "Select Worship Center" },
      { id: 3, title: "Select Meal Plan" },
      { id: 4, title: "Summary" },
    ].filter((s) => {
      if (s.id === 3 && isOffCampus) return false;     // off-campus → hide meal step
      return true;
    });
  }, [isOffCampus]);

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

  // ── Auto-select & lock from /api/v1/academics/financial-reg-summary ───────
  useEffect(() => {
    if (!isRestored || isLoading || hasAppliedSummaryRef.current) return;
    hasAppliedSummaryRef.current = true;

    if (!financeSummary) return;

    // 1. Auto-select Residence if present in summary
    if (financeSummary.semester_residence?.residence_name) {
      const targetName = financeSummary.semester_residence.residence_name.trim().toLowerCase();
      const matchRes = findCatalogResidence(effectiveResidences, targetName);
      if (matchRes) {
        setSelectedResidence(String(matchRes.qresidenceid));
      }
    }

    // 2. Auto-select Worship Center if present in summary
    if (financeSummary.worship_center?.worship_center_name) {
      const targetWc = financeSummary.worship_center.worship_center_name.trim().toLowerCase();
      const matchWc = effectiveWorshipCenters.find(
        (wc) => wc.sabbath_class_name.trim().toLowerCase() === targetWc
      );
      if (matchWc) {
        setSelectedWorshipCenterId(String(matchWc.sabbath_class_id));
      }
    }

    // 3. Auto-select Meal Plan if present in summary
    if (financeSummary.meal_type?.meal_type) {
      const targetMeal = financeSummary.meal_type.meal_type.trim().toLowerCase();
      const matchMeal = effectiveMealTypes.find(
        (m) =>
          m.selection.trim().toLowerCase() === targetMeal ||
          m.mealtype.trim().toLowerCase() === targetMeal
      );
      if (matchMeal) {
        setSelectedMealPlan(String(matchMeal.qselectionid));
      }
    }

    // 4. Sync lock state & step with lock_financial_reg from backend
    if (financeSummary.lock_financial_reg) {
      const stepParam = searchParams.get("step");
      const txRef = searchParams.get("transaction_reference") || searchParams.get("data");
      if (stepParam !== "5" && !txRef) {
        setCurrentStep(4);
      }
    } else {
      // Clear any stale local submission state if backend says lock_financial_reg is false
      setIsFinancialSubmitted(false);
      if (payState === "in_progress") {
        setPayState("not_started");
      }
    }
  }, [
    isRestored,
    isLoading,
    financeSummary,
    effectiveResidences,
    effectiveWorshipCenters,
    effectiveMealTypes,
    searchParams,
    payState,
    setIsFinancialSubmitted,
    setPayState,
  ]);

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
    if (isBackendLocked) return false;
    return (
      currentStep > 1 ||
      selectedResidence !== null ||
      selectedWorshipCenterId !== null ||
      selectedMealPlan !== null ||
      customAmount !== null
    );
  }, [isBackendLocked, currentStep, selectedResidence, selectedWorshipCenterId, selectedMealPlan, customAmount]);

  const handleResetProgress = async () => {
    if (isBackendLocked) return;
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
      if (isBackendLocked) return;
      if (id === selectedResidence) return;
      setSelectedResidence(id);
      const picked = effectiveResidences.find((r) => String(r.qresidenceid) === id);
      const pickedOffCampus =
        id === "OFF_CAMPUS" ||
        picked?.residenceid?.trim().toUpperCase() === "OC" ||
        Boolean(picked?.residencename?.toLowerCase().includes("off campus"));
      // Off-campus has no meal plan
      if (pickedOffCampus) {
        setSelectedMealPlan(null);
      }
      // Clear worship only if not locked and not pre-selected from backend summary
      if (!isWorshipLocked && !financeSummary?.worship_center) {
        setSelectedWorshipCenterId(null);
      }
    },
    [isBackendLocked, selectedResidence, effectiveResidences, isWorshipLocked, financeSummary]
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

  // ── Total computation & comparison with Amount Paid For Semester ──────────

  const computeTotal = () => {
    const mandatory = isFullSession
      ? financeData?.general_charges?.fullfees || 0
      : financeData?.general_charges?.fees || 0;
    const residenceCost = isOffCampus
      ? 0
      : isFullSession
      ? selectedResidenceObj?.full_charges ?? selectedResidenceObj?.charges ?? 0
      : selectedResidenceObj?.charges || 0;
    // Off-campus students have no meal plan
    const mealCost =
      !isOffCampus && selectedMealTypeObj
        ? getMealPlanPrice(selectedMealTypeObj.mealtype, financeData?.general_charges, isFullSession)
        : 0;
    return mandatory + residenceCost + mealCost;
  };

  const grossTotal = computeTotal();
  const amountPaidForSemester = studentFees?.amount_paid_for_semester ?? 0;
  const isSettledByPaidAmount = grossTotal > 0 && grossTotal <= amountPaidForSemester;
  const netAmountDue = Math.max(0, grossTotal - amountPaidForSemester);
  const payableAmount = customAmount ?? netAmountDue;

  useEffect(() => {
    if (isBackendLocked && isSettledByPaidAmount && payState !== "completed") {
      setPayState("completed");
    }
  }, [isBackendLocked, isSettledByPaidAmount, payState, setPayState]);

  // ── Financial submission ───────────────────────────────────────────────────

  const handleFullPayment = () => setIsFinancialConfirmOpen(true);

  const handleConfirmFinancialSubmit = async () => {
    if (!selectedResidenceObj || !selectedWorshipCenterObj) {
      toast.error("Please select your residence and worship center before submitting.");
      return;
    }

    // -1 is a display-only placeholder built from financial-reg-summary (which has no id).
    if (Number(selectedResidenceObj.qresidenceid) <= 0) {
      toast.error(
        "Your previously selected residence isn't in the current residence list. Please go back to Step 1 and pick a residence to submit."
      );
      return;
    }

    const mealTypeCode = isOffCampus
      ? "NONE"
      : selectedMealTypeObj
      ? deriveMealCode(selectedMealTypeObj.mealtype)
      : "";

    if (!isOffCampus && !mealTypeCode) {
      toast.error("Please select a meal plan before submitting.");
      return;
    }

    setIsSubmittingFinanceReg(true);
    try {
      const result = await submitFinanceRegistrationAction({
        qresidenceid: Number(selectedResidenceObj.qresidenceid),
        meal_type: mealTypeCode,
        sabbath_class_id: Number(selectedWorshipCenterObj.sabbath_class_id),
      });

      if (!result.success) {
        toast.error(result.error || "Failed to submit financial registration.");
        return;
      }

      toast.success(result.message || "Financial registration submitted successfully!");

      // Apply 2-year worship lock on successful submission
      if (selectedWorshipCenterId && !isWorshipLocked) {
        setWorshipCenterLock(selectedWorshipCenterId, Date.now() + TWO_YEARS_MS);
      }

      // Lock selections and refresh summary + student fee ledger
      markAsLocked();
      await refreshSummaryAndFees();

      if (isSettledByPaidAmount) {
        setPayState("completed");
        setIsFinancialSubmitted(false);
      } else {
        setIsFinancialSubmitted(true);
        setPayState("in_progress");
      }

      // Close modal and return to Step 4 (Summary view)
      setIsFinancialConfirmOpen(false);
      setCurrentStep(4);
    } finally {
      setIsSubmittingFinanceReg(false);
    }
  };

  const handleProceedToPayment = () => {
    setIsFinancialSuccessOpen(false);
    setCustomAmount(null);
    setCurrentStep(5);
  };

  const handleViewPaymentReceipt = () => {
    setPayState("completed");
    setIsFinancialSubmitted(false);
    clearOfflineDraft(OFFLINE_FINANCE_REG_KEY).catch(() => {});
    router.push(
      `/dashboard/finance/fees/payment/result?status=success&ref=PAY-${Date.now().toString(36).toUpperCase()}&amount=${grossTotal}&gateway=Wallet`
    );
  };

  const handleCancelPayment = () => {
    setCustomAmount(null);
    setCurrentStep(4);
  };

  const handlePayNow = () => {
    setIsProcessing(true);
    const total = payableAmount;
    setTimeout(() => {
      setIsProcessing(false);
      setStoreWalletBalance(Math.max(0, walletBalance - total));
      setPayState("completed");
      setIsFinancialSubmitted(false);
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
            onStepClick={handleChangeStep}
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
            residences={effectiveResidences}
            isLoading={isLoading}
            error={error}
            isFullSession={isFullSession}
            isLocked={isBackendLocked}
          />
        )}

        {/* Step 2: Worship Center — shown for ALL residence types (including off-campus),
            but put into locked read-only mode when a 2-year lock or backend lock is active. */}
        {currentStep === 2 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={(id) => {
              if (!isBackendLocked) setSelectedWorshipCenterId(id);
            }}
            worshipCenters={mappedWorshipCenters}
            isLoading={isLoading}
            error={error}
            isLocked={isWorshipLocked || isBackendLocked}
            lockedUntil={isWorshipLocked ? worshipCenterLockedUntil : null}
            lockedCenter={lockedWCDetails}
            excludedId={excludedWorshipCenterId}
            selectedResidenceId={selectedResidenceObj?.residenceid ?? null}
          />
        )}

        {/* Step 3: Meal Plan — only shown for on-campus students.
            The isOffCampus guard here is the last line of defence: even if
            navigation somehow reaches step 3 for an off-campus student, we
            render nothing and the safety-net useEffect will advance to step 4. */}
        {currentStep === 3 && !isOffCampus && (
          <SelectMealPlan
            selectedId={selectedMealPlan}
            onSelect={(id) => {
              if (!isBackendLocked) setSelectedMealPlan(id);
            }}
            mealTypes={effectiveMealTypes.filter((m) => !m.selection.toLowerCase().includes("off campus"))}
            generalCharges={financeData?.general_charges || null}
            isLoading={isLoading}
            error={error}
            isFullSession={isFullSession}
            isLocked={isBackendLocked}
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
            isFullSession={isFullSession}
            isLocked={isBackendLocked}
            amountPaidForSemester={amountPaidForSemester}
          />
        )}

        {currentStep === 5 && (
          <WalletPayment
            walletBalance={walletBalance}
            balanceUnavailable={!!walletError}
            onRetryBalance={() => fetchBalance()}
            totalAmount={payableAmount}
studentName={studentName}
            academicInfo={academicInfo}
            onCancelPayment={handleCancelPayment}
            onPayNow={handlePayNow}
            onFundWallet={() => setIsFundWalletModalOpen(true)}
            onViewSelection={() => setCurrentStep(4)}
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
              className="rounded-[10px] h-11 px-4 md:px-6 text-[14px] font-medium transition-all gap-2 bg-[#f6f8fa] dark:bg-gray-800 text-[#525866] dark:text-gray-300 border-transparent hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline-block">Previous</span>
            </Button>
            <div className="flex-1 md:flex-none flex items-center justify-end pl-3 md:pl-0">
              <Button
                onClick={() => {
                  if (!isBackendLocked) {
                    handleFullPayment();
                  } else if (isSettledByPaidAmount) {
                    handleViewPaymentReceipt();
                  } else {
                    handleProceedToPayment();
                  }
                }}
                className="w-full md:w-auto rounded-[10px] h-11 px-6 md:px-8 text-[14px] font-medium bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8] text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>
                  {!isBackendLocked
                    ? "Submit selection"
                    : isSettledByPaidAmount
                    ? "View Payment Receipt"
                    : "Proceed to Payment"}
                </span>
                {isBackendLocked ? <ChevronRight className="w-4 h-4" /> : null}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PartialPaymentModal
        isOpen={isPartialPaymentOpen}
        onClose={() => setIsPartialPaymentOpen(false)}
        totalAmount={grossTotal}
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
        onStepClick={handleChangeStep}
      />

      <FundWalletModal
        isOpen={isFundWalletModalOpen}
        onClose={() => setIsFundWalletModalOpen(false)}
        defaultAmount={Math.max(0, payableAmount - walletBalance) || undefined}
        returnPath={`/dashboard/finance/fees/payment?type=${paymentType || "semester"}&step=5`}
        onSuccess={() => fetchBalance()}
/>

      <FinancialConfirmationModal
        isOpen={isFinancialConfirmOpen}
        onClose={() => {
          if (!isSubmittingFinanceReg) setIsFinancialConfirmOpen(false);
        }}
        onConfirm={handleConfirmFinancialSubmit}
        studentName={studentName}
        isLoading={isSubmittingFinanceReg}
      />

      <FinancialSuccessModal
        isOpen={isFinancialSuccessOpen}
        onClose={() => setIsFinancialSuccessOpen(false)}
        onPrimaryAction={handleProceedToPayment}
        walletBalance={walletBalance}
        isOffCampus={isOffCampus}
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
