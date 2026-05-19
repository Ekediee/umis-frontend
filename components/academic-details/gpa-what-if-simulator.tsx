"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Sparkles, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MockCourse {
  id: string;
  code: string;
  units: number;
  grade: string; // A, B, C, D, E, F
}

interface GPAWhatIfSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const GRADE_POINTS: Record<string, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export function GPAWhatIfSimulator({ isOpen, onClose }: GPAWhatIfSimulatorProps) {
  // Baseline student data: 93 completed hours, 3.67 CGPA -> 341.31 cumulative grade points
  const baselineHours = 93;
  const baselineCGPA = 3.67;
  const baselineGP = baselineHours * baselineCGPA; // 341.31

  const [courses, setCourses] = useState<MockCourse[]>([
    { id: "1", code: "COSC 311", units: 3, grade: "A" },
    { id: "2", code: "COSC 313", units: 3, grade: "B" },
    { id: "3", code: "COSC 315", units: 4, grade: "A" },
    { id: "4", code: "COSC 317", units: 2, grade: "C" },
    { id: "5", code: "GEDS 301", units: 2, grade: "A" },
  ]);

  const [targetGPA, setTargetGPA] = useState<number>(4.0);
  const [semesterGPA, setSemesterGPA] = useState<number>(0);
  const [projectedCGPA, setProjectedCGPA] = useState<number>(0);

  const totalUnits = courses.reduce((acc, c) => acc + c.units, 0);
  const neededSemesterGP = targetGPA * (baselineHours + totalUnits) - baselineGP;
  const neededSemesterGPA = totalUnits > 0 ? neededSemesterGP / totalUnits : 0;

  const getTargetGradeForCourse = (courseUnits: number) => {
    if (neededSemesterGPA <= 0) return "A, B or C";
    if (neededSemesterGPA > 5.0) return "A (Impossible)";
    
    if (neededSemesterGPA > 4.5) return "A";
    if (neededSemesterGPA > 3.5) {
      return courseUnits >= 3 ? "A" : "B";
    }
    if (neededSemesterGPA > 2.5) {
      return courseUnits >= 4 ? "B" : "C";
    }
    return "C";
  };

  // Calculate simulated values
  useEffect(() => {
    let totalUnits = 0;
    let totalGradePoints = 0;

    courses.forEach((c) => {
      totalUnits += c.units;
      totalGradePoints += c.units * (GRADE_POINTS[c.grade] ?? 0);
    });

    const semGPA = totalUnits > 0 ? totalGradePoints / totalUnits : 0;
    const projCGPA = (baselineGP + totalGradePoints) / (baselineHours + totalUnits);

    setSemesterGPA(Number(semGPA.toFixed(2)));
    setProjectedCGPA(Number(projCGPA.toFixed(2)));
  }, [courses, baselineGP, baselineHours]);

  const addCourse = () => {
    const newId = (courses.length + 1).toString();
    setCourses([
      ...courses,
      { id: newId, code: `MOCK ${100 + courses.length * 10}`, units: 3, grade: "A" },
    ]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, updates: Partial<MockCourse>) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  if (!isOpen) return null;

  const targetDiff = projectedCGPA - targetGPA;
  const isTargetMet = targetDiff >= 0;
  const isTargetClose = !isTargetMet && Math.abs(targetDiff) <= 0.15;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-40px)] border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003cbb] to-[#1e3a8a] p-6 flex justify-between items-start shrink-0 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-white mb-1">GPA "What-If" Simulator</h2>
              <p className="text-blue-100 text-[14px] font-medium flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-200" />
                Simulate grades to outline your path to graduation
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#0a0d14] p-6 flex flex-col gap-6 min-h-0">
          
          {/* Top Overview Cards & Target Slider */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Goal Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-[20px] p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Set Target CGPA</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[28px] font-black text-[#b8860b] dark:text-[#f4d068] leading-none">{targetGPA.toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="5.0" 
                step="0.05"
                value={targetGPA} 
                onChange={(e) => setTargetGPA(Number(e.target.value))}
                className="w-full mt-3 accent-[#b8860b] dark:accent-[#f4d068]"
              />
            </div>

            {/* Projected CGPA Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[20px] p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Projected CGPA</span>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-[32px] font-black text-[#253ea7] dark:text-[#4d82ff] leading-none">{projectedCGPA.toFixed(2)}</span>
                <span className="text-[12px] text-gray-400 font-medium">({baselineCGPA.toFixed(2)} baseline)</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">Includes simulated semester</span>
            </div>

            {/* Simulated Semester GPA Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[20px] p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
              <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Simulated GPA</span>
              <div className="mt-2">
                <span className="text-[32px] font-black text-[#2d9f75] dark:text-[#34d399] leading-none">{semesterGPA.toFixed(2)}</span>
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 font-medium">
                {courses.reduce((acc, c) => acc + c.units, 0)} Simulated Credit Units
              </span>
            </div>
          </div>
          {/* How It Works Explainer Box */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3.5 shrink-0">
            <div className="flex items-center gap-2 text-[#003cbb] dark:text-[#4d82ff] font-bold text-[14px]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>📚 Academic Definitions & How It Works</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#b8860b] dark:text-[#f4d068] text-[13px]">🎯 Target CGPA Goal</span>
                <p className="opacity-90">
                  Your <strong className="font-extrabold text-gray-900 dark:text-gray-100">desired graduation CGPA</strong> (e.g. 4.50+ for First Class). Slide the gold control to define your target and see if your grades are on track!
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#2d9f75] dark:text-[#34d399] text-[13px]">⚡ Simulated Semester GPA</span>
                <p className="opacity-90">
                  Your projected average GPA <strong className="font-extrabold text-gray-900 dark:text-gray-100">just for this single semester</strong>. It calculates live based on the letter grades and credit units you adjust below.
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#253ea7] dark:text-[#4d82ff] text-[13px]">📈 Projected Overall CGPA</span>
                <p className="opacity-90">
                  Your <strong className="font-extrabold text-gray-900 dark:text-gray-100">new cumulative GPA</strong> across your entire university journey, combining your past semesters with this simulated semester.
                </p>
              </div>
            </div>
          </div>

          {/* Goal Notification Alert Banner */}
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-3 transition-colors",
            isTargetMet 
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : isTargetClose
                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          )}>
            {isTargetMet ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-[14px]">
                {isTargetMet 
                  ? "🎉 Dream CGPA Achieved!" 
                  : isTargetClose 
                    ? "✨ Almost There! Keep Pushing!" 
                    : "💪 Additional Work Needed"}
              </p>
              <p className="text-[13px] mt-1 opacity-90 leading-relaxed">
                {isTargetMet 
                  ? `Incredible! If you score these grades this semester, your CGPA will reach ${projectedCGPA.toFixed(2)}, successfully passing your goal of ${targetGPA.toFixed(2)}!`
                  : isTargetClose
                    ? `You are just ${(targetGPA - projectedCGPA).toFixed(2)} CGPA points away from your goal. If you turn one of your B's into an A, you will reach it!`
                    : `To hit a target CGPA of ${targetGPA.toFixed(2)} from your current baseline, you will need to register additional high-unit electives and average a grade of A (${GRADE_POINTS.A}.00 GPA) in future semesters.`}
              </p>
            </div>
          </div>

          {/* Courses Sandbox Table */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col h-auto">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
              <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">Simulated Semester Courses</span>
              <Button 
                onClick={addCourse}
                className="bg-[#003cbb] hover:bg-[#003095] text-white rounded-lg h-9 text-[13px] font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </Button>
            </div>

            <div className="p-4 flex flex-col gap-3 h-auto">
              {courses.map((course) => (
                <div 
                  key={course.id} 
                  className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 rounded-xl p-4 transition-all hover:shadow-sm"
                >
                  {/* Course Code */}
                  <div className="w-full sm:w-[150px] shrink-0">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:hidden">Course Code</label>
                    <input 
                      type="text" 
                      value={course.code}
                      onChange={(e) => updateCourse(course.id, { code: e.target.value.toUpperCase() })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#003cbb]"
                    />
                    <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md mt-1.5 block w-fit border border-amber-200/50 dark:border-amber-900/50">
                      🎯 Target: {getTargetGradeForCourse(course.units)}
                    </span>
                  </div>

                  {/* Credit Units */}
                  <div className="w-full sm:w-[120px] shrink-0">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:hidden">Credit Units</label>
                    <select
                      value={course.units}
                      onChange={(e) => updateCourse(course.id, { units: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#003cbb]"
                    >
                      {[1, 2, 3, 4, 5, 6].map((u) => (
                        <option key={u} value={u}>{u} {u === 1 ? 'Unit' : 'Units'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Estimated Grade Sliders */}
                  <div className="w-full flex-1">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 sm:hidden">Expected Grade</label>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      {["A", "B", "C", "D", "E", "F"].map((grade) => {
                        const isSelected = course.grade === grade;
                        return (
                          <button
                            key={grade}
                            onClick={() => updateCourse(course.id, { grade })}
                            className={cn(
                              "flex-1 py-2 text-[13px] font-bold rounded-lg border transition-all",
                              isSelected 
                                ? "bg-[#003cbb] border-[#003cbb] text-white shadow-sm scale-105" 
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            {grade} <span className="block sm:inline text-[10px] opacity-80 font-normal">({GRADE_POINTS[grade]}pts)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeCourse(course.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors shrink-0 self-end sm:self-center"
                    aria-label="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-end">
          <Button 
            onClick={onClose}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl px-8"
          >
            Close Sandbox
          </Button>
        </div>
      </div>
    </div>
  );
}
