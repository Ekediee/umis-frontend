import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 overflow-y-auto">
      <WelcomeBanner />
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
        <div className="order-1 xl:order-none h-full [&>div]:h-full min-h-[320px]">
          <AcademicProgress />
        </div>
        
        <div className="order-3 xl:order-none h-full [&>div]:h-full min-h-[320px]">
          <FinanceOverview />
        </div>
        
        <div className="order-2 xl:order-none h-full [&>div]:h-full min-h-[380px]">
          <QuickActions />
        </div>
        
        <div className="order-4 xl:order-none h-full [&>div]:h-full min-h-[380px]">
          <RecentUpdates />
        </div>
      </div>
    </div>
  );
}
