"use client";

/**
 * Students hub: advisees and supervisees in one place (navigation spec),
 * plus the advisor at-risk queue (8.4) and check-in message (8.5).
 * Students never see the word "risk": they see "Your advisor wants to check in".
 */

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, CheckCircle2, ChevronRight, ClipboardCheck, GraduationCap, HeartHandshake, MessageCircleHeart, Search } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { fullName, plural, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Student } from "@/lib/lecturer/types";
import { useLecturer } from "@/components/lecturer/shell/lecturer-provider";
import { Page } from "@/components/lecturer/shell/page";
import { waitingOnYou } from "@/components/lecturer/supervision/chapter-state";
import { Btn, BtnLink, CardSkeleton, Chip, Field, PageHeader, PersonAvatar, SectionTitle, Surface, Textarea } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

export default function StudentsHubPage() {
  const { hasRole } = useLecturer();
  const advising = useLecturerQuery(hasRole("course_advisor") ? "advising" : null, () => lecturerApi.getAdvising());
  const supervision = useLecturerQuery(hasRole("supervisor") ? "supervision" : null, () => lecturerApi.getSupervision());
  const queue = useLecturerQuery(hasRole("course_advisor") ? "advising:atrisk" : null, () => lecturerApi.getAtRiskQueue());
  const [checkIn, setCheckIn] = useState<Student | null>(null);
  const [handling, setHandling] = useState<string | null>(null);
  const now = appNow();

  const toReview = advising.data?.registrations.filter((r) => r.status === "to_review").length ?? 0;
  const waiting = supervision.data?.projects.reduce((s, p) => s + waitingOnYou(p).count, 0) ?? 0;

  return (
    <Page>
      <PageHeader
        title="Students"
        description="Your advisees and supervisees. Students in your courses live in each course's class list."
        actions={
          <Btn variant="secondary" icon={Search} onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}>
            Find a student
          </Btn>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {hasRole("course_advisor") && (
          <Link href="/lecturer/advising">
            <Surface className="flex h-full items-center gap-4 transition-shadow hover:shadow-md">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]">
                <ClipboardCheck className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100">Advisees</p>
                <p className="text-[13px] text-gray-500">{advising.data ? `Level ${advising.data.window.level} · ${advising.data.window.advisees} students` : "Loading…"}</p>
                {toReview > 0 && <Chip tone="amber" className="mt-2">{plural(toReview, "registration")} to review</Chip>}
              </div>
              <ChevronRight className="size-5 text-gray-300" />
            </Surface>
          </Link>
        )}
        {hasRole("supervisor") && (
          <Link href="/lecturer/supervision">
            <Surface className="flex h-full items-center gap-4 transition-shadow hover:shadow-md">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                <GraduationCap className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100">Supervisees</p>
                <p className="text-[13px] text-gray-500">{supervision.data ? plural(supervision.data.projects.length, "project") : "Loading…"}</p>
                {waiting > 0 && <Chip tone="amber" className="mt-2">{plural(waiting, "chapter")} waiting on you</Chip>}
              </div>
              <ChevronRight className="size-5 text-gray-300" />
            </Surface>
          </Link>
        )}
      </div>

      {hasRole("course_advisor") && (
        <section className="mt-8">
          <SectionTitle title="Check in with" count={queue.data?.filter((i) => !i.handledNote).length} />
          <p className="-mt-1 mb-3 text-[13px] text-gray-500">Advisees flagged by lecturers or by academic standing. The lecturer who flagged sees “Advisor followed up”, not your private notes.</p>
          {!queue.data ? (
            <CardSkeleton rows={2} />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {queue.data.map((i) => (
                <li key={i.id}>
                  <Surface className={i.handledNote ? "opacity-60" : ""}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <PersonAvatar first={i.student.firstName} last={i.student.lastName} size={40} />
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{fullName(i.student)}</p>
                          <p className="text-[13px] text-gray-600 dark:text-gray-400">{i.reason}</p>
                          <p className="text-[12px] text-gray-400">
                            Raised by {i.raisedBy} · {timeAgo(i.at, now)}
                          </p>
                        </div>
                      </div>
                      {i.handledNote ? (
                        <Chip tone="green" icon={CheckCircle2}>
                          Handled
                        </Chip>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Btn size="sm" variant="secondary" icon={MessageCircleHeart} onClick={() => setCheckIn(i.student)}>
                            Check in
                          </Btn>
                          <BtnLink size="sm" variant="secondary" icon={CalendarPlus} href="/lecturer/office-hours">
                            Book
                          </BtnLink>
                          <Btn size="sm" variant="ghost" onClick={() => setHandling(i.id)}>
                            Mark handled
                          </Btn>
                        </div>
                      )}
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 flex items-start gap-2 text-[12px] text-gray-500">
            <HeartHandshake className="mt-0.5 size-3.5 shrink-0" /> Health or safety concern? Use “Refer to student affairs” in the meeting notes. Welfare details are not stored in Pulse.
          </p>
        </section>
      )}

      <CheckInSheet student={checkIn} onClose={() => setCheckIn(null)} />
      <HandledSheet id={handling} onClose={() => setHandling(null)} />
    </Page>
  );
}

function CheckInSheet({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const [body, setBody] = useState("");
  const send = useMutation(lecturerApi.sendCheckIn);
  const template = student ? `Hi ${student.firstName}, I'd like to check in on how this semester is going. Book a slot with me here: pulse.babcock.edu.ng/book/awoniyi` : "";
  return (
    <Sheet
      open={!!student}
      onClose={onClose}
      title={student ? `Check in with ${student.firstName}` : ""}
      description="They see “Your advisor wants to check in”, never “at risk”."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={send.pending}
            onClick={async () => {
              await send.mutate(student!.id, body || template).catch(() => undefined);
              toast.success(`Check-in sent to ${student!.firstName}`);
              setBody("");
              onClose();
            }}
          >
            Send
          </Btn>
        </>
      }
    >
      <Textarea value={body || template} onChange={(e) => setBody(e.target.value)} rows={5} aria-label="Message" />
    </Sheet>
  );
}

function HandledSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const mark = useMutation(lecturerApi.markAtRiskHandled, { invalidates: ["advising:atrisk"] });
  return (
    <Sheet
      open={!!id}
      onClose={onClose}
      size="sm"
      title="Mark as handled"
      description="Private to you. It joins the advisee's profile."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={mark.pending}
            disabled={note.trim().length < 5}
            onClick={async () => {
              await mark.mutate(id!, note).catch(() => undefined);
              setNote("");
              onClose();
            }}
          >
            Save
          </Btn>
        </>
      }
    >
      <Field label="What did you do?" htmlFor="handled-note">
        <Textarea id="handled-note" data-autofocus value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. Met on 8 Oct; agreed a study plan for GEDS 101." />
      </Field>
    </Sheet>
  );
}
