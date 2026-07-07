"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  getClassGroupsAction, 
  getCoursesAction, 
  getWorshipCentersAction,
  submitCourseSelectionAction,
  type ClassGroup, 
  type CourseItem,
  type RawCourse,
  type WorshipCenter
} from "@/app/actions/registration";
import { 
  saveOfflineDraft, 
  getOfflineDraft, 
  clearOfflineDraft, 
  OFFLINE_COURSE_CART_KEY 
} from "@/lib/offline-storage";

interface RegistrationContextType {
  // Steps and navigation
  currentStep: number;
  totalSteps: number;
  setCurrentStep: (step: number) => void;
  getStepTitle: () => string;
  handleNext: () => void;
  handlePrevious: () => void;

  // Step 1: Class Group States
  classGroups: ClassGroup[];
  hasManyClassOptions: boolean;
  classGroupsLoading: boolean;
  classGroupsError: string | null;
  selectedGroups: string[];
  toggleGroup: (id: string) => void;

  // Step 2: Course Selection States
  courses: CourseItem[];
  coursesLoading: boolean;
  coursesError: string | null;
  selectedCourseIds: string[];
  setSelectedCourseIds: (ids: string[]) => void;
  toggleCourse: (id: string) => void;

  // Step 3: Worship Center
  worshipCenters: WorshipCenter[];
  worshipCentersLoading: boolean;
  worshipCentersError: string | null;
  selectedWorshipCenterId: string | null;
  setSelectedWorshipCenterId: (id: string | null) => void;

  // Modals & Submission States
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (open: boolean) => void;
  isSuccessModalOpen: boolean;
  setIsSuccessModalOpen: (open: boolean) => void;
  isFailureModalOpen: boolean;
  setIsFailureModalOpen: (open: boolean) => void;
  isSubmitting: boolean;
  handleConfirmSubmit: () => void;

  // Derived properties
  selectedCourses: CourseItem[];
  totalUnits: number;
  MAX_UNITS: number;
  isNextDisabled: boolean;
  nextLabel: string;

  // Additional states (outstanding payment support)
  hasOutstandingPayment: boolean;
  isMobileSheetOpen: boolean;
  setIsMobileSheetOpen: (open: boolean) => void;
}

export const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Outstanding payment configuration
  const [hasOutstandingPayment] = useState(false);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const totalSteps = 4;

  // Modals state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Class groups state
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [hasManyClassOptions, setHasManyClassOptions] = useState(true);
  const [classGroupsLoading, setClassGroupsLoading] = useState(true);
  const [classGroupsError, setClassGroupsError] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Worship center state
  const [worshipCenters, setWorshipCenters] = useState<WorshipCenter[]>([]);
  const [worshipCentersLoading, setWorshipCentersLoading] = useState(true);
  const [worshipCentersError, setWorshipCentersError] = useState<string | null>(null);
  const [selectedWorshipCenterId, setSelectedWorshipCenterId] = useState<string | null>(null);

  const MAX_UNITS = 23;
  const MIN_UNITS = 12;

  // Raw courses — kept for submission payload (includes fields dropped by normalisation)
  const [rawCourses, setRawCourses] = useState<RawCourse[]>([]);

  // Fetch Class Groups on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchClassGroups() {
      setClassGroupsLoading(true);
      setClassGroupsError(null);
      const result = await getClassGroupsAction();
      if (cancelled) return;
      if (result.error) {
        setClassGroupsError(result.error);
        toast.error(result.error);
      } else {
        const groups = result.data ?? [];
        setClassGroups(groups);
        setHasManyClassOptions(result.hasMany ?? true);

        // Auto-advance if only one group option
        if (!result.hasMany && groups.length === 1) {
          setSelectedGroups([groups[0].id]);
          // Fetch courses immediately for the single auto-selected group
          setCoursesLoading(true);
          setCoursesError(null);
          const coursesResult = await getCoursesAction([groups[0].id]);
          if (coursesResult.error) {
            setCoursesError(coursesResult.error);
            toast.error(coursesResult.error);
          } else {
            setCourses(coursesResult.data?.courses ?? []);
            setRawCourses(coursesResult.data?.rawCourses ?? []);
          }
          setCoursesLoading(false);
          setCurrentStep(2);
        }
        if (result.message) {
          toast.success(result.message);
        }
      }
      setClassGroupsLoading(false);
    }
    fetchClassGroups();
    return () => { cancelled = true; };
  }, []);

  // Fetch Worship Centers on mount
  useEffect(() => {
    let cancelled = false;
    async function fetchWorshipCenters() {
      setWorshipCentersLoading(true);
      setWorshipCentersError(null);
      const result = await getWorshipCentersAction();
      // Always clear the loading state, even if the effect was cleaned up
      if (!cancelled) {
        if (result.error) {
          setWorshipCentersError(result.error);
          toast.error(result.error);
        } else {
          setWorshipCenters(result.data ?? []);
        }
        setWorshipCentersLoading(false);
      } else {
        // Effect was cleaned up (Strict Mode double-invocation) but we still
        // need loading to resolve for the second run.
        setWorshipCentersLoading(false);
      }
    }
    fetchWorshipCenters();
    return () => { cancelled = true; };
  }, []);

  // Courses are NOT fetched reactively — they are fetched on demand
  // when the user clicks "Select Courses" (see handleNext below).

  // Load draft from Offline Storage on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getOfflineDraft<{ groups: string[]; courses: string[], worshipCenter: string | null }>(OFFLINE_COURSE_CART_KEY);
      if (draft) {
        if (draft.groups && draft.groups.length > 0) setSelectedGroups(draft.groups);
        if (draft.courses && draft.courses.length > 0) setSelectedCourseIds(draft.courses);
        if (draft.worshipCenter) setSelectedWorshipCenterId(draft.worshipCenter);
        toast.info("Offline draft loaded", { description: "Your previous selections have been restored." });
      }
    };
    loadDraft();

    // Browser network listeners
    const handleOffline = () => toast.warning("You are offline", { description: "Your course selections will be saved as a draft." });
    const handleOnline = () => {
      toast.success("Back online", { description: "Your drafts have been synchronized." });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Save to draft whenever selectedGroups, selectedCourseIds, or selectedWorshipCenterId changes
  useEffect(() => {
    if (selectedGroups.length > 0 || selectedCourseIds.length > 0 || selectedWorshipCenterId !== null) {
      saveOfflineDraft(OFFLINE_COURSE_CART_KEY, { groups: selectedGroups, courses: selectedCourseIds, worshipCenter: selectedWorshipCenterId });
    }
  }, [selectedGroups, selectedCourseIds, selectedWorshipCenterId]);

  // Actions
  const handleNext = async () => {
    if (currentStep === totalSteps) {
      setIsConfirmModalOpen(true);
      return;
    }
    // Step 1 → Step 2: fetch courses for all selected groups before advancing
    if (currentStep === 1) {
      setCoursesLoading(true);
      setCoursesError(null);
      const result = await getCoursesAction(selectedGroups);
      if (result.error) {
        setCoursesError(result.error);
        toast.error(result.error);
        setCoursesLoading(false);
        return; // Don't advance if fetch failed
      }
      setCourses(result.data?.courses ?? []);
      setRawCourses(result.data?.rawCourses ?? []);
      if (result.message) toast.success(result.message);
      setCoursesLoading(false);
    }
    // Step 2 → Step 3: check for duplicate course codes before advancing
    if (currentStep === 2) {
      const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
      const codeCounts = new Map<string, number>();
      const duplicates: string[] = [];

      for (const course of selectedCourses) {
        const code = course.code.trim().toUpperCase();
        const count = (codeCounts.get(code) || 0) + 1;
        codeCounts.set(code, count);
        if (count === 2) {
          duplicates.push(course.code.trim());
        }
      }

      if (duplicates.length > 0) {
        toast.error("Cannot select duplicate course codes", {
          description: `You have selected duplicate options for: ${duplicates.join(", ")}. Please select only one option per course.`,
        });
        return; // Don't advance if validation fails
      }
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    const minStep = hasManyClassOptions ? 1 : 2;
    if (currentStep > minStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleGroup = (id: string) => {
    setSelectedGroups(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleConfirmSubmit = async () => {
    if (!navigator.onLine) {
      toast.error("Offline Submission", {
        description:
          "You are currently offline. Your registration has been saved as a draft and will submit when you reconnect.",
      });
      return;
    }

    if (!selectedWorshipCenterId) {
      toast.error("No worship center selected", {
        description: "Please go back and select a worship center.",
      });
      return;
    }

    setIsSubmitting(true);
    setIsConfirmModalOpen(false);

    // Build the courses payload from raw API data (preserves fields dropped during normalisation)
    const coursesToSubmit = rawCourses.filter((r) =>
      selectedCourseIds.includes(String(r.qcourseid))
    );

    const result = await submitCourseSelectionAction({
      worship_center_id: selectedWorshipCenterId,
      max_credit_unit: MAX_UNITS,
      min_credit_unit: MIN_UNITS,
      courses: coursesToSubmit.map((r) => ({
        courseid: r.courseid,
        coursename: r.coursename,
        creditunit: r.creditunit,
        credithours: r.credithours,
        lecturehours: r.lecturehours,
        yeartaken: r.yeartaken,
        qcourseid: r.qcourseid,
      })),
    });

    setIsSubmitting(false);

    if (result.error) {
      toast.error("Submission Failed", { description: result.error });
      setIsFailureModalOpen(true);
    } else {
      await clearOfflineDraft(OFFLINE_COURSE_CART_KEY);
      toast.success(result.message ?? "Registration submitted successfully");
      setIsSuccessModalOpen(true);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Class Group";
      case 2: return "Select Courses";
      case 3: return "Select Worship Center";
      case 4: return "Summary";
      default: return "Registration";
    }
  };

  // Derived Values
  const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
  const totalUnits = selectedCourses.reduce((sum, c) => sum + c.units, 0);

  const isNextDisabled = 
    (currentStep === 1 && (selectedGroups.length === 0 || coursesLoading)) ||
    (currentStep === 2 && selectedCourseIds.length === 0) ||
    (currentStep === 3 && !selectedWorshipCenterId);

  const nextLabel = 
    currentStep === 1 ? "Select Courses" : 
    currentStep === 2 ? "Select Worship Center" : 
    currentStep === 3 ? "Summary" : 
    "Submit Registration";

  return (
    <RegistrationContext.Provider
      value={{
        currentStep,
        totalSteps,
        setCurrentStep,
        getStepTitle,
        handleNext,
        handlePrevious,
        classGroups,
        hasManyClassOptions,
        classGroupsLoading,
        classGroupsError,
        selectedGroups,
        toggleGroup,
        courses,
        coursesLoading,
        coursesError,
        selectedCourseIds,
        setSelectedCourseIds,
        toggleCourse,
        worshipCenters,
        worshipCentersLoading,
        worshipCentersError,
        selectedWorshipCenterId,
        setSelectedWorshipCenterId,
        isConfirmModalOpen,
        setIsConfirmModalOpen,
        isSuccessModalOpen,
        setIsSuccessModalOpen,
        isFailureModalOpen,
        setIsFailureModalOpen,
        isSubmitting,
        handleConfirmSubmit,
        selectedCourses,
        totalUnits,
        MAX_UNITS,
        isNextDisabled,
        nextLabel,
        hasOutstandingPayment,
        isMobileSheetOpen,
        setIsMobileSheetOpen
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
}
