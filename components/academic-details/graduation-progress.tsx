"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/user-data-context";
import { getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

export function GraduationProgress() {
  const contextUserData = useUserData();
  const [profileData, setProfileData] = useState<UMISResponse | null>(contextUserData);

  useEffect(() => {
    getStudentProfileAction().then((res) => {
      if (res) setProfileData(res);
    });
  }, []);

  const userData = profileData ?? contextUserData;

  const rawStatus =
    userData?.user_data?.status ??
    userData?.user_data?.academic_information?.status ??
    "GOOD STANDING";
  const standing = typeof rawStatus === "string" ? rawStatus.toUpperCase() : "GOOD STANDING";

  const currentLevel =
    userData?.user_data?.current_level ??
    userData?.user_data?.academic_information?.study_level ??
    200;

  // Calculate estimated progress based on level (assuming 4-year / 8-semester standard)
  const semesterNum = Math.min(Math.max(Math.round((Number(currentLevel) / 100) * 2 - 1), 1), 8);
  const progressPercent = Math.min(Math.round((semesterNum / 8) * 100), 100);

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
              {standing}
            </span>
          </div>
          <h4 className="text-[14px] font-semibold text-[#525866] dark:text-gray-300">
            Academic Progress (Semester {semesterNum} of 8)
          </h4>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white dark:bg-gray-900 h-3 rounded-full overflow-hidden">
              <div className="bg-[#003cbb] dark:bg-[#4d82ff] h-full rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="text-[14px] font-bold text-[#525866] dark:text-gray-300">{progressPercent}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
