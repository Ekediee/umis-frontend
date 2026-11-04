"use client";

/**
 * Advising · All students: every student in the advisor's level, whatever
 * their registration stage, with failed and missing courses at a glance.
 * Each row opens the student's record (transcript, current scores, course audit).
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronRight, Users, XCircle } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName, plural } from "@/lib/lecturer/format";
import { useLecturerQuery } from "@/lib/lecturer/query";
import type { AdviseeSummary, RegistrationStatus } from "@/lib/lecturer/types";
import { CardSkeleton, Chip, ErrorState, ExplainedEmpty, PersonAvatar, Segmented, type Tone } from "@/components/lecturer/ui/primitives";

export const REGISTRATION_STATUS: Record<RegistrationStatus, { label: string; tone: Tone }> = {
  to_review: { label: "To review", tone: "blue" },
  returned: { label: "Returned", tone: "amber" },
  approved_advisor: { label: "Approved by you", tone: "green" },
  approved_school: { label: "Approved by school", tone: "green" },
  not_submitted: { label: "Not submitted", tone: "neutral" },
};

type Filter = "all" | "failed" | "missing" | "probation";

export function AdviseeRoster({ level, term }: { level: number; term: string }) {
  const q = useLecturerQuery(`advising:students:${level}`, () => lecturerApi.getAdviseeRoster(level));
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const list = q.data?.students ?? [];
    const match: Record<Filter, (s: AdviseeSummary) => boolean> = {
      all: () => true,
      failed: (s) => s.failedOutstanding > 0,
      missing: (s) => s.missingCore > 0,
      probation: (s) => s.standing !== "Good",
    };
    const t = term.trim().toLowerCase();
    return list
      .filter(match[filter])
      .filter((s) => !t || `${fullName(s.student)} ${s.student.matric}`.toLowerCase().includes(t))
      .sort((a, b) => b.failedOutstanding + b.missingCore - (a.failedOutstanding + a.missingCore) || a.student.lastName.localeCompare(b.student.lastName));
  }, [q.data, filter, term]);

  if (q.error) return <ErrorState error={q.error} screen="All students" onRetry={q.refetch} />;
  if (!q.data) return <CardSkeleton rows={6} />;

  const all = q.data.students;
  return (
    <div className="pb-24">
      <Segmented
        ariaLabel="Filter students"
        size="sm"
        value={filter}
        onChange={setFilter}
        className="mb-4"
        options={[
          { value: "all", label: "Everyone", count: all.length },
          { value: "failed", label: "Failed courses", count: all.filter((s) => s.failedOutstanding > 0).length },
          { value: "missing", label: "Missing courses", count: all.filter((s) => s.missingCore > 0).length },
          { value: "probation", label: "On probation", count: all.filter((s) => s.standing !== "Good").length },
        ]}
      />
      {rows.length === 0 ? (
        <ExplainedEmpty compact icon={Users} title="Nobody here" reason={term ? "No student matches your search." : "No student in this group."} />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((s) => {
            const status = REGISTRATION_STATUS[s.status];
            return (
              <li key={s.student.id}>
                <Link
                  href={`/lecturer/advising/students/${s.student.id}`}
                  className="flex min-h-[72px] items-center gap-3 rounded-[20px] border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                >
                  <PersonAvatar first={s.student.firstName} last={s.student.lastName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{fullName(s.student)}</p>
                    <p className="truncate text-[12px] text-gray-500">
                      {s.student.matric} · {s.cgpa !== null ? `CGPA ${s.cgpa.toFixed(2)}` : "No results yet"}
                      {s.units > 0 && ` · ${s.units} units`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Chip tone={status.tone} noIcon>
                        {status.label}
                      </Chip>
                      {s.failedOutstanding > 0 && (
                        <Chip tone="red" icon={XCircle}>
                          {plural(s.failedOutstanding, "failed course")}
                        </Chip>
                      )}
                      {s.missingCore > 0 && (
                        <Chip tone="amber" icon={AlertTriangle}>
                          {plural(s.missingCore, "missing course")}
                        </Chip>
                      )}
                      {s.standing !== "Good" && <Chip tone="amber">{s.standing}</Chip>}
                    </div>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-gray-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
