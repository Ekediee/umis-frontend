"use client";

import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserData } from "@/contexts/user-data-context";
import { getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

export function QuickInfo() {
  const contextUserData = useUserData();
  const [profileData, setProfileData] = useState<UMISResponse | null>(contextUserData);

  useEffect(() => {
    getStudentProfileAction().then((res) => {
      if (res) setProfileData(res);
    });
  }, []);

  const userData = profileData ?? contextUserData;
  const department = userData?.user_data?.department ?? "Computer Science";
  const degree = userData?.user_data?.degree_name ?? "B.Sc. Computer Science";
  const matricNo = userData?.user_data?.matric_number ?? userData?.user_data?.personal_information?.matric_number ?? "N/A";
  const school = userData?.user_data?.school_name ?? "School of Computing";

  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100">Quick Info</h3>
          <GraduationCap className="w-6 h-6 text-[#0a0a0a] dark:text-gray-400" strokeWidth={2} />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Matric Number:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100">{matricNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Department:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100 text-right">{department}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Degree / Programme:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100 text-right">{degree}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">School / Faculty:</span>
            <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100 text-right">{school}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
