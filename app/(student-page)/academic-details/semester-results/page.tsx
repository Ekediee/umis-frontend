"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import GPAMetric from "@/components/dashboard/gpa-metric";
import { useEffect, useState } from "react";
import { UMISResponse } from "@/lib/session";
import { getUserData } from "@/app/actions/user";

export default function SemesterResultsPage() {
  const router = useRouter();

  const semesters = [
    { name: "2018/2019.1", level: 100, hours: 22, gpa: 3.45, chours: 22, cgpa: 3.45 },
    { name: "2018/2019.2", level: 100, hours: 22, gpa: 3.77, chours: 22, cgpa: 3.61 },
    { name: "2018/2019.3", level: 100, hours: 8, gpa: 4.38, chours: 52, cgpa: 3.73 },
    { name: "2019/2020.1", level: 200, hours: 20, gpa: 3.35, chours: 72, cgpa: 3.62 },
    { name: "2019/2020.2", level: 200, hours: 21, gpa: 4, chours: 93, cgpa: 3.71 },
  ];

  const [userData, setUserData] = useState<UMISResponse | null>(null);
    
  useEffect(() => {
    getUserData().then(setUserData);
  }, []);

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-0 md:mt-0">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          className="rounded-[10px] text-[#003cbb] font-semibold px-4 h-10 border-gray-200 hover:bg-[#f5f8fe] hover:text-[#003095] bg-white shadow-sm transition-colors"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Top Cards Wrapper */}
      <Card className="rounded-[24px] bg-white border-0 shadow-sm p-4 md:mb-0">
        <GPAMetric 
          cgpa={userData?.user_data?.academic_information?.cummulative_gpa} 
          current_level={userData?.user_data?.academic_information?.study_level} 
        />
      </Card>

      {/* Table/List Area */}
      <div className="flex flex-col gap-4 text-gray-900">
        
        {/* Mobile Header Box */}
        <div className="bg-white rounded-[16px] px-5 py-3.5 font-bold text-[15px] text-gray-900 shadow-sm md:hidden flex items-center">
            Semester Result
        </div>

        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_100px] gap-4 px-6 py-4 bg-[#E5E7EB] rounded-[16px]">
          <div className="text-[13px] font-bold text-gray-500">Semester</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">Study Level</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">Hours</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">GPA</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">C.Hours</div>
          <div className="text-[13px] font-bold text-gray-500 text-center">C.GPA</div>
          <div></div>
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-3">
          {semesters.map((sem, idx) => {
            const [session, term] = sem.name.split('.');
            const termName = term === '1' ? '1st Semester' : term === '2' ? '2nd Semester' : term === '3' ? '3rd Semester' : `${term}th Semester`;
            
            return (
              <Card key={idx} className="rounded-[16px] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* DESKTOP VIEW */}
                  <div className="hidden md:grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr_100px] md:items-center gap-4 px-6">
                    <div className="font-bold text-[15px] text-gray-900">
                      {sem.name}
                    </div>
                    
                    <div className="text-[15px] text-gray-600 text-center">
                      {sem.level}
                    </div>
                    
                    <div className="text-[15px] text-gray-600 text-center">
                      {sem.hours}
                    </div>
                    
                    <div className="text-[15px] text-gray-600 text-center">
                      {sem.gpa}
                    </div>
                    
                    <div className="text-[15px] text-gray-600 text-center">
                      {sem.chours}
                    </div>
                    
                    <div className="text-[15px] text-gray-600 text-center">
                      {sem.cgpa}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        className="rounded-[10px] text-[#003cbb] font-semibold px-4 h-9 border border-[#003cbb]/20 hover:bg-[#f5f8fe] bg-white shadow-sm"
                        onClick={() => router.push(`/academic-details/semester-results/${encodeURIComponent(sem.name)}`)}
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View
                      </Button>
                    </div>
                  </div>

                  {/* MOBILE VIEW */}
                  <div className="flex flex-col md:hidden p-5 gap-5">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-[16px] text-gray-900 leading-tight">{sem.level}L - {termName}</span>
                        <span className="text-[13px] text-gray-500 font-medium">{session}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="font-bold text-[16px] text-gray-900 leading-tight">{sem.gpa}</span>
                        <span className="text-[13px] text-gray-500 font-medium">Semester GPA</span>
                      </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />

                    <div className="grid grid-cols-3 gap-2">
                       <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-bold text-gray-500">Hours</span>
                          <span className="font-semibold text-[15px] text-gray-800">{sem.hours}</span>
                       </div>
                       <div className="flex flex-col gap-1 text-center">
                          <span className="text-[12px] font-bold text-gray-500">C. Hours</span>
                          <span className="font-semibold text-[15px] text-gray-800">{sem.chours}</span>
                       </div>
                       <div className="flex flex-col gap-1 text-right">
                          <span className="text-[12px] font-bold text-gray-500">C.GPA</span>
                          <span className="font-semibold text-[15px] text-gray-800">{sem.cgpa}</span>
                       </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full rounded-[12px] text-[#003cbb] font-semibold h-11 border border-[#003cbb]/20 hover:bg-[#f5f8fe] bg-white shadow-sm mt-1"
                      onClick={() => router.push(`/academic-details/semester-results/${encodeURIComponent(sem.name)}`)}
                    >
                      <Eye className="w-[18px] h-[18px] mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
