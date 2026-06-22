"use client";

import { WebStepper } from "@/components/registration/web-stepper";
import { MobileFlowHeader } from "@/components/registration/mobile-flow-header";
import { MobileProgressSheet } from "@/components/registration/mobile-progress-sheet";
import { BottomActionBar } from "@/components/registration/bottom-action-bar";
import { SelectClassGroup } from "@/components/registration/steps/select-class-group";
import { SelectCourses } from "@/components/registration/steps/select-courses";
import { SelectWorshipCenter } from "@/components/registration/steps/select-worship-center";
import { Summary } from "@/components/registration/steps/summary";
import { ConfirmationModal, SuccessModal, FailureModal } from "@/components/registration/registration-status-modals";
import { OutstandingPayment } from "@/components/registration/outstanding-payment";
import { RegistrationProvider, useRegistration } from "@/components/providers/registration-provider";

function RegistrationCoursesFlowContent() {
  const {
    currentStep,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    isFailureModalOpen,
    setIsFailureModalOpen,
    isSubmitting,
    handleConfirmSubmit,
    hasOutstandingPayment,
    selectedWorshipCenterId,
    setSelectedWorshipCenterId,
  } = useRegistration();

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
        <WebStepper />
      </div>

      {/* Mobile Header (Hidden on desktop) */}
      <MobileFlowHeader />

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 py-6 md:py-4 flex flex-col items-center">
        {currentStep === 1 && <SelectClassGroup />}
        
        {currentStep === 2 && <SelectCourses />}

        {currentStep === 3 && (
          <SelectWorshipCenter
            selectedId={selectedWorshipCenterId}
            onSelect={setSelectedWorshipCenterId}
          />
        )}

        {currentStep === 4 && <Summary />}
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar />

      {/* Mobile Progress Bottom Sheet */}
      <MobileProgressSheet />
      
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

export default function RegistrationCoursesFlow() {
  return (
    <RegistrationProvider>
      <RegistrationCoursesFlowContent />
    </RegistrationProvider>
  );
}
