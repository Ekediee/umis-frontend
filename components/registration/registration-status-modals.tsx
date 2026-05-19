import React, { useEffect } from "react";
import { AlertCircle, CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

const Overlay = ({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center md:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      {children}
    </div>
  );
};

interface BaseModalProps {
  isOpen: boolean;
  onClose?: () => void;
  icon: React.ElementType;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  description: React.ReactNode;
  primaryActionText: string;
  secondaryActionText: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
}

function BaseModal({
  isOpen,
  onClose,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  title,
  description,
  primaryActionText,
  secondaryActionText,
  onPrimaryAction,
  onSecondaryAction,
  isLoading = false
}: BaseModalProps) {
  if (!isOpen) return null;

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-md:absolute max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-[24px] max-md:pb-safe bg-white dark:bg-gray-900 md:max-w-[440px] md:rounded-[16px] rounded-t-[24px] rounded-b-none shadow-[0px_16px_32px_-12px_rgba(88,92,95,0.1)] flex flex-col relative z-10 animate-in slide-in-from-bottom duration-300 md:animate-in md:zoom-in-95 ">
        
        {/* Mobile Drag Handle & Close Button */}
        <div className="md:hidden w-full relative pt-3 pb-2 flex justify-center items-center">
          <div className="w-[80px] h-[6px] bg-[#e5e7eb] dark:bg-gray-800 rounded-[100px]" />
          {onClose && (
            <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-[20px] max-md:pt-[24px] flex flex-col items-center gap-[16px]">
          <div className={`${iconBgClass} p-[12px] rounded-[15px] flex items-center justify-center shrink-0`}>
            <Icon className={`w-[24px] h-[24px] ${iconColorClass}`} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-center gap-[8px] text-center w-full px-2">
            <h3 className="font-medium text-[20px] leading-[1.2] tracking-[-0.22px] text-[#0A0D14] dark:text-gray-100">
              {title}
            </h3>
            <div className="font-normal text-[14px] leading-[1.618] text-[#525866] dark:text-gray-300">
              {description}
            </div>
          </div>
        </div>
        
        <div className=" max-md:border-t-0 md:border-t border-[#E2E4E9] dark:border-gray-800 px-[20px] py-[20px] flex w-full">
          <div className="flex flex-col flex-wrap md:flex-row gap-[12px] h-[104px] md:h-[44px] w-full">
            <Button 
              variant="outline" 
              className="flex-1 rounded-[10px] h-[44px] border-[#E2E4E9] dark:border-gray-700 text-[#525866] dark:text-gray-300 dark:hover:bg-gray-800 max-md:order-1"
              onClick={onSecondaryAction}
              disabled={isLoading}
            >
              {secondaryActionText}
            </Button>
            <Button 
              className="flex-1 rounded-[10px] h-[44px] bg-[#003399] dark:bg-[#2563EB] text-white hover:bg-[#003399]/90 dark:hover:bg-[#1D4ED8] max-md:order-2"
              onClick={onPrimaryAction}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : primaryActionText}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}

export function ConfirmationModal({ isOpen, onClose, onConfirm, isLoading }: ModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={AlertCircle}
      iconBgClass="bg-[#FEF3EB] dark:bg-[#F97316]/20"
      iconColorClass="text-[#F97316] dark:text-[#f89856]"
      title="Are you sure you want to submit?"
      description={
        <p>
          By clicking <span className="font-semibold text-[#0a0d14] dark:text-gray-100">Confirm & Submit</span>, you agree that the information above is accurate and you understand that changes cannot be made after submission without administrative approval from your departmental advisor.
        </p>
      }
      primaryActionText="Confirm & Submit"
      secondaryActionText="Edit Selected Courses"
      onPrimaryAction={onConfirm}
      onSecondaryAction={onClose}
      isLoading={isLoading}
    />
  );
}

export function SuccessModal({ isOpen, onClose }: ModalProps) {
  const router = useRouter();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={CheckCircle}
      iconBgClass="bg-[#EFFAF6] dark:bg-[#38C793]/20"
      iconColorClass="text-[#38C793] dark:text-[#4ade80]"
      title="Course Registration Submitted Successfully"
      description={
        <p>You have successfully registered your courses for the semester.</p>
      }
      primaryActionText="Return to Dashboard"
      secondaryActionText="View Registered Courses"
      onPrimaryAction={() => router.push("/registration")}
      onSecondaryAction={() => router.push("/registration/courses")}
    />
  );
}

export function FailureModal({ isOpen, onClose, onConfirm }: ModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      icon={XCircle}
      iconBgClass="bg-[#FEF1F2] dark:bg-[#F04438]/20"
      iconColorClass="text-[#F04438] dark:text-[#f87171]"
      title="Course Registration Failed"
      description={
        <p>An error occurred while submitting your course registration. Please try again or log a complaint if the issue persists.</p>
      }
      primaryActionText="Try Again"
      secondaryActionText="Log a Complaint"
      onPrimaryAction={onConfirm}
      onSecondaryAction={onClose}
    />
  );
}
