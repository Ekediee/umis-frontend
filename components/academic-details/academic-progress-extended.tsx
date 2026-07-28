"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GPAMetric from "@/components/dashboard/gpa-metric";
import { GPAWhatIfSimulator } from "@/components/academic-details/gpa-what-if-simulator";
import { useUserData } from "@/contexts/user-data-context";
import { getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

export function AcademicProgressExtended() {
  const contextUserData = useUserData();
  const [profileData, setProfileData] = useState<UMISResponse | null>(contextUserData);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  useEffect(() => {
    getStudentProfileAction().then((res) => {
      if (res) setProfileData(res);
    });
  }, []);

  const userData = profileData ?? contextUserData;
  const cgpa =
    userData?.user_data?.cummulative_gpa ??
    userData?.user_data?.academic_information?.cummulative_gpa ??
    null;
  const currentLevel =
    userData?.user_data?.current_level ??
    userData?.user_data?.academic_information?.study_level ??
    null;

  return (
    <>
      <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100">Academic Progress</h3>
            <TrendingUp className="w-5 h-5 text-[#0a0a0a] dark:text-gray-400" strokeWidth={2.5} />
          </div>

          <GPAMetric cgpa={cgpa} current_level={currentLevel} />

          {/* Progress Bars */}
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-medium text-[#364153] dark:text-gray-300">Total Units Earned</span>
                <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100">45 / 144</span>
              </div>
              <div className="h-2 w-full bg-[#e5e7eb] dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#003cbb] dark:bg-[#4d82ff] rounded-full" style={{ width: "31%" }}></div>
              </div>
              <div className="text-[12px] text-[#6a7282] dark:text-gray-400 font-normal">31% complete</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-medium text-[#364153] dark:text-gray-300">Semester Units</span>
                <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100">17 / 24</span>
              </div>
              <div className="h-2 w-full bg-[#e5e7eb] dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#003cbb] dark:bg-[#4d82ff] rounded-full" style={{ width: "71%" }}></div>
              </div>
              <div className="text-[12px] text-[#6a7282] dark:text-gray-400 font-normal">71% of max load</div>
            </div>
          </div>

          {/* What-If Simulator — below progress bars */}
          <div className="flex justify-end border-t border-gray-100 dark:border-gray-800/80 pt-5 mt-6">
            <Button
              onClick={() => setIsSimulatorOpen(true)}
              className="bg-gradient-to-r from-[#003cbb] to-[#2563eb] hover:from-[#003095] hover:to-[#1d4ed8] text-white rounded-xl h-11 flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md px-6 font-semibold"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>💡 Simulate What-If GPA</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulator Modal */}
      <GPAWhatIfSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </>
  );
}
