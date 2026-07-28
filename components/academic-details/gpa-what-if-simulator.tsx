"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Sparkles, TrendingUp, AlertCircle, CheckCircle, Target, ArrowRight, Settings2, RefreshCw } from "lucide-react";
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

const GRADE_LABELS: Record<string, string> = {
  A: "5.0 (Excellent)",
  B: "4.0 (Very Good)",
  C: "3.0 (Good)",
  D: "2.0 (Fair)",
  E: "1.0 (Pass)",
  F: "0.0 (Fail)",
};

export function GPAWhatIfSimulator({ isOpen, onClose }: GPAWhatIfSimulatorProps) {
  // Baseline student stats
  const [baselineHours, setBaselineHours] = useState<number>(93);
  const [baselineCGPA, setBaselineCGPA] = useState<number>(3.67);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Target GPA State (Default target semester GPA: 4.50)
  const [targetSemesterGPA, setTargetSemesterGPA] = useState<number>(4.5);

  // Initial Course List
  const [courses, setCourses] = useState<MockCourse[]>([
    { id: "1", code: "COSC 311", units: 3, grade: "A" },
    { id: "2", code: "COSC 313", units: 3, grade: "B" },
    { id: "3", code: "COSC 315", units: 4, grade: "A" },
    { id: "4", code: "COSC 317", units: 2, grade: "B" },
    { id: "5", code: "GEDS 301", units: 2, grade: "A" },
  ]);

  // Derived Baseline Points
  const baselineGP = useMemo(() => baselineHours * baselineCGPA, [baselineHours, baselineCGPA]);

  // Derived Total Semester Units
  const totalSemesterUnits = useMemo(() => courses.reduce((sum, c) => sum + c.units, 0), [courses]);

  // Derived Current Simulated Semester GPA
  const simulatedSemesterGPA = useMemo(() => {
    if (totalSemesterUnits === 0) return 0;
    const totalPoints = courses.reduce((sum, c) => sum + c.units * (GRADE_POINTS[c.grade] ?? 0), 0);
    return Number((totalPoints / totalSemesterUnits).toFixed(2));
  }, [courses, totalSemesterUnits]);

  // Derived Projected CGPA
  const projectedCGPA = useMemo(() => {
    const totalSemesterPoints = courses.reduce((sum, c) => sum + c.units * (GRADE_POINTS[c.grade] ?? 0), 0);
    const newTotalUnits = baselineHours + totalSemesterUnits;
    if (newTotalUnits === 0) return 0;
    return Number(((baselineGP + totalSemesterPoints) / newTotalUnits).toFixed(2));
  }, [courses, baselineHours, baselineGP, totalSemesterUnits]);

  // CGPA Delta (Difference between projected CGPA and baseline CGPA)
  const cgpaDelta = Number((projectedCGPA - baselineCGPA).toFixed(2));

  // Required grade distribution algorithm to achieve targetSemesterGPA
  const requiredTargetGrades = useMemo(() => {
    if (totalSemesterUnits === 0) return {};
    const requiredTotalPoints = targetSemesterGPA * totalSemesterUnits;

    // Sort indices by credit units descending (prioritize higher unit courses)
    const sortedIndices = courses
      .map((c, idx) => ({ idx, units: c.units, id: c.id }))
      .sort((a, b) => b.units - a.units);

    const gradeOrder = ["F", "E", "D", "C", "B", "A"];
    const assigned: Record<string, string> = {};

    // Start with all "F"
    courses.forEach((c) => {
      assigned[c.id] = "F";
    });

    let points = 0;
    let iterations = 0;
    while (points < requiredTotalPoints && iterations < 200) {
      iterations++;
      let upgraded = false;
      for (const item of sortedIndices) {
        const currentGrade = assigned[item.id];
        const currentVal = GRADE_POINTS[currentGrade];
        if (currentVal < 5) {
          assigned[item.id] = gradeOrder[currentVal + 1];
          upgraded = true;
          points = courses.reduce((sum, c) => sum + c.units * GRADE_POINTS[assigned[c.id]], 0);
          if (points >= requiredTotalPoints) break;
        }
      }
      if (!upgraded) break;
    }

    return assigned;
  }, [courses, targetSemesterGPA, totalSemesterUnits]);

  // Handler to auto-apply target required grades to all courses
  const applyTargetGrades = () => {
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        grade: requiredTargetGrades[c.id] || c.grade,
      }))
    );
  };

  // Course handlers
  const addCourse = () => {
    const newId = (Date.now() + Math.random()).toString();
    setCourses([
      ...courses,
      { id: newId, code: `COURSE ${100 + courses.length * 10}`, units: 3, grade: "A" },
    ]);
  };

  const removeCourse = (id: string) => {
    setCourses(courses.filter((c) => c.id !== id));
  };

  const updateCourse = (id: string, updates: Partial<MockCourse>) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  if (!isOpen) return null;

  const gpaDiff = Number((simulatedSemesterGPA - targetSemesterGPA).toFixed(2));
  const isTargetMet = gpaDiff >= 0;
  const isTargetClose = !isTargetMet && Math.abs(gpaDiff) <= 0.3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/50 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh] my-auto border border-gray-100 dark:border-gray-800 shrink-0 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#003cbb] via-[#1d4ed8] to-[#2563eb] p-5 sm:p-6 flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-[18px] sm:text-[22px] font-bold text-white tracking-tight flex items-center gap-2">
                GPA "What-If" Simulator
              </h2>
              <p className="text-blue-100 text-[12px] sm:text-[13px] font-medium flex items-center gap-1.5 opacity-90">
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Set a target GPA & see what grades you need in each course!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative z-10">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-xl text-white transition-colors flex items-center gap-1.5 text-xs font-medium border border-white/20",
                showSettings ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
              )}
              title="Edit Baseline CGPA & Completed Units"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">Baseline</span>
            </button>
            <button 
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Settings Banner */}
        {showSettings && (
          <div className="bg-blue-50/80 dark:bg-gray-800/80 border-b border-blue-100 dark:border-gray-700 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
              <span>Customize Your Starting Baseline:</span>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Baseline CGPA:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.00"
                  max="5.00"
                  value={baselineCGPA}
                  onChange={(e) => setBaselineCGPA(Math.max(0, Math.min(5, Number(e.target.value))))}
                  className="w-20 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#003cbb]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Completed Units:</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={baselineHours}
                  onChange={(e) => setBaselineHours(Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#003cbb]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50/70 dark:bg-[#0a0d14] p-4 sm:p-6 flex flex-col gap-6 min-h-0">
          
          {/* Top Cards Grid: Target GPA Setter, Simulated GPA & Projected CGPA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            
            {/* 1. Set Target Semester GPA */}
            <div className="bg-white dark:bg-gray-900 rounded-[20px] p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#003cbb] dark:text-[#4d82ff]" />
                  Target Semester GPA
                </span>
                <span className="bg-blue-50 dark:bg-blue-950/40 text-[#003cbb] dark:text-[#4d82ff] text-[11px] font-extrabold px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">
                  Goal
                </span>
              </div>
              
              <div className="my-1 flex items-baseline justify-between">
                <span className="text-[32px] font-black text-[#003cbb] dark:text-[#4d82ff] leading-none tracking-tight">
                  {targetSemesterGPA.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {targetSemesterGPA >= 4.5 ? "First Class" : targetSemesterGPA >= 3.5 ? "2nd Class Upper" : targetSemesterGPA >= 2.4 ? "2nd Class Lower" : "Pass"}
                </span>
              </div>

              {/* Slider */}
              <div className="mt-2">
                <input 
                  type="range" 
                  min="1.0" 
                  max="5.0" 
                  step="0.05"
                  value={targetSemesterGPA} 
                  onChange={(e) => setTargetSemesterGPA(Number(e.target.value))}
                  className="w-full accent-[#003cbb] dark:accent-[#4d82ff] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                  <button onClick={() => setTargetSemesterGPA(3.50)} className="hover:text-blue-600">3.50</button>
                  <button onClick={() => setTargetSemesterGPA(4.00)} className="hover:text-blue-600">4.00</button>
                  <button onClick={() => setTargetSemesterGPA(4.50)} className="hover:text-blue-600">4.50</button>
                  <button onClick={() => setTargetSemesterGPA(5.00)} className="hover:text-blue-600">5.00</button>
                </div>
              </div>
            </div>

            {/* 2. Simulated Semester GPA */}
            <div className="bg-white dark:bg-gray-900 rounded-[20px] p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Simulated Semester GPA
                </span>
                <span className={cn(
                  "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
                  isTargetMet 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                    : isTargetClose 
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                )}>
                  {isTargetMet ? "Goal Met" : isTargetClose ? "Close" : "Below Goal"}
                </span>
              </div>

              <div className="my-1 flex items-baseline gap-2">
                <span className={cn(
                  "text-[32px] font-black leading-none tracking-tight",
                  isTargetMet ? "text-emerald-600 dark:text-emerald-400" : isTargetClose ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {simulatedSemesterGPA.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  / 5.00 max
                </span>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>{totalSemesterUnits} Total Credit Units</span>
                <span>{gpaDiff >= 0 ? `+${gpaDiff.toFixed(2)} vs target` : `${gpaDiff.toFixed(2)} vs target`}</span>
              </div>
            </div>

            {/* 3. Projected Cumulative CGPA */}
            <div className="bg-white dark:bg-gray-900 rounded-[20px] p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Projected CGPA
                </span>
                <span className={cn(
                  "text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border",
                  cgpaDelta > 0 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40"
                    : cgpaDelta < 0
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                )}>
                  {cgpaDelta > 0 ? `+${cgpaDelta.toFixed(2)} CGPA` : `${cgpaDelta.toFixed(2)} CGPA`}
                </span>
              </div>

              <div className="my-1 flex items-baseline gap-2">
                <span className="text-[32px] font-black text-gray-900 dark:text-gray-100 leading-none tracking-tight">
                  {projectedCGPA.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  from {baselineCGPA.toFixed(2)}
                </span>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <span>Completed: {baselineHours + totalSemesterUnits} Units</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Total Career</span>
              </div>
            </div>

          </div>

          {/* Action Header & Target Auto-Fill Button */}
          <div className="bg-white dark:bg-gray-900 rounded-[20px] p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#003cbb] dark:text-[#4d82ff] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                  Target Course Grades for {targetSemesterGPA.toFixed(2)} GPA
                </h4>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Below are the target grades needed per course to achieve your desired semester GPA.
                </p>
              </div>
            </div>

            <Button
              onClick={applyTargetGrades}
              className="bg-[#003cbb] hover:bg-[#003095] dark:bg-[#4d82ff] dark:hover:bg-[#3b71eb] text-white rounded-xl h-10 px-4 text-[13px] font-semibold flex items-center gap-2 shrink-0 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Apply Target Grades to Simulator</span>
            </Button>
          </div>

          {/* Course Sandbox Table */}
          <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col shrink-0">
            <div className="px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100">
                Simulated Courses ({courses.length})
              </span>
              <Button 
                onClick={addCourse}
                variant="outline"
                className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl h-8 text-[12px] font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Course
              </Button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {courses.map((course) => {
                const targetGradeNeeded = requiredTargetGrades[course.id] || "A";
                return (
                  <div 
                    key={course.id} 
                    className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-800 rounded-xl p-4 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                  >
                    {/* Course Code & Target Requirement Badge */}
                    <div className="w-full lg:w-[180px] shrink-0">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 lg:hidden">Course Code</label>
                      <input 
                        type="text" 
                        value={course.code}
                        onChange={(e) => updateCourse(course.id, { code: e.target.value.toUpperCase() })}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[14px] font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#003cbb]"
                      />
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-[#003cbb] dark:text-[#4d82ff] bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                          Needs: {targetGradeNeeded} Grade
                        </span>
                      </div>
                    </div>

                    {/* Credit Units */}
                    <div className="w-full lg:w-[120px] shrink-0">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Credit Units</label>
                      <select
                        value={course.units}
                        onChange={(e) => updateCourse(course.id, { units: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#003cbb]"
                      >
                        {[1, 2, 3, 4, 5, 6].map((u) => (
                          <option key={u} value={u}>{u} {u === 1 ? 'Unit' : 'Units'}</option>
                        ))}
                      </select>
                    </div>

                    {/* Interactive Grade Selector (A, B, C, D, E, F) */}
                    <div className="w-full flex-1">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Simulated Grade</label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {["A", "B", "C", "D", "E", "F"].map((grade) => {
                          const isSelected = course.grade === grade;
                          const isTarget = targetGradeNeeded === grade;
                          return (
                            <button
                              key={grade}
                              type="button"
                              onClick={() => updateCourse(course.id, { grade })}
                              className={cn(
                                "py-2 text-[13px] font-bold rounded-lg border transition-all flex flex-col items-center justify-center relative",
                                isSelected 
                                  ? "bg-[#003cbb] border-[#003cbb] text-white shadow-sm scale-[1.02]" 
                                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                            >
                              <span>{grade}</span>
                              <span className="text-[9px] opacity-75 font-normal">
                                ({GRADE_POINTS[grade]}.0)
                              </span>
                              {isTarget && !isSelected && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900" title="Target grade needed" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delete Course Button */}
                    <button 
                      onClick={() => removeCourse(course.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors shrink-0 self-end lg:self-center mt-2 lg:mt-0"
                      aria-label="Remove course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal Summary & Impact Callout */}
          <div className={cn(
            "p-5 rounded-[20px] border flex items-start gap-4 transition-colors shadow-sm shrink-0",
            isTargetMet 
              ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200"
              : isTargetClose
                ? "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
                : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200"
          )}>
            {isTargetMet ? (
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h5 className="font-bold text-[15px] leading-snug">
                {isTargetMet 
                  ? `🎉 You are on track to achieve a ${simulatedSemesterGPA.toFixed(2)} Semester GPA!` 
                  : isTargetClose 
                    ? `✨ Close to target! Current simulated GPA: ${simulatedSemesterGPA.toFixed(2)}` 
                    : `💪 Additional effort required to reach ${targetSemesterGPA.toFixed(2)} GPA`}
              </h5>
              <p className="text-[13px] mt-1 opacity-90 leading-relaxed">
                {isTargetMet 
                  ? `With these selected grades, your semester GPA will be ${simulatedSemesterGPA.toFixed(2)}, meeting your goal of ${targetSemesterGPA.toFixed(2)}. Your overall cumulative CGPA will increase from ${baselineCGPA.toFixed(2)} to ${projectedCGPA.toFixed(2)} (+${cgpaDelta.toFixed(2)}).`
                  : `Your selected grades yield a ${simulatedSemesterGPA.toFixed(2)} GPA. Click "Apply Target Grades to Simulator" above to automatically see what grades in each course will bring you to ${targetSemesterGPA.toFixed(2)} GPA.`}
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Baseline: <span className="font-bold text-gray-800 dark:text-gray-200">{baselineCGPA.toFixed(2)} CGPA</span> ({baselineHours} Units)
          </div>
          <Button 
            onClick={onClose}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl px-6 h-10 text-[13px] font-semibold"
          >
            Close Simulator
          </Button>
        </div>

      </div>
    </div>
  );
}
