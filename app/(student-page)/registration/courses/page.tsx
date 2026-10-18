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
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getHasSubmittedCoursesAction } from "@/app/actions/registration";
import { useRegistrationStore } from "@/hooks/use-registration-store";

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
    setCurrentStep,
  } = useRegistration();
  const router = useRouter();

  // Guard: students who already submitted courses shouldn't re-run the flow
  // (e.g. by opening /registration/courses directly).
  useEffect(() => {
    let cancelled = false;
    getHasSubmittedCoursesAction()
      .then((result) => {
        if (cancelled) return;
        const { regState, setRegState } = useRegistrationStore.getState();
        if (result.data?.hasSubmitted) {
          setRegState("completed");
          toast.info("You have already submitted your courses", {
            description: "Showing your submitted course form.",
          });
          router.replace("/dashboard/registration/course-form");
        } else if (result.data && regState === "completed") {
          // Stale local flag — the backend says nothing was submitted
          setRegState("in_progress");
        } else if (result.error) {
          // Fail open: don't block registration if the check itself fails
          console.error("Could not verify course submission status:", result.error);
        }
      })
      .catch((err) => console.error("Could not verify course submission status:", err));
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (hasOutstandingPayment) {
    return (
      <div className="flex flex-col min-h-full h-full bg-white dark:bg-black md:bg-transparent relative pt-6 md:pt-0">
        <OutstandingPayment />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full h-full bg-white dark:bg-black md:bg-transparent relative overflow-y-auto">
      {/* Web Stepper (Hidden on mobile) */}
      <div className="hidden md:block">
        <WebStepper />
      </div>

      {/* Mobile Header (Hidden on desktop) */}
      <MobileFlowHeader />

      {/* Main Content Area */}
      <div className="flex-1 w-full px-4 md:px-8 pt-6 pb-28 md:pt-4 md:pb-32 flex flex-col items-center">
        {currentStep === 1 && <SelectClassGroup />}
        
        {currentStep === 2 && <SelectCourses />}

        {currentStep === 3 && <Summary />}
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
        // "Edit Selected Courses": back to the Select Courses step
        onEdit={() => {
          setIsConfirmModalOpen(false);
          setCurrentStep(2);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
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
