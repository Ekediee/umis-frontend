import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { AcademicProgress } from "@/components/dashboard/academic-progress";
import { FinanceOverview } from "@/components/dashboard/finance-overview";
import { RecentUpdates } from "@/components/dashboard/recent-updates";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 overflow-y-auto">
      <WelcomeBanner />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-6 h-full">
          <div className="flex-1 min-h-[320px]">
             <AcademicProgress />
          </div>
          <div className="flex-1 min-h-[380px]">
             <RecentUpdates />
          </div>
        </div>
        
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6 h-full">
          <div className="flex-[0.8] min-h-[320px]">
             <FinanceOverview />
          </div>
          <div className="flex-1 min-h-[380px]">
             <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
