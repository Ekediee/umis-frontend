"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CourseItem,
  getHasSubmittedCoursesAction,
  getRegisteredCoursesAction,
} from "@/app/actions/registration";

const GENERAL_COURSE_PREFIXES = ["GEDS", "BU-GST", "GST"];

function isGeneralCourse(codeOrId: string): boolean {
  const normalized = codeOrId.trim().toUpperCase();
  return GENERAL_COURSE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function CurrentSemesterRegistration() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRegistrationSummary() {
      setIsLoading(true);
      try {
        const [submissionRes, coursesRes] = await Promise.all([
          getHasSubmittedCoursesAction(),
          getRegisteredCoursesAction(),
        ]);

        if (cancelled) return;

        const submitted = submissionRes.data
          ? submissionRes.data.hasSubmitted
          : (coursesRes.data?.length ?? 0) > 0;

        setHasSubmitted(submitted);
        setCourses(submitted && coursesRes.data ? coursesRes.data : []);
      } catch (error) {
        console.error("Failed to load current semester registration summary:", error);
        if (!cancelled) {
          setHasSubmitted(false);
          setCourses([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRegistrationSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCourses = hasSubmitted ? courses : [];
  const rawTotalUnits = activeCourses.reduce(
    (sum, course) => sum + (Number(course.units) || 0),
    0
  );
  const registeredUnits = Number.isInteger(rawTotalUnits)
    ? rawTotalUnits
    : Number(rawTotalUnits.toFixed(1));
  const totalCourses = activeCourses.length;
  const generalCourses = activeCourses.filter((course) =>
    isGeneralCourse(course.code || course.id)
  ).length;
  const coreCourses = totalCourses - generalCourses;

  return (
    <Card className="rounded-[24px] border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100 mb-8">Current Semester Registration</h3>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Registered Units:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">
              {isLoading ? "—" : registeredUnits}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Total Semester course:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">
              {isLoading ? "—" : totalCourses}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">Core Courses:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">
              {isLoading ? "—" : coreCourses}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-medium text-[#4a5565] dark:text-gray-400">General Courses:</span>
            <span className="text-[14px] font-normal text-[#4a5565] dark:text-gray-200">
              {isLoading ? "—" : generalCourses}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
