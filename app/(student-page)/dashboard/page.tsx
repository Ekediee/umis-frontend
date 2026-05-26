"use client"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getUserData } from "@/app/actions/user";
import { UMISResponse } from "@/lib/session";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [userData, setUserData] = useState<UMISResponse | null>(null);
  
    useEffect(() => {
      getUserData().then(setUserData);
    }, []);

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
      <WelcomeBanner userData={userData} />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 items-stretch">
        {/* Mobile: Quick Actions first, Desktop: Academic Progress first */}
        <div className="order-1 xl:order-1 h-full [&>div]:h-full min-h-[280px] xl:min-h-[320px]">
          <AcademicProgress cgpa={userData?.user_data?.academic_information?.cummulative_gpa} current_level={userData?.user_data?.academic_information?.study_level} />
        </div>
        
        <div className="order-3 xl:order-2 h-full [&>div]:h-full min-h-[280px] xl:min-h-[320px]">
          <FinanceOverview />
        </div>
        
        {/* Quick Actions: first on mobile (order-0), third on desktop */}
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
