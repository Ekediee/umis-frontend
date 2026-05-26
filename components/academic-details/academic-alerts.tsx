import { CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function AcademicAlerts() {
  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#111827] dark:text-gray-100 mb-1">Academic Alerts & Insight</h3>
        <p className="text-[12px] text-[#4b5563] dark:text-gray-400 mb-8">Important notifications about your academic status</p>

        <div className="flex flex-col gap-3">
          {/* Success Alert */}
          <div className="bg-[#f0fdf4] dark:bg-[#12B76A]/10 border border-black/10 dark:border-[#12B76A]/20 rounded-[20px] p-4 flex gap-4 items-start transition-colors duration-200">
            <CheckCircle2 className="w-[30px] h-[30px] text-[#2d9f75] dark:text-[#34d399] shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[12px] font-semibold text-[#111827] dark:text-[#34d399]">Outstanding Performance!</h4>
              <p className="text-[12px] text-[#4b5563] dark:text-gray-300 leading-relaxed">
                Your GPA increased by 0.15 points this semester. Keep up the excellent work!
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-[#eff6ff] dark:bg-[#003cbb]/10 border border-black/10 dark:border-[#003cbb]/20 rounded-[20px] p-4 flex gap-4 items-start transition-colors duration-200">
            <Info className="w-[30px] h-[30px] text-[#003cbb] dark:text-[#4d82ff] shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[12px] font-semibold text-[#111827] dark:text-[#4d82ff]">Course Registration Opens Soon</h4>
              <p className="text-[12px] text-[#4b5563] dark:text-gray-300 leading-relaxed">
                Registration for next semester begins on April 1, 2026. Plan your courses early.
              </p>
              <Link href="#" className="text-[12px] font-normal text-[#4b5563] dark:text-[#4d82ff] mt-0.5 underline">
                Start Course Registration Now
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
