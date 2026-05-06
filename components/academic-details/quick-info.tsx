import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickInfo() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[18px] font-bold text-[#0a0a0a]">Quick Info</h3>
          <GraduationCap className="w-6 h-6 text-[#0a0a0a]" strokeWidth={2} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">School Officer:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a]">Dr. Adeyemi Olumide</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Course Adviser:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a]">Dr. Adeyemi Olumide</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Expected Graduation:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a]">Jul 2027</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
