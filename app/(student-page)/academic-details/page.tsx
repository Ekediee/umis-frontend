import { AcademicProgressExtended } from "@/components/academic-details/academic-progress-extended";
import { GraduationProgress } from "@/components/academic-details/graduation-progress";
import { QuickActionsList } from "@/components/academic-details/quick-actions-list";
import { QuickInfo } from "@/components/academic-details/quick-info";
import { CurrentSemesterRegistration } from "@/components/academic-details/current-semester-registration";
import { AcademicAlerts } from "@/components/academic-details/academic-alerts";
import { CGPAProgressionChart } from "@/components/academic-details/cgpa-progression-chart";


export default function AcademicDetailsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="w-[100%]">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="xl:col-span-7 flex flex-col gap-6 lg:gap-8">
            <AcademicProgressExtended />
            <QuickActionsList />
            <GraduationProgress />
            <CGPAProgressionChart />
          </div>
          
          {/* Right Column */}
          <div className="xl:col-span-5 flex flex-col gap-6 lg:gap-8">
            <QuickInfo />
            <CurrentSemesterRegistration />
            <AcademicAlerts />
          </div>
        </div>
      </div>
    </div>
  );
}
