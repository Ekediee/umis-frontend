"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import GPAMetric from "@/components/dashboard/gpa-metric";

export function AcademicProgressExtended() {
  
  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100">Academic Progress</h3>
          <TrendingUp className="w-5 h-5 text-[#0a0a0a] dark:text-gray-400" strokeWidth={2.5} />
        </div>

        <GPAMetric />

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-medium text-[#364153] dark:text-gray-300">Total Units Earned</span>
              <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100">45 / 144</span>
            </div>
            <div className="h-2 w-full bg-[#e5e7eb] dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-black dark:bg-[#4d82ff] rounded-full" style={{ width: '31%' }}></div>
            </div>
            <div className="text-[12px] text-[#6a7282] dark:text-gray-400 font-normal">
              31% complete
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-medium text-[#364153] dark:text-gray-300">Semester Units</span>
              <span className="text-[14px] font-medium text-[#0a0a0a] dark:text-gray-100">17 / 24</span>
            </div>
            <div className="h-2 w-full bg-[#e5e7eb] dark:bg-gray-800 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-black dark:bg-[#4d82ff] rounded-full" style={{ width: '71%' }}></div>
            </div>
            <div className="text-[12px] text-[#6a7282] dark:text-gray-400 font-normal">
              71% of max load
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
