"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import type { CourseSummary } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { relativeDays, shortDate } from "@/lib/lecturer/format";
import { deadlineUrgency } from "@/lib/lecturer/rules";
import type { GradeSheet } from "@/lib/lecturer/types";
import { Chip, ExplainedEmpty, Surface } from "../ui/primitives";
import { SheetStatusChip } from "../grades/status";

export function GradesTab({ course, sheets }: { course: CourseSummary; sheets: GradeSheet[] }) {
  const now = appNow();
  if (!sheets.length) {
    return <ExplainedEmpty title="No grade sheets yet" reason="The registry opens grade sheets when the grade window starts. You'll get an email and a Today card." />;
  }
  return (
    <div className="flex flex-col gap-3">
      {!course.isGradeOwner && (
        <p className="flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-3 text-[13px] text-purple-800 dark:bg-purple-950/40 dark:text-purple-200">
          <Lock className="size-4" /> {course.coLecturers.find((c) => c.includes("grade owner")) ?? "Your co-lecturer"} owns grades for this course. You can enter scores; they submit.
        </p>
      )}
      <ul className="flex flex-col gap-2.5">
        {sheets.map((s) => {
          const g = course.groups.find((x) => x.id === s.groupId)!;
          return (
            <li key={s.id}>
              <Link href={`/lecturer/courses/${course.id}/grades?group=${encodeURIComponent(s.groupId)}`}>
                <Surface className="flex items-center gap-4 transition-shadow hover:shadow-md">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{g.option}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <SheetStatusChip status={s.status} />
                      {s.status === "open" && (
                        <Chip tone={deadlineUrgency(s.dueDate, now, 7) === "normal" ? "neutral" : "amber"} noIcon>
                          Due {shortDate(s.dueDate)} · {relativeDays(s.dueDate, now)}
                        </Chip>
                      )}
                      {s.status === "returned" && <span className="text-[13px] text-red-700 dark:text-red-300">{s.returnNote}</span>}
                    </div>
                  </div>
                  <span className="text-[13px] text-gray-500">{g.enrolled} students</span>
                  <ChevronRight className="size-5 text-gray-300" />
                </Surface>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="text-[12px] text-gray-500">Grades round half up before the letter is applied: A 70–100, B 60–69, C 50–59, D 45–49, E 40–44, F below 40.</p>
    </div>
  );
}
