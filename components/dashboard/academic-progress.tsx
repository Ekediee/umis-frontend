"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import GPAMetric from "./gpa-metric";

export function AcademicProgress() {

  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col">
      <CardContent className="p-2 md:p-6 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <h3 className="text-[17px] font-bold text-gray-900">Academic Progress</h3>
        </div>

        <GPAMetric />

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-gray-800">Overall Completion</span>
            <span className="text-[14px] font-bold text-[#3B4FA1]">31.3%</span>
          </div>
          <Progress value={31.3} className="h-2.5 mb-2 bg-[#E5E7EB] [&>div]:bg-[#314A95]" />
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <span>45 credits earned</span>
            <span>144 total required</span>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}

