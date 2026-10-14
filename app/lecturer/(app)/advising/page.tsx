"use client";

/**
 * 6.1 Advisees: registrations · 6.1a nothing to review · 6.4 bulk approve.
 * Only rows with every check passed can be bulk-approved; the rest need a
 * single decision (guards against approve-without-looking).
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { BellRing, Check, CheckCircle2, ChevronRight, ClipboardCheck, RefreshCcw, Search, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, fullName, plural, shortDate, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import { allChecksPassed, RETURN_REASON_LABELS } from "@/lib/lecturer/rules";
import type { Registration, RegistrationStatus } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Page } from "@/components/lecturer/shell/page";
import { ReturnSheet } from "@/components/lecturer/advising/return-sheet";
import { Btn, CardSkeleton, Checkbox, Chip, ErrorState, ExplainedEmpty, Input, PersonAvatar, Segmented } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

const SEGMENTS: { value: RegistrationStatus; label: string }[] = [
  { value: "to_review", label: "To review" },
  { value: "returned", label: "Returned" },
  { value: "approved_advisor", label: "Approved by you" },
  { value: "approved_school", label: "Approved by school" },
  { value: "not_submitted", label: "Not submitted" },
];

export default function AdvisingPage() {
  const q = useLecturerQuery("advising", () => lecturerApi.getAdvising());
  const [segment, setSegment] = useState<RegistrationStatus>("to_review");
  const [checkFilter, setCheckFilter] = useState<"all" | "passed" | "failed">("all");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [returning, setReturning] = useState<Registration | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const approve = useMutation(lecturerApi.approveRegistrations, { invalidates: ["advising", "today:"] });
  const remind = useMutation(lecturerApi.remindNotSubmitted);
  const now = appNow();

  const counts = useMemo(() => {
    const c = Object.fromEntries(SEGMENTS.map((s) => [s.value, 0])) as Record<RegistrationStatus, number>;
    q.data?.registrations.forEach((r) => c[r.status]++);
    return c;
  }, [q.data]);

  const rows = useMemo(() => {
    let list = (q.data?.registrations ?? []).filter((r) => r.status === segment);
    if (segment === "to_review" && checkFilter !== "all") list = list.filter((r) => (checkFilter === "passed" ? allChecksPassed(r) : !allChecksPassed(r)));
    const t = term.trim().toLowerCase();
    if (t) list = list.filter((r) => `${fullName(r.student)} ${r.student.matric}`.toLowerCase().includes(t));
    // Resubmitted first, then oldest submission first.
    return [...list].sort((a, b) => Number(!!b.resubmitted) - Number(!!a.resubmitted) || (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  }, [q.data, segment, checkFilter, term]);

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Course advising" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={6} />
      </Page>
    );

  const { window: w } = q.data;
  const daysLeft = daysBetween(now, w.closesAt);
  const eligible = rows.filter((r) => r.status === "to_review" && allChecksPassed(r));
  const selectedRows = eligible.filter((r) => selected.has(r.id));

  const approveOne = async (r: Registration) => {
    const res = await approve.mutate([r.id]).catch(() => undefined);
    if (res?.approved.length) toast.success(`Approved ${fullName(r.student)}`, { description: "Sent to the school officer." });
  };

  return (
    <Page>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-500">Course advising</p>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 md:text-[26px] dark:text-gray-50">
            Level {w.level} · {w.advisees} advisees
          </h1>
        </div>
        <div className={cn("inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-[14px] font-semibold", daysLeft <= 2 ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : daysLeft <= 7 ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-white text-gray-800 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:ring-gray-800")}>
          Closes {shortDate(w.closesAt)} · {plural(daysLeft, "day")} left
        </div>
      </div>

      <Segmented ariaLabel="Registration stage" value={segment} onChange={(s) => (setSegment(s), setSelected(new Set()))} options={SEGMENTS.map((s) => ({ ...s, count: counts[s.value] }))} className="mb-4" />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-[300px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search name or matric" className="pl-10" aria-label="Search advisees" />
        </div>
        {segment === "to_review" && (
          <Segmented
            ariaLabel="Check result"
            size="sm"
            value={checkFilter}
            onChange={setCheckFilter}
            options={[
              { value: "all", label: "All" },
              { value: "passed", label: "Checks passed", count: q.data.registrations.filter((r) => r.status === "to_review" && allChecksPassed(r)).length },
              { value: "failed", label: "Check failed", count: q.data.registrations.filter((r) => r.status === "to_review" && !allChecksPassed(r)).length },
            ]}
          />
        )}
        {segment === "not_submitted" && counts.not_submitted > 0 && (
          <Btn
            className="sm:ml-auto"
            variant="secondary"
            icon={BellRing}
            loading={remind.pending}
            onClick={async () => {
              const r = await remind.mutate().catch(() => undefined);
              if (r) toast.success(`Reminded ${plural(r.reminded, "student")} by push and email`, { description: "You can remind them again tomorrow." });
            }}
          >
            Remind them
          </Btn>
        )}
      </div>

      {segment === "to_review" && counts.to_review === 0 ? (
        <ExplainedEmpty
          icon={CheckCircle2}
          title="All submitted registrations are decided"
          reason={`${plural(counts.not_submitted, "student")} haven't submitted yet.`}
          action={
            counts.not_submitted > 0 && (
              <Btn icon={BellRing} loading={remind.pending} onClick={() => remind.mutate().then((r) => toast.success(`Reminded ${plural(r!.reminded, "student")}`))}>
                Remind them
              </Btn>
            )
          }
        />
      ) : rows.length === 0 ? (
        <ExplainedEmpty compact icon={ClipboardCheck} title="Nobody here" reason={term ? "No advisee matches your search." : "No registrations at this stage."} />
      ) : (
        <ul className="flex flex-col gap-2.5 pb-24">
          {rows.map((r) => {
            const passed = allChecksPassed(r);
            const failed = r.checks.filter((c) => !c.passed);
            const canSelect = r.status === "to_review" && passed;
            return (
              <li key={r.id} className={cn("flex items-center gap-1 rounded-[20px] border bg-white pr-3 dark:bg-gray-900", selected.has(r.id) ? "border-[#003cbb] ring-2 ring-[#003cbb]/10" : "border-gray-200 dark:border-gray-800")}>
                {r.status === "to_review" ? (
                  <Checkbox label={canSelect ? `Select ${fullName(r.student)}` : `${fullName(r.student)} needs a single decision`} checked={selected.has(r.id)} disabled={!canSelect} onChange={(v) => setSelected((s) => (v ? new Set(s).add(r.id) : new Set([...s].filter((id) => id !== r.id))))} className="ml-1" />
                ) : (
                  <span className="w-3" />
                )}
                <Link href={`/lecturer/advising/${r.id}`} className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3">
                  <PersonAvatar first={r.student.firstName} last={r.student.lastName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                      {fullName(r.student)}
                      {r.resubmitted && (
                        <Chip tone="blue" icon={RefreshCcw} className="h-5 text-[11px]">
                          Resubmitted
                        </Chip>
                      )}
                    </p>
                    <p className="truncate text-[12px] text-gray-500">
                      {r.student.matric} · {r.student.programme} · {r.courses.reduce((s, c) => s + c.units, 0)} units{r.submittedAt && ` · ${timeAgo(r.submittedAt, now)}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.status === "to_review" &&
                        (passed ? (
                          <Chip tone="green" icon={Check}>
                            All checks passed
                          </Chip>
                        ) : (
                          <Chip tone="red" icon={XCircle}>
                            {failed[0].detail?.split(";")[0] ?? failed[0].label}
                          </Chip>
                        ))}
                      {r.returned && <Chip tone="amber">{r.returned.reasons.map((x) => RETURN_REASON_LABELS[x]).join(", ")}</Chip>}
                    </div>
                  </div>
                </Link>
                {r.status === "to_review" && (
                  <div className="hidden gap-2 md:flex">
                    <Btn size="sm" variant="secondary" icon={Undo2} onClick={() => setReturning(r)}>
                      Return
                    </Btn>
                    {passed && (
                      <Btn size="sm" variant="success" icon={Check} disabled={approve.pending} onClick={() => approveOne(r)}>
                        Approve
                      </Btn>
                    )}
                  </div>
                )}
                <ChevronRight className="size-5 shrink-0 text-gray-300 md:hidden" />
              </li>
            );
          })}
        </ul>
      )}

      {/* Floating pill action bar (Linktree-style) */}
      {segment === "to_review" && eligible.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[92px] z-40 flex justify-center px-4 md:bottom-8 md:pl-64">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-gray-900 p-1.5 pl-5 text-white shadow-2xl dark:bg-white dark:text-gray-900">
            <span className="text-[13px] font-semibold">{selectedRows.length ? `${selectedRows.length} selected` : `${eligible.length} passed every check`}</span>
            {selectedRows.length === 0 ? (
              <button type="button" onClick={() => setSelected(new Set(eligible.map((r) => r.id)))} className="h-10 rounded-full bg-white/15 px-4 text-[13px] font-semibold hover:bg-white/25 dark:bg-gray-900/10">
                Select all
              </button>
            ) : (
              <button type="button" onClick={() => setBulkOpen(true)} className="h-10 rounded-full bg-emerald-500 px-4 text-[13px] font-bold text-white hover:bg-emerald-600">
                Approve {selectedRows.length}
              </button>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        size="sm"
        title={`Approve ${plural(selectedRows.length, "registration")}?`}
        description="All passed checks. They go to the school officer. Each decision is logged with time."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setBulkOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="success"
              loading={approve.pending}
              onClick={async () => {
                const r = await approve.mutate(selectedRows.map((x) => x.id)).catch(() => undefined);
                if (r) toast.success(`Approved ${plural(r.approved.length, "registration")}`, { description: r.refused.length ? `${r.refused.length} need a single decision.` : undefined });
                setSelected(new Set());
                setBulkOpen(false);
              }}
            >
              Approve {selectedRows.length}
            </Btn>
          </>
        }
      >
        <ul className="max-h-[260px] overflow-y-auto text-[14px] text-gray-700 dark:text-gray-300">
          {selectedRows.map((r) => (
            <li key={r.id} className="flex justify-between border-b border-gray-100 py-2 dark:border-gray-800">
              {fullName(r.student)} <span className="text-gray-400">{r.student.matric}</span>
            </li>
          ))}
        </ul>
      </Sheet>
      <ReturnSheet registration={returning} onClose={() => setReturning(null)} />
    </Page>
  );
}
