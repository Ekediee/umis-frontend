import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function GraduationProgress() {
  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100 mb-1">Graduation Progress</h3>
            <p className="text-[14px] text-[#6a7282] dark:text-gray-400">Track your path to graduation</p>
          </div>
          <GraduationCap className="w-8 h-8 text-[#0a0a0a] dark:text-gray-400" />
        </div>

        <div className="bg-[#e5ecfc] dark:bg-gray-800/80 border-[0.67px] border-black/10 dark:border-gray-700 rounded-[20px] p-4 md:p-6 flex flex-col justify-between gap-4 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-normal text-[#525866] dark:text-gray-400 tracking-tight uppercase">ACADEMIC STANDING</span>
            <span className="bg-[#c2d6ff] dark:bg-[#162664]/30 text-[#162664] dark:text-[#c2d6ff] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#162664] dark:bg-[#4d82ff]"></span>
              GOOD STANDING
            </span>
          </div>
          <h4 className="text-[14px] font-semibold text-[#525866] dark:text-gray-300">Academic Progress (Semester 6 of 8)</h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white dark:bg-gray-900 h-3 rounded-full overflow-hidden">
              <div className="bg-[#003cbb] dark:bg-[#4d82ff] h-full rounded-full" style={{ width: '48%' }}></div>
            </div>
            <span className="text-[14px] font-bold text-[#525866] dark:text-gray-300">48%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
