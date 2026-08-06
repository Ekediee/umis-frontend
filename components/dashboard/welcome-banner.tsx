import { StudentProfileBanner } from "@/components/shared/student-profile-banner";
import { UMISResponse } from "@/lib/session";
import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeBannerProps {
  userData?: UMISResponse | null;
  onOpenGuide?: () => void;
  showGuideButton?: boolean;
}

export function WelcomeBanner({ userData, onOpenGuide, showGuideButton }: WelcomeBannerProps) {
  const rawFirstName = userData?.user_data?.personal_information?.student_name?.split(" ")[0] ?? "Student";
  const firstName = rawFirstName.replace(/,$/, "");
  const welcomeMessage = `Welcome back, ${firstName}! Here is your academic overview`;

  return (
    <div className="mb-5 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          {welcomeMessage}
        </h2>

        {showGuideButton && onOpenGuide && (
          <Button
            onClick={onOpenGuide}
            className="hidden sm:flex bg-gradient-to-r from-[#003cbb] to-[#2563eb] hover:from-[#003095] hover:to-[#1d4ed8] text-white rounded-xl h-10 px-4 text-xs font-semibold items-center gap-2 transition-all shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>💡 Get Started Guide</span>
          </Button>
        )}
      </div>

      <StudentProfileBanner
        userData={userData}
        showDetailedRow={true}
      />
    </div>
  );
}
