"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import GPAMetric from "@/components/dashboard/gpa-metric";

export function AcademicProgressExtended() {
  
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-2 md:p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <h3 className="text-[17px] font-bold text-gray-900">Academic Progress</h3>
        </div>

        <GPAMetric />

        <div className="mt-8 border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-gray-500">Total Units Earned</span>
              <span className="text-[13px] font-bold text-gray-900">45 / 144</span>
            </div>
            <Progress value={31.3} className="h-2.5 mb-2 bg-[#E5E7EB] [&>div]:bg-[#1E1E1E]" />
            <div className="text-[11px] text-gray-400 font-medium tracking-wide">
              31% complete
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-gray-500">Semester Units</span>
              <span className="text-[13px] font-bold text-gray-900">17 / 24</span>
            </div>
            <Progress value={71} className="h-2.5 mb-2 bg-[#E5E7EB] [&>div]:bg-[#1E1E1E]" />
            <div className="text-[11px] text-gray-400 font-medium tracking-wide">
              71% of max load
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
