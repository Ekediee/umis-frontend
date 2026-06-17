"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  getClassGroupsAction, 
  getCoursesAction, 
  type ClassGroup, 
  type CourseItem 
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
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;

  // Step 2: Course Selection States
  courses: CourseItem[];
  coursesLoading: boolean;
  coursesError: string | null;
  selectedCourseIds: string[];
  setSelectedCourseIds: (ids: string[]) => void;
  toggleCourse: (id: string) => void;

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

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // Outstanding payment configuration
  const [hasOutstandingPayment] = useState(false);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const totalSteps = 3;

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
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Courses state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const MAX_UNITS = 23;

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
          setSelectedGroup(groups[0].id);
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

  // Fetch Courses when selectedGroup changes
  useEffect(() => {
    if (!selectedGroup) return;
    let cancelled = false;
    async function fetchCourses() {
      setCoursesLoading(true);
      setCoursesError(null);
      const result = await getCoursesAction(selectedGroup!);
      if (cancelled) return;
      if (result.error) {
        setCoursesError(result.error);
        toast.error(result.error);
      } else {
        setCourses(result.data?.courses ?? []);
        if (result.message) {
          toast.success(result.message);
        }
      }
      setCoursesLoading(false);
    }
    fetchCourses();
    return () => { cancelled = true; };
  }, [selectedGroup]);

  // Load draft from Offline Storage on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getOfflineDraft<{ group: string | null; courses: string[] }>(OFFLINE_COURSE_CART_KEY);
      if (draft) {
        if (draft.group) setSelectedGroup(draft.group);
        if (draft.courses && draft.courses.length > 0) setSelectedCourseIds(draft.courses);
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

  // Save to draft whenever selectedGroup or selectedCourseIds changes
  useEffect(() => {
    if (selectedGroup !== null || selectedCourseIds.length > 0) {
      saveOfflineDraft(OFFLINE_COURSE_CART_KEY, { group: selectedGroup, courses: selectedCourseIds });
    }
  }, [selectedGroup, selectedCourseIds]);

  // Actions
  const handleNext = () => {
    if (currentStep === totalSteps) {
      setIsConfirmModalOpen(true);
      return;
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

  const toggleCourse = (id: string) => {
    setSelectedCourseIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(async () => {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      
      if (!navigator.onLine) {
        toast.error("Offline Submission", { 
          description: "You are currently offline. Your registration has been saved as a draft and will submit when you reconnect." 
        });
        return;
      }
      
      await clearOfflineDraft(OFFLINE_COURSE_CART_KEY);
      setIsSuccessModalOpen(true);
    }, 1500);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Class Group";
      case 2: return "Select Courses";
      case 3: return "Summary";
      default: return "Registration";
    }
  };

  // Derived Values
  const selectedCourses = courses.filter(c => selectedCourseIds.includes(c.id));
  const totalUnits = selectedCourses.reduce((sum, c) => sum + c.units, 0);

  const isNextDisabled = 
    (currentStep === 1 && !selectedGroup) ||
    (currentStep === 2 && selectedCourseIds.length === 0);

  const nextLabel = 
    currentStep === 1 ? "Select Courses" : 
    currentStep === 2 ? "Summary" : 
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
        selectedGroup,
        setSelectedGroup,
        courses,
        coursesLoading,
        coursesError,
        selectedCourseIds,
        setSelectedCourseIds,
        toggleCourse,
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
