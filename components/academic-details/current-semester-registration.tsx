import { Card, CardContent } from "@/components/ui/card";

export function CurrentSemesterRegistration() {
  return (
    <Card className="rounded-[24px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100 mb-8">Current Semester Registration</h3>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Registered Units:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">17</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Total Semester course:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Core Courses:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">10</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Electives:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">02</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
