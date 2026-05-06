import { Card, CardContent } from "@/components/ui/card";

export function CurrentSemesterRegistration() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#0a0a0a] mb-8">Current Semester Registration</h3>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Registered Units:</span>
            <span className="text-[14px] font-normal text-[#4a5565]">17</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Total Semester course:</span>
            <span className="text-[14px] font-normal text-[#4a5565]">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Core Courses:</span>
            <span className="text-[14px] font-normal text-[#4a5565]">10</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565]">Electives:</span>
            <span className="text-[14px] font-normal text-[#4a5565]">02</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
