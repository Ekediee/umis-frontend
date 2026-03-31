import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function GraduationProgress() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[17px] font-bold text-gray-900 mb-1">Graduation Progress</h3>
            <p className="text-[14px] text-gray-500">Track your path to graduation</p>
          </div>
          <GraduationCap className="w-6 h-6 text-gray-800" />
        </div>

        <div className="bg-[#EEF2FC] rounded-[24px] p-6 lg:p-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[12px] font-medium text-gray-500 tracking-wider">ACADEMIC STANDING</span>
            <span className="bg-[#D6E0F9] text-[#3B5B98] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B5B98]"></span>
              GOOD STANDING
            </span>
          </div>
          <h4 className="text-[16px] font-bold text-[#1E1E1E] mb-5">Academic Progress (Semester 6 of 8)</h4>
          <div className="flex items-center gap-4">
            <Progress value={48} className="h-3.5 flex-1 bg-white border border-white [&>div]:bg-[#314A95]" />
            <span className="text-[15px] font-bold text-gray-700">48%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
