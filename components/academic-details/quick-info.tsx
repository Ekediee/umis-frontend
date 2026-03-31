import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function QuickInfo() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
          <h3 className="text-[17px] font-bold text-gray-900">Quick Info</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">School Officer:</span>
            <span className="text-[13px] font-bold text-gray-800">Dr. Adeyemi Olumide</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Course Adviser:</span>
            <span className="text-[13px] font-bold text-gray-800">Dr. Adeyemi Olumide</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Expected Graduation:</span>
            <span className="text-[13px] font-bold text-gray-800">Jul 2027</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
