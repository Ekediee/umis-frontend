import { AcademicProgressExtended } from "@/components/academic-details/academic-progress-extended";
import { GraduationProgress } from "@/components/academic-details/graduation-progress";
import { QuickActionsList } from "@/components/academic-details/quick-actions-list";
import { QuickInfo } from "@/components/academic-details/quick-info";
import { CurrentSemesterRegistration } from "@/components/academic-details/current-semester-registration";
import { AcademicAlerts } from "@/components/academic-details/academic-alerts";


export default function AcademicDetailsPage() {
  return (
    <div className="p-4 md:px-6 md:py-2 overflow-y-auto">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <AcademicProgressExtended />
          <GraduationProgress />
          <QuickActionsList />
        </div>
        
        {/* Right Column */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <QuickInfo />
          <CurrentSemesterRegistration />
          <AcademicAlerts />
        </div>
      </div>
    </div>
  );
}
