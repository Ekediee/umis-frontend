import { CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function AcademicAlerts() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-6">
        <h3 className="text-[17px] font-bold text-gray-900 mb-1">Academic Alerts & Insight</h3>
        <p className="text-[13px] text-gray-500 mb-6 tracking-tight">Important notifications about your academic status</p>

        <div className="flex flex-col gap-4">
          {/* Success Alert */}
          <div className="bg-[#EAF6ED] border border-[#D4ECD9] rounded-[20px] p-5 flex gap-3.5 items-start">
            <CheckCircle2 className="w-[18px] h-[18px] text-[#34A853] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col gap-1.5 pt-0.5">
              <h4 className="text-[13px] font-bold text-gray-900 leading-none">Outstanding Performance!</h4>
              <p className="text-[12px] text-gray-600 leading-relaxed pr-2 font-medium">
                Your GPA increased by 0.15 points this semester. Keep up the excellent work!
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-[#EEF2FC] border border-[#D6E0F9] rounded-[20px] p-5 flex gap-3.5 items-start">
            <Info className="w-[18px] h-[18px] text-[#3B5B98] shrink-0 mt-0.5" strokeWidth={2.5} />
            <div className="flex flex-col gap-1.5 pt-0.5">
              <h4 className="text-[13px] font-bold text-gray-900 leading-none">Course Registration Opens Soon</h4>
              <p className="text-[12px] text-gray-600 leading-relaxed font-medium">
                Registration for next semester begins on April 1, 2026. Plan your courses early.
              </p>
              <Link href="#" className="text-[12px] font-bold text-[#3B5B98] mt-0.5 hover:underline decoration-2 underline-offset-2">
                Start Course Registration Now
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
