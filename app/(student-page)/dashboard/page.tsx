"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OnboardingGuideCard } from "@/components/dashboard/onboarding-guide-card";
import { OnboardingGuideSheet } from "@/components/dashboard/onboarding-guide-sheet";
import { useUserData } from "@/contexts/user-data-context";
import { DailyVerseCard } from "@/components/dashboard/daily-verse-card";

export default function DashboardPage() {
  const userData = useUserData();
  const searchParams = useSearchParams();
  const [isGuideSheetOpen, setIsGuideSheetOpen] = useState(false);

  const rawLevel =
    userData?.user_data?.current_level ??
    userData?.user_data?.academic_information?.study_level ??
    100;
  const currentLevel = Number(rawLevel) || 100;
  const is100L = currentLevel === 100;


  useEffect(() => {
    if (searchParams.get("login") === "success") {
      toast.success("Login successful! Welcome back 👋");
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
      <WelcomeBanner
        userData={userData}
        showGuideButton={!is100L}
        onOpenGuide={() => setIsGuideSheetOpen(true)}
      />

      {/* Bible Verse Encouragement Card */}
      <DailyVerseCard />

      {/* 100L Fresher Persistent Onboarding Checklist Card */}
      {is100L && (
        <div className="mb-6">
          <OnboardingGuideCard />
        </div>
      )}

      {/* 200L+ Side Sheet Guide Panel */}
      <OnboardingGuideSheet
        isOpen={isGuideSheetOpen}
        onClose={() => setIsGuideSheetOpen(false)}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 items-stretch">
        {/* Mobile: Quick Actions first, Desktop: Academic Progress first */}
        <div className="order-1 xl:order-1 h-full [&>div]:h-full min-h-[280px] xl:min-h-[320px]">
          <AcademicProgress
            cgpa={userData?.user_data?.academic_information?.cummulative_gpa}
            current_level={userData?.user_data?.academic_information?.study_level}
          />
        </div>

        <div className="order-3 xl:order-2 h-full [&>div]:h-full min-h-[280px] xl:min-h-[320px]">
          <FinanceOverview />
        </div>

        {/* Quick Actions */}
        <div className="order-0 xl:order-3 h-full [&>div]:h-full min-h-[200px] xl:min-h-[340px]">
          <QuickActions />
        </div>

        <div className="order-4 xl:order-4 h-full [&>div]:h-full min-h-[280px] xl:min-h-[340px]">
          <RecentUpdates />
        </div>
      </div>
    </div>
  );
}
