import { Card, CardContent } from "@/components/ui/card";

export function CurrentSemesterRegistration() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-6">
        <h3 className="text-[17px] font-bold text-gray-900 mb-6">Current Semester Registration</h3>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Registered Units:</span>
            <span className="text-[13px] font-bold text-gray-800">17</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Total Semester course:</span>
            <span className="text-[13px] font-bold text-gray-800">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Core Courses:</span>
            <span className="text-[13px] font-bold text-gray-800">10</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-gray-500">Electives:</span>
            <span className="text-[13px] font-bold text-gray-800">02</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
