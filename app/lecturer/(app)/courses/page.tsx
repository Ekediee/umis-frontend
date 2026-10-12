"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertTriangle, BookOpen, ChevronDown, ChevronRight, LayoutGrid, Rows3, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { formatSemester, plural } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import { useLecturer } from "@/components/lecturer/shell/lecturer-provider";
import { SemesterSwitcher } from "@/components/lecturer/shell/menus";
import { Page } from "@/components/lecturer/shell/page";
import { Btn, CardSkeleton, Chip, ErrorState, ExplainedEmpty, PageHeader, ProgressBar, Surface } from "@/components/lecturer/ui/primitives";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type View = "cards" | "table";

export default function CoursesPage() {
  return (
    <Suspense>
      <Courses />
    </Suspense>
  );
}

function Courses() {
  const { semester } = useLecturer();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // The view lives in the URL so it survives reloads and can be shared.
  const view: View = params.get("view") === "table" ? "table" : "cards";
  const setView = (v: View) => router.replace(v === "table" ? `${pathname}?view=table` : pathname, { scroll: false });
  const q = useLecturerQuery(semester ? `courses:${semester.code}` : null, () => lecturerApi.getCourses(semester!.code));
  const askHod = useMutation(() => lecturerApi.askHod(semester!.code));
  const [showEarlier, setShowEarlier] = useState(false);

  return (
    <Page>
      <div className="mb-4 md:hidden">
        <SemesterSwitcher compact />
      </div>
      <PageHeader
        title="My courses"
        description={semester ? `${formatSemester(semester)} · groups of the same course share one ${view === "table" ? "row" : "card"}` : undefined}
        actions={<ViewToggle value={view} onChange={setView} />}
      />

      {q.error && <ErrorState error={q.error} screen="My Courses" onRetry={q.refetch} />}
      {q.isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      )}

      {q.data && q.data.current.length === 0 && (
        <ExplainedEmpty
          icon={BookOpen}
          title={`No courses assigned for ${formatSemester(semester!)}`}
          reason="Allocation usually lands in week 1. Your HOD assigns courses."
          action={
            <Btn
              icon={Send}
              loading={askHod.pending}
              onClick={async () => {
                const r = await askHod.mutate();
                if (r) toast.success(r.message);
              }}
            >
              Ask my HOD
            </Btn>
          }
        />
      )}

      {q.data && q.data.current.length > 0 && view === "table" && <CourseTable courses={q.data.current} />}

      {q.data && q.data.current.length > 0 && view === "cards" && (
        <ul className="grid gap-4 md:grid-cols-2">
          {q.data.current.map((c) => (
            <li key={c.id}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      )}

      {q.data && q.data.earlier.length > 0 && (
        <section className="mt-8">
          <button type="button" onClick={() => setShowEarlier((v) => !v)} aria-expanded={showEarlier} className="flex min-h-[44px] items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-gray-100">
            <ChevronDown className={cn("size-4 transition-transform", !showEarlier && "-rotate-90")} />
            Earlier
            <span className="text-[13px] font-medium text-gray-500">{plural(q.data.earlier.length, "course")}</span>
          </button>
          {showEarlier && (
            <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {q.data.earlier.map((c) => (
                <li key={c.id}>
                  <Link href={`/lecturer/courses/${c.id}`} className="flex min-h-[60px] items-center gap-3 px-5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">
                        {c.code} · {c.title}
                      </span>
                      <span className="block text-[12px] text-gray-500">
                        {formatSemester(c.semesterCode)} · {c.groups.map((g) => g.option).join(", ")} · {plural(c.enrolledTotal, "student")}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Page>
  );
}

function CourseCard({ course: c }: { course: CourseSummary }) {
  const report = useMutation(() => lecturerApi.reportDuplicate(c.id));
  return (
    <Surface padded={false} className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/lecturer/courses/${c.id}`} className="flex flex-1 flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold tracking-wide text-[#003cbb] dark:text-[#7aa2ff]">{c.code}</p>
            <h2 className="mt-0.5 text-[17px] leading-snug font-bold text-gray-900 dark:text-gray-50">{c.title}</h2>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-gray-300" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="neutral" icon={Users}>
            {plural(c.enrolledTotal, "student")}
          </Chip>
          <Chip tone="neutral" noIcon>
            {c.groups.length > 1 ? `${c.groups.length} groups: ${c.groups.map((g) => g.label).join(", ")}` : c.groups[0].option}
          </Chip>
          <Chip tone="neutral" noIcon>
            {plural(c.credits, "credit")}
          </Chip>
          {!c.isGradeOwner && <Chip tone="purple">Co-taught · not grade owner</Chip>}
        </div>
        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Week {c.week} of {c.totalWeeks} · CA {c.caGraded} of {c.caPlanned} graded
            </span>
            <span className="text-gray-500">Attendance {c.attendanceAvg}%</span>
          </div>
          <ProgressBar value={c.week} max={c.totalWeeks} label={`Week ${c.week} of ${c.totalWeeks}`} />
        </div>
      </Link>
      {c.dataIssue && (
        <div className="flex flex-wrap items-center gap-2 border-t border-amber-100 bg-amber-50/70 px-5 py-3 text-[12px] text-amber-900 md:px-6 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">Same title as {c.dataIssue.otherCode}. Codes should be unique; this is likely a data error.</span>
          <button
            type="button"
            disabled={report.pending}
            onClick={async () => {
              const r = await report.mutate();
              if (r) toast.success("Sent to your department admin", { description: `They'll decide whether to merge. Reference ${r.reference}. We never merge on our own.` });
            }}
            className="min-h-[36px] font-semibold underline-offset-2 hover:underline disabled:opacity-50"
          >
            Report a duplicate
          </button>
        </div>
      )}
    </Surface>
  );
}

function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const options: { value: View; label: string; icon: typeof LayoutGrid }[] = [
    { value: "cards", label: "Cards", icon: LayoutGrid },
    { value: "table", label: "Table", icon: Rows3 },
  ];
  return (
    <div role="radiogroup" aria-label="View" className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold transition-colors",
              active ? "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
            )}
          >
            <o.icon className="size-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Table view: the student app's shared Table, styled like its timetable list view. */
function CourseTable({ courses }: { courses: CourseSummary[] }) {
  const router = useRouter();
  const report = useMutation((id: string) => lecturerApi.reportDuplicate(id));
  const head = "text-[12px] font-semibold tracking-wider text-gray-500 uppercase";

  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <Table className="min-w-[880px]">
        <TableHeader className="bg-[#F8FAFC] dark:bg-gray-800/50">
          <TableRow className="border-b-gray-100 hover:bg-transparent dark:border-b-gray-800">
            <TableHead className={cn(head, "min-w-[240px] pl-5")}>Course</TableHead>
            <TableHead className={head}>Groups</TableHead>
            <TableHead className={cn(head, "text-right")}>Students</TableHead>
            <TableHead className={cn(head, "text-right")}>Credits</TableHead>
            <TableHead className={cn(head, "w-[170px]")}>Progress</TableHead>
            <TableHead className={cn(head, "text-right")}>Attendance</TableHead>
            <TableHead className={head}>Notes</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((c) => (
            <TableRow
              key={c.id}
              onClick={() => router.push(`/lecturer/courses/${c.id}`)}
              className="cursor-pointer border-b-gray-100 transition-colors hover:bg-gray-50 dark:border-b-gray-800 dark:hover:bg-gray-800/50"
            >
              <TableCell className="pl-5">
                {/* A real link keeps keyboard and middle-click navigation working. */}
                <Link href={`/lecturer/courses/${c.id}`} onClick={(e) => e.stopPropagation()} className="flex flex-col outline-none focus-visible:underline">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{c.code}</span>
                  <span className="mt-0.5 text-xs whitespace-normal text-gray-500 dark:text-gray-400">{c.title}</span>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-300">
                {c.groups.length > 1 ? (
                  <span className="flex flex-col">
                    <span className="font-medium">{plural(c.groups.length, "group")}</span>
                    <span className="text-xs text-gray-500">{c.groups.map((g) => g.label).join(", ")}</span>
                  </span>
                ) : (
                  c.groups[0].option
                )}
              </TableCell>
              <TableCell className="text-right font-medium text-gray-900 tabular-nums dark:text-gray-100">{c.enrolledTotal}</TableCell>
              <TableCell className="text-right text-gray-700 tabular-nums dark:text-gray-300">{c.credits}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                    Week {c.week}/{c.totalWeeks} · CA {c.caGraded}/{c.caPlanned}
                  </span>
                  <ProgressBar value={c.week} max={c.totalWeeks} className="h-1.5" label={`Week ${c.week} of ${c.totalWeeks}`} />
                </div>
              </TableCell>
              <TableCell className={cn("text-right font-semibold tabular-nums", c.attendanceAvg < 75 ? "text-amber-600" : "text-gray-900 dark:text-gray-100")}>{c.attendanceAvg}%</TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex flex-col items-start gap-1">
                  {!c.isGradeOwner && <Chip tone="purple">Co-taught</Chip>}
                  {c.dataIssue && (
                    <button
                      type="button"
                      disabled={report.pending}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const r = await report.mutate(c.id).catch(() => undefined);
                        if (r) toast.success("Sent to your department admin", { description: `Same title as ${c.dataIssue!.otherCode}. Reference ${r.reference}.` });
                      }}
                      title={`Same title as ${c.dataIssue.otherCode}. Codes should be unique.`}
                      className="inline-flex min-h-[28px] items-center gap-1 text-xs font-semibold text-amber-700 hover:underline disabled:opacity-50 dark:text-amber-300"
                    >
                      <AlertTriangle className="size-3.5 shrink-0" /> Duplicate? Report
                    </button>
                  )}
                  {!c.dataIssue && c.isGradeOwner && <span className="text-xs text-gray-400">—</span>}
                </div>
              </TableCell>
              <TableCell className="pr-4">
                <ChevronRight className="size-4 text-gray-300" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
