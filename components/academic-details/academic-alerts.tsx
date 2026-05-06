import { CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function AcademicAlerts() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#111827] mb-1">Academic Alerts & Insight</h3>
        <p className="text-[12px] text-[#4b5563] mb-8">Important notifications about your academic status</p>

        <div className="flex flex-col gap-3">
          {/* Success Alert */}
          <div className="bg-[#f0fdf4] border border-black/10 rounded-[24px] p-4 flex gap-4 items-start">
            <CheckCircle2 className="w-[30px] h-[30px] text-[#2d9f75] shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[12px] font-semibold text-[#111827]">Outstanding Performance!</h4>
              <p className="text-[12px] text-[#4b5563] leading-relaxed">
                Your GPA increased by 0.15 points this semester. Keep up the excellent work!
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-[#eff6ff] border border-black/10 rounded-[24px] p-4 flex gap-4 items-start">
            <Info className="w-[30px] h-[30px] text-[#003cbb] shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[12px] font-semibold text-[#111827]">Course Registration Opens Soon</h4>
              <p className="text-[12px] text-[#4b5563] leading-relaxed">
                Registration for next semester begins on April 1, 2026. Plan your courses early.
              </p>
              <Link href="#" className="text-[12px] font-normal text-[#4b5563] mt-0.5 underline">
                Start Course Registration Now
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
