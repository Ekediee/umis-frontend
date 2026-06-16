"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveOfflineDraft, getOfflineDraft, clearOfflineDraft, OFFLINE_COURSE_CART_KEY } from "@/lib/offline-storage";
import { WebStepper } from "@/components/registration/web-stepper";
import { MobileFlowHeader } from "@/components/registration/mobile-flow-header";
import { MobileProgressSheet } from "@/components/registration/mobile-progress-sheet";
import { BottomActionBar } from "@/components/registration/bottom-action-bar";
import { SelectClassGroup } from "@/components/registration/steps/select-class-group";
import { SelectCourses } from "@/components/registration/steps/select-courses";
import { Summary } from "@/components/registration/steps/summary";
import { ConfirmationModal, SuccessModal, FailureModal } from "@/components/registration/registration-status-modals";
import { OutstandingPayment } from "@/components/registration/outstanding-payment";
import { getClassGroupsAction, getCoursesAction, type ClassGroup, type CourseItem } from "@/app/actions/registration";

export default function RegistrationCoursesFlow() {
  const router = useRouter();
  
  // Mock State to simulate outstanding payment scenario
  const [hasOutstandingPayment] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
  // Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  
  // Step 1 — Class group fetch state
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [hasManyClassOptions, setHasManyClassOptions] = useState(true);
  const [classGroupsLoading, setClassGroupsLoading] = useState(true);
  const [classGroupsError, setClassGroupsError] = useState<string | null>(null);

  // Step 1 — Selection state (stores the group id as a string)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchClassGroups() {
      setClassGroupsLoading(true);
      setClassGroupsError(null);
      const result = await getClassGroupsAction();
      console.log("groups", result);
      if (cancelled) return;
      if (result.error) {
        setClassGroupsError(result.error);
      } else {
        const groups = result.data ?? [];
        setClassGroups(groups);
        setHasManyClassOptions(result.hasMany ?? true);

        // If there is only one class option, auto-select it and jump straight
        // to step 2 so the student doesn't see a single-item picker.
        if (!result.hasMany && groups.length === 1) {
          setSelectedGroup(groups[0].id);
          setCurrentStep(2);
        }
      }
      setClassGroupsLoading(false);
    }
    fetchClassGroups();
    return () => { cancelled = true; };
  }, []);

  // Step 2 — Course fetch state
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Step 2 — Selection state (starts empty; no mock defaults)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  const totalSteps = 3;

  // Fetch courses whenever the selected class group changes
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
      } else {
        setCourses(result.data ?? []);
      }
      setCoursesLoading(false);
    }
    fetchCourses();
    return () => { cancelled = true; };
  }, [selectedGroup]);

  // Offline Draft Logic
  useEffect(() => {
    // Load draft on mount
    const loadDraft = async () => {
      const draft = await getOfflineDraft<{ group: string | null; courses: string[] }>(OFFLINE_COURSE_CART_KEY);
      if (draft) {
        if (draft.group) setSelectedGroup(draft.group);
        if (draft.courses && draft.courses.length > 0) setSelectedCourseIds(draft.courses);
        toast.info("Offline draft loaded", { description: "Your previous selections have been restored." });
      }
    };
    loadDraft();

    // Network listeners
    const handleOffline = () => toast.warning("You are offline", { description: "Your course selections will be saved as a draft." });
    const handleOnline = () => {
      toast.success("Back online", { description: "Your drafts have been synchronized." });
      // Here you would trigger real sync to backend if needed, or handle conflicts.
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Save to draft whenever selections change
  useEffect(() => {
    saveOfflineDraft(OFFLINE_COURSE_CART_KEY, { group: selectedGroup, courses: selectedCourseIds });
  }, [selectedGroup, selectedCourseIds]);

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
    // When there is only one class option the student was auto-advanced to
    // step 2, so step 1 is not navigable. Clamp the minimum to 2 in that case.
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Select Class Group";
      case 2: return "Select Courses";
      case 3: return "Summary";
      default: return "Registration";
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    // Mocking an API call
    setTimeout(async () => {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      
      // Check network status - handle offline gracefully
      if (!navigator.onLine) {
         toast.error("Offline Submission", { description: "You are currently offline. Your registration has been saved as a draft and will submit when you reconnect." });
         return;
      }
      
      // On success, clear the draft
      await clearOfflineDraft(OFFLINE_COURSE_CART_KEY);
      // For now, always show success modal
      setIsSuccessModalOpen(true);
    }, 1500); // Increased delay for better UX
  };

  if (hasOutstandingPayment) {
    return (
      <div className="flex flex-col min-h-full h-full bg-white dark:bg-black md:bg-transparent relative pt-6 md:pt-0">
        <OutstandingPayment />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full h-full bg-white dark:bg-black md:bg-transparent relative">
      {/* Web Stepper (Hidden on mobile) */}
      <div className="hidden md:block">
        <WebStepper currentStep={currentStep} />
      </div>

      {/* Mobile Header (Hidden on desktop) */}
      <MobileFlowHeader 
        currentStep={currentStep}
        totalSteps={totalSteps}
        title={getStepTitle()}
        onProgressClick={() => setIsMobileSheetOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-4 flex flex-col items-center">
        {currentStep === 1 && (
          <SelectClassGroup
            selectedGroup={selectedGroup}
            onSelectGroup={setSelectedGroup}
            classGroups={classGroups}
            isLoading={classGroupsLoading}
            error={classGroupsError}
          />
        )}
        
        {currentStep === 2 && (
          <SelectCourses
            courses={courses}
            isLoading={coursesLoading}
            error={coursesError}
            selectedCourseIds={selectedCourseIds}
            onToggleCourse={toggleCourse}
          />
        )}

        {currentStep === 3 && (
          <Summary 
            selectedGroup={selectedGroup}
            selectedCourseIds={selectedCourseIds}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar 
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrevious={handlePrevious}
        onNext={handleNext}
        nextLabel={currentStep === 1 ? "Select Courses" : currentStep === 2 ? "Summary" : "Submit Registration"}
        isNextDisabled={
          (currentStep === 1 && !selectedGroup) || 
          (currentStep === 2 && selectedCourseIds.length === 0)
        }
      />

      {/* Mobile Progress Bottom Sheet */}
      <MobileProgressSheet 
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        currentStep={currentStep}
      />
      
      {/* Status Modals */}
      <ConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        isLoading={isSubmitting}
      />
      
      <SuccessModal 
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      />
      
      <FailureModal 
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        onConfirm={handleConfirmSubmit} // Retry
      />
    </div>
  );
}
