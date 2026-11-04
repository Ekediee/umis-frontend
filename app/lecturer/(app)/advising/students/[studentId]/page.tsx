"use client";

/**
 * Advisee record: overview, unofficial transcript, current CA scores and the
 * course audit, so the advisor can advise from one screen.
 */

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName } from "@/lib/lecturer/format";
import { useLecturerQuery } from "@/lib/lecturer/query";
import { auditCourses } from "@/lib/lecturer/rules";
import { Page } from "@/components/lecturer/shell/page";
import { AuditTab, CurrentCoursesTab, OverviewTab, TranscriptTab } from "@/components/lecturer/advising/advisee-record";
import { REGISTRATION_STATUS } from "@/components/lecturer/advising/advisee-roster";
import { CardSkeleton, Chip, ErrorState, LineTabs, PageHeader } from "@/components/lecturer/ui/primitives";

type Tab = "overview" | "transcript" | "current" | "audit";

export default function AdviseeRecordPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const q = useLecturerQuery(`advising:student:${studentId}`, () => lecturerApi.getAdviseeRecord(studentId));
  const [tab, setTab] = useState<Tab>("overview");

  const audit = useMemo(() => {
    if (!q.data) return null;
    const r = q.data.registration;
    const registered = r.status === "not_submitted" ? null : r.courses.map((c) => c.code);
    return auditCourses(q.data.curriculum, q.data.transcript, registered, { level: q.data.student.level, semester: q.data.term.semester });
  }, [q.data]);

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Advisee record" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data || !audit)
    return (
      <Page>
        <CardSkeleton rows={6} />
      </Page>
    );

  const record = q.data;
  const s = record.student;
  const status = REGISTRATION_STATUS[record.registration.status];

  return (
    <Page className="max-w-[960px] pb-24">
      <PageHeader
        back={{ href: "/lecturer/advising", label: "Advising" }}
        title={fullName(s)}
        description={`${s.matric} · ${s.programme} · Level ${s.level}`}
        actions={
          <Chip tone={status.tone} noIcon>
            {status.label}
          </Chip>
        }
      />
      <div className="mb-5">
        <LineTabs
          ariaLabel="Advisee record"
          value={tab}
          onChange={setTab}
          options={[
            { value: "overview", label: "Overview" },
            { value: "transcript", label: "Transcript" },
            { value: "current", label: "Current courses" },
            { value: "audit", label: "Course audit", badge: audit.counts.failed + audit.counts.missing },
          ]}
        />
      </div>
      {tab === "overview" && <OverviewTab record={record} audit={audit} onOpen={setTab} />}
      {tab === "transcript" && <TranscriptTab record={record} />}
      {tab === "current" && <CurrentCoursesTab record={record} />}
      {tab === "audit" && <AuditTab record={record} audit={audit} />}
    </Page>
  );
}
