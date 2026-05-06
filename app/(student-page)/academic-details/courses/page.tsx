"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock Data
const MOCK_DATA = {
  current: [
    { code: "COSC 204", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2 },
    { code: "COSC 202", title: "Advanced Database Management Systems", lecturer: "Johnson R.T", level: "200L", units: 3 },
    { code: "COSC 200", title: "Web Application Development", lecturer: "Adams P.L", level: "200L", units: 3 },
    { code: "BU-GST 201", title: "Artificial Intelligence Principles", lecturer: "Nguyen A.K", level: "200L", units: 4 },
    { code: "COSC 268", title: "Mobile Application Development", lecturer: "Peterson J.E", level: "200L", units: 3 },
    { code: "BU-GST 205", title: "Software Engineering", lecturer: "Williams H.J", level: "200L", units: 4 },
    { code: "SENG 270", title: "Computer Networks", lecturer: "Rodriguez T.F", level: "200L", units: 3 },
    { code: "ITGY 271", title: "Human-Computer Interaction", lecturer: "Lee M.N", level: "200L", units: 3 },
    { code: "COSC 872", title: "Data Structures and Algorithms", lecturer: "Singh R.V", level: "200L", units: 2 },
  ],
  "carry-over": [
    { code: "COSC 204", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2 },
    { code: "BU-GST 201", title: "Artificial Intelligence Principles", lecturer: "Nguyen A.K", level: "200L", units: 4 },
    { code: "COSC 268", title: "Mobile Application Development", lecturer: "Peterson J.E", level: "200L", units: 3 },
    { code: "ITGY 271", title: "Human-Computer Interaction", lecturer: "Lee M.N", level: "200L", units: 3 },
    { code: "COSC 872", title: "Data Structures and Algorithms", lecturer: "Singh R.V", level: "200L", units: 2 },
  ],
  repeated: [
    { code: "COSC 204", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2 },
    { code: "ITGY 271", title: "Human-Computer Interaction", lecturer: "Lee M.N", level: "200L", units: 3 },
    { code: "COSC 872", title: "Data Structures and Algorithms", lecturer: "Singh R.V", level: "200L", units: 2 },
  ]
};

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || "current";
  
  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/academic-details/courses?tab=${value}`);
  };

  const getCourses = (tab: string) => {
    return MOCK_DATA[tab as keyof typeof MOCK_DATA] || [];
  };

  // CALCULATE TOTAL UNITS FOR ACTIVE TAB
  const activeCourses = getCourses(activeTab);
  const totalUnits = activeCourses.reduce((sum, course) => sum + course.units, 0);

  const renderTable = (data: typeof MOCK_DATA.current) => (
    <div className="flex flex-col gap-3">
      {data.map((course, idx) => (
        <Card key={idx} className="rounded-[16px] border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            {/* DESKTOP VIEW */}
            <div className="hidden md:grid grid-cols-[1.5fr_3fr_1.5fr_1fr_1fr] items-center px-6">
              <div className="font-bold text-[15px] text-gray-900">
                {course.code}
              </div>
              <div className="text-[15px] text-gray-500 font-medium truncate pr-4">
                {course.title}
              </div>
              <div className="text-[15px] text-gray-500 font-medium">
                {course.lecturer}
              </div>
              <div className="text-[15px] text-gray-500 font-medium">
                {course.level}
              </div>
              <div className="flex justify-end pr-2">
                <span className="text-[11px] font-bold text-[#003cbb] bg-[#E1E7FC] rounded-full px-3 py-1">
                  {course.units} UNITS
                </span>
              </div>
            </div>

            {/* MOBILE VIEW */}
            <div className="flex flex-col md:hidden p-5 gap-3">
               <div className="flex justify-between items-center">
                  <div className="font-bold text-[16px] text-gray-900">{course.code}</div>
                  <span className="text-[11px] font-bold text-[#003cbb] bg-[#E1E7FC] rounded-full px-3 py-1">
                    {course.units} UNITS
                  </span>
               </div>
               
               <div className="text-[14px] text-gray-500 font-medium">
                  {course.title}
               </div>

               <div className="h-px bg-gray-100 my-1 w-full" />

               <div className="flex justify-between items-center text-[13px] text-gray-500 font-medium">
                  <div>{course.lecturer}</div>
                  <div>{course.level}</div>
               </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto pb-10 px-4 md:px-0 md:mt-0">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          className="rounded-[10px] text-[#003cbb] font-semibold px-4 h-10 border-gray-200 hover:bg-[#f5f8fe] hover:text-[#003095] bg-white shadow-sm transition-colors"
          onClick={() => router.push('/academic-details')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      {/* Tabs & Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 mb-6 gap-4">
          <TabsList className="bg-transparent overflow-x-auto flex-nowrap justify-start h-auto p-0 flex gap-6 md:gap-8 min-w-0 w-full md:w-auto border-none no-scrollbar">
            
            <TabsTrigger 
              value="current" 
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                borderBottom: activeTab === "current" ? "2px solid #003cbb" : "2px solid transparent"
              }}
              className={`px-0 py-3 md:pb-4 font-semibold text-[14px] whitespace-nowrap transition-colors ${
                activeTab === "current" ? "text-[#003cbb]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Current Semester Courses
            </TabsTrigger>
            
            <TabsTrigger 
              value="carry-over" 
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                borderBottom: activeTab === "carry-over" ? "2px solid #003cbb" : "2px solid transparent"
              }}
              className={`px-0 py-3 md:pb-4 font-semibold text-[14px] whitespace-nowrap transition-colors ${
                activeTab === "carry-over" ? "text-[#003cbb]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Carry Over courses
            </TabsTrigger>
            
            <TabsTrigger 
              value="repeated" 
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                borderRadius: 0,
                borderBottom: activeTab === "repeated" ? "2px solid #003cbb" : "2px solid transparent"
              }}
              className={`px-0 py-3 md:pb-4 font-semibold text-[14px] whitespace-nowrap transition-colors ${
                activeTab === "repeated" ? "text-[#003cbb]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Repeated Courses
            </TabsTrigger>

          </TabsList>

          <div className="font-bold text-gray-900 text-[15px] whitespace-nowrap self-end pb-4 hidden md:block">
            Total Units: {totalUnits}
          </div>
          {/* Mobile Total Units */}
          <div className="font-bold text-gray-900 text-[15px] ml-auto block md:hidden mb-2">
            Total Units: {totalUnits}
          </div>
        </div>

        <TabsContent value="current" className="mt-0 outline-none">
           {renderTable(getCourses("current"))}
        </TabsContent>
        <TabsContent value="carry-over" className="mt-0 outline-none">
           {renderTable(getCourses("carry-over"))}
        </TabsContent>
        <TabsContent value="repeated" className="mt-0 outline-none">
           {renderTable(getCourses("repeated"))}
        </TabsContent>
      </Tabs>

      {/* Pagination Footer */}
      {/* <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 text-gray-500 text-[13px] md:text-sm">
        <div>
          Page 1 of 2
        </div>
        
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white font-medium text-gray-900 shadow-sm mx-1">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 font-medium transition-colors">
            2
          </button>
          
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors mx-1">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        <div>
           <button className="flex items-center gap-2 border border-gray-200 rounded-[10px] px-4 py-2 bg-white text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm">
              10 / page
              <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
           </button>
        </div>
      </div> */}
    </div>
  );
}

// Main page component wrapping the Suspense boundary
export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading courses...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
