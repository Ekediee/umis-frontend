"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WebStepper } from "@/components/registration/web-stepper";
import { MobileFlowHeader } from "@/components/registration/mobile-flow-header";
import { MobileProgressSheet } from "@/components/registration/mobile-progress-sheet";
import { BottomActionBar } from "@/components/registration/bottom-action-bar";
import { SelectClassGroup } from "@/components/registration/steps/select-class-group";
import { SelectCourses } from "@/components/registration/steps/select-courses";
import { Summary } from "@/components/registration/steps/summary";
import { ConfirmationModal, SuccessModal, FailureModal } from "@/components/registration/registration-status-modals";
import { OutstandingPayment } from "@/components/registration/outstanding-payment";
import { getClassGroupsAction, type ClassGroup } from "@/app/actions/registration";

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
      if (cancelled) return;
      if (result.error) {
        setClassGroupsError(result.error);
      } else {
        setClassGroups(result.data ?? []);
      }
      setClassGroupsLoading(false);
    }
    fetchClassGroups();
    return () => { cancelled = true; };
  }, []);

  // Step 2 State (Mock compulsory defaults usually passed in)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(["co1", "co2", "1", "2", "3", "4", "5", "6"]);

  const totalSteps = 3;

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
    if (currentStep > 1) {
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
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmModalOpen(false);
      // For now, always show success modal
      setIsSuccessModalOpen(true);
    }, 1500); // Increased delay for better UX
  };

  if (hasOutstandingPayment) {
    return (
      <div className="flex flex-col min-h-full h-full bg-white md:bg-transparent relative pt-6 md:pt-0">
        <OutstandingPayment />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full h-full bg-white md:bg-transparent relative">
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
      <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-12 flex flex-col items-center">
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
