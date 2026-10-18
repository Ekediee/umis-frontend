"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ScanLine } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { formatSemester, plural, localDate } from "@/lib/lecturer/format";
import { useLecturerQuery } from "@/lib/lecturer/query";
import { Page } from "../shell/page";
import { BackButton, BtnLink, ErrorState, LineTabs, Segmented } from "../ui/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewTab } from "./overview-tab";
import { StudentsTab } from "./students-tab";
import { MaterialsTab } from "./materials-tab";
import { AssessmentsTab } from "./assessments-tab";
import { GradesTab } from "./grades-tab";
import { QaTab } from "./qa-tab";

export type CourseTab = "overview" | "students" | "materials" | "assessments" | "grades" | "qa";
const TABS: CourseTab[] = ["overview", "students", "materials", "assessments", "grades", "qa"];

export function useCourseParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const set = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );
  const tab = (TABS.includes(params.get("tab") as CourseTab) ? params.get("tab") : "overview") as CourseTab;
  return { tab, group: params.get("group") ?? "all", params, set };
}

export function CourseWorkspace({ courseId }: { courseId: string }) {
  const { tab, group, set } = useCourseParams();
  const q = useLecturerQuery(`course:${courseId}`, () => lecturerApi.getCourse(courseId));
  const c = q.data?.course;

  if (q.error) {
    return (
      <Page>
        <ErrorState error={q.error} screen="Course" onRetry={q.refetch} />
      </Page>
    );
  }

  return (
    <Page>
      {!c ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <BackButton href="/lecturer/courses" to="My courses" className="mb-4" />
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-[13px] font-bold tracking-wide text-[#003cbb] dark:text-[#7aa2ff]">
                {c.code} · {formatSemester(c.semesterCode)}
              </p>
              <h1 className="mt-0.5 text-[22px] leading-tight font-bold tracking-tight text-gray-900 md:text-[26px] dark:text-gray-50">{c.title}</h1>
              <p className="mt-1 text-[13px] text-gray-500">
                {plural(c.enrolledTotal, "student")} · {plural(c.credits, "credit")} · Week {c.week} of {c.totalWeeks}
                {c.coLecturers.length > 0 && <> · With {c.coLecturers.join(", ")}</>}
              </p>
            </div>
            {q.data?.nextSession && (
              <BtnLink href={`/lecturer/courses/${c.id}/attendance?session=${q.data.nextSession.id}&date=${localDate(q.data.nextSession.startsAt)}`} icon={ScanLine}>
                Take attendance
              </BtnLink>
            )}
          </div>

          {c.groups.length > 1 && (
            <Segmented
              ariaLabel="Group filter"
              size="sm"
              className="mb-3"
              value={group}
              onChange={(g) => set({ group: g === "all" ? null : g })}
              options={[{ value: "all", label: "All groups", count: c.enrolledTotal }, ...c.groups.map((g) => ({ value: g.id, label: g.label.length <= 2 ? `Group ${g.label}` : g.label, count: g.enrolled }))]}
            />
          )}

          <LineTabs
            ariaLabel="Course sections"
            value={tab}
            onChange={(t) => set({ tab: t, student: null })}
            options={[
              { value: "overview", label: "Overview" },
              { value: "students", label: "Students" },
              { value: "materials", label: "Materials" },
              { value: "assessments", label: "Assessments" },
              { value: "grades", label: "Grades" },
              { value: "qa", label: "Q&A", badge: q.data?.unansweredQuestions },
            ]}
          />
          <div className="pt-5">
            {tab === "overview" && q.data && <OverviewTab data={q.data} group={group} />}
            {tab === "students" && <StudentsTab course={c} group={group} />}
            {tab === "materials" && <MaterialsTab course={c} />}
            {tab === "assessments" && <AssessmentsTab course={c} />}
            {tab === "grades" && q.data && <GradesTab course={c} sheets={q.data.gradeSheets} />}
            {tab === "qa" && <QaTab course={c} />}
          </div>
        </>
      )}
    </Page>
  );
}
