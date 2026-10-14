"use client";

/** 6.2 Registration detail with automatic checks · 6.2a a check failed → return with reason pre-filled. */

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Check, CheckCircle2, MessageSquare, RefreshCcw, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { fullName, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import { allChecksPassed, RETURN_REASON_LABELS } from "@/lib/lecturer/rules";
import { Page } from "@/components/lecturer/shell/page";
import { ReturnSheet } from "@/components/lecturer/advising/return-sheet";
import { Btn, CardSkeleton, Chip, ErrorState, KeyValue, PageHeader, PersonAvatar, Surface } from "@/components/lecturer/ui/primitives";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { not_submitted: "Not submitted", to_review: "To review", returned: "Returned", approved_advisor: "Approved by you", approved_school: "Approved by school" } as const;

export default function RegistrationDetailPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const router = useRouter();
  const q = useLecturerQuery(`advising:reg:${registrationId}`, () => lecturerApi.getRegistration(registrationId));
  const approve = useMutation(lecturerApi.approveRegistrations, { invalidates: ["advising", "today:"] });
  const [returning, setReturning] = useState(false);
  const now = appNow();

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Registration" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={6} />
      </Page>
    );

  const r = q.data;
  const s = r.student;
  const units = r.courses.reduce((t, c) => t + c.units, 0);
  const passed = allChecksPassed(r);
  const decidable = r.status === "to_review";

  return (
    <Page className="max-w-[900px] pb-32">
      <PageHeader back={{ href: "/lecturer/advising", label: "Registrations" }} title={fullName(s)} description={`${s.matric} · ${s.programme} · Level ${s.level}`} actions={<Chip tone={decidable ? "blue" : r.status === "returned" ? "amber" : "green"}>{STATUS_LABEL[r.status]}</Chip>} />

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          {r.resubmitted && (
            <Surface className="border-[#003cbb]/20 bg-[#f5f8fe] dark:bg-[#003cbb]/10">
              <p className="flex items-center gap-2 text-[14px] font-bold text-[#0b2a72] dark:text-[#cfe0ff]">
                <RefreshCcw className="size-4" /> Resubmitted after your return. What changed:
              </p>
              <ul className="mt-2 list-disc pl-6 text-[14px] text-gray-700 dark:text-gray-300">
                {r.resubmitted.changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Surface>
          )}

          <Surface>
            <h2 className="mb-3 text-[16px] font-bold text-gray-900 dark:text-gray-100">Automatic checks</h2>
            <ul className="flex flex-col gap-1">
              {r.checks.map((c) => (
                <li key={c.id} className={cn("flex items-start gap-3 rounded-xl px-3 py-2.5", !c.passed && "bg-red-50 dark:bg-red-950/30")}>
                  {c.passed ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />}
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{c.label}</p>
                    {c.detail && <p className={cn("text-[13px]", c.passed ? "text-gray-500" : "font-medium text-red-700 dark:text-red-300")}>{c.detail}</p>}
                  </div>
                  <span className="sr-only">{c.passed ? "passed" : "failed"}</span>
                </li>
              ))}
            </ul>
          </Surface>

          <Surface padded={false}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 md:px-6">
              <h2 className="text-[16px] font-bold text-gray-900 dark:text-gray-100">What they registered for</h2>
              <span className="text-[13px] font-semibold text-gray-500">{units} units</span>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {r.courses.map((c) => (
                <li key={c.code} className="flex min-h-[52px] items-center gap-3 px-5 md:px-6">
                  <span className="w-[84px] shrink-0 text-[13px] font-bold text-gray-900 dark:text-gray-100">{c.code}</span>
                  <span className="flex-1 text-[14px] text-gray-700 dark:text-gray-300">
                    {c.title} {c.carryOver && <Chip tone="purple" noIcon>Carry-over</Chip>}
                  </span>
                  <span className="text-[13px] text-gray-500 tabular-nums">{c.units}</span>
                </li>
              ))}
            </ul>
          </Surface>

          {r.returned && (
            <Surface>
              <h2 className="mb-2 text-[15px] font-bold text-gray-900 dark:text-gray-100">You returned this {timeAgo(r.returned.at, now)}</h2>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {r.returned.reasons.map((x) => (
                  <Chip key={x} tone="amber">
                    {RETURN_REASON_LABELS[x]}
                  </Chip>
                ))}
              </div>
              <p className="text-[14px] text-gray-700 dark:text-gray-300">{r.returned.note}</p>
            </Surface>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          <Surface>
            <div className="mb-3 flex items-center gap-3">
              <PersonAvatar first={s.firstName} last={s.lastName} size={48} />
              <div>
                <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{fullName(s)}</p>
                <p className="text-[12px] text-gray-500">{s.matric}</p>
              </div>
            </div>
            <KeyValue label="CGPA" value={r.cgpa.toFixed(2)} />
            <KeyValue label="Standing" value={r.standing === "Good" ? r.standing : <Chip tone="amber">{r.standing}</Chip>} />
            <KeyValue label="Level" value={s.level} />
            {r.submittedAt && <KeyValue label="Submitted" value={timeAgo(r.submittedAt, now)} />}
          </Surface>
          <Btn variant="secondary" icon={MessageSquare} onClick={() => toast.info("Opens a direct thread with the student (phase 3).")}>
            Message
          </Btn>
        </aside>
      </div>

      {decidable && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:pl-[calc(16rem+2rem)] dark:border-gray-800 dark:bg-gray-900/95">
          <div className="mx-auto flex max-w-[900px] gap-2">
            <Btn size="lg" variant="secondary" icon={Undo2} className="flex-1" onClick={() => setReturning(true)}>
              Return with reason
            </Btn>
            <Btn
              size="lg"
              variant="success"
              icon={Check}
              className="flex-1"
              loading={approve.pending}
              onClick={async () => {
                const res = await approve.mutate([r.id]).catch(() => undefined);
                if (res?.approved.length) {
                  toast.success(`Approved ${fullName(s)}`, { description: passed ? "Sent to the school officer." : "Approved despite a failed check; logged." });
                  router.push("/lecturer/advising");
                }
              }}
            >
              Approve
            </Btn>
          </div>
        </div>
      )}
      <ReturnSheet registration={returning ? r : null} onClose={() => setReturning(false)} onDone={() => router.push("/lecturer/advising")} />
    </Page>
  );
}
