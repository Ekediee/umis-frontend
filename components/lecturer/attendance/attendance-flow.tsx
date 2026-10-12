"use client";

/**
 * Stage 3 attendance: 3.3 class session → 3.4 method (remembered per course) →
 * 3.4a code / 3.4b tick list / 3.4c signed-sheet photo → 3.5 saved with undo.
 * Goal: a register in under 60 seconds for 60 students, on a phone.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, ClipboardList, Hash, Megaphone, Presentation, ScanLine, Search, Undo2, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { dayDate, fullName, timeRange, localDate } from "@/lib/lecturer/format";
import { enqueueRegister } from "@/lib/lecturer/offline-queue";
import { invalidate, useLecturerQuery, useOnline } from "@/lib/lecturer/query";
import type { AttendanceMethod, AttendanceStatus, Student } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Page } from "../shell/page";
import { BackButton, Btn, CardSkeleton, Chip, ErrorState, Input, PersonAvatar, ProgressRing, Surface } from "../ui/primitives";
import { CheckinCode } from "./checkin-code";

type Step = "session" | "method" | "code" | "list" | "photo" | "saved";
type Marks = Record<string, AttendanceStatus>;
const METHOD_KEY = (courseId: string) => `pulse-lecturer:attendance-method:${courseId}`;

export function AttendanceFlow({ courseId }: { courseId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session") ?? "";
  const date = params.get("date") ?? localDate(appNow());
  const q = useLecturerQuery(`roster:${courseId}:${sessionId}`, () => lecturerApi.getAttendanceRoster(courseId, sessionId));
  const [step, setStep] = useState<Step>("session");
  const [method, setMethod] = useState<AttendanceMethod>("code");
  const [remembered, setRemembered] = useState(false);
  const [marks, setMarks] = useState<Marks>({});
  const [saved, setSaved] = useState<{ id: string; counts: Record<AttendanceStatus, number>; queued: boolean } | null>(null);
  const online = useOnline();

  const goToMethod = () => {
    try {
      const m = localStorage.getItem(METHOD_KEY(courseId)) as AttendanceMethod | null;
      if (m) {
        setMethod(m);
        setRemembered(true);
      }
    } catch {
      // storage blocked — default to showing a code
    }
    setStep("method");
  };

  const roster = q.data?.roster ?? [];

  const choose = (m: AttendanceMethod) => {
    setMethod(m);
    try {
      localStorage.setItem(METHOD_KEY(courseId), m);
    } catch {
      // ignore
    }
    setMarks(Object.fromEntries(roster.map((r) => [r.student.id, m === "list" ? "present" : "absent"])) as Marks);
    setStep(m);
  };

  const save = async (final: Marks) => {
    const payload = { sessionId: q.data!.session.id, date, method, marks: final };
    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    Object.values(final).forEach((s) => counts[s]++);
    if (!online) {
      enqueueRegister(payload);
      setSaved({ id: "", counts, queued: true });
      setStep("saved");
      return;
    }
    try {
      const r = await lecturerApi.saveRegister(payload);
      setSaved({ id: r.id, counts: r.counts, queued: false });
      setStep("saved");
      invalidate("today:");
      invalidate(`classlist:${courseId}`);
    } catch {
      enqueueRegister(payload);
      setSaved({ id: "", counts, queued: true });
      setStep("saved");
    }
  };

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Attendance" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={4} />
      </Page>
    );

  const { course: c, session: s, topic } = q.data;
  const groupText = s.groupLabels.map((g) => (g.length <= 2 ? `Group ${g}` : g)).join(" and ");

  if (step === "code") {
    return (
      <CheckinCode
        seed={`${s.id}:${date}`}
        roster={roster.map((r) => r.student)}
        title={`${c.code} ${groupText}`}
        onCancel={() => setStep("method")}
        onEnd={(checked) => {
          const next: Marks = {};
          roster.forEach((r) => (next[r.student.id] = checked[r.student.id] ?? "absent"));
          setMarks(next);
          setStep("list");
          toast.message("Check-in ended", { description: "Review the list. Tap a name to change it; students without phones can be marked here." });
        }}
      />
    );
  }

  return (
    <Page className="max-w-[760px]">
      <div className="mb-4 flex items-center gap-2">
        {step === "session" ? (
          <BackButton href={`/lecturer/courses/${courseId}`} to={c.code} />
        ) : step !== "saved" ? (
          <BackButton onClick={() => setStep(step === "method" ? "session" : "method")} />
        ) : null}
        {!online && (
          <Chip tone="neutral" icon={WifiOff} className="ml-auto">
            Offline · saves on this device
          </Chip>
        )}
      </div>

      {step === "session" && (
        <div className="flex flex-col gap-4">
          <Surface>
            <p className="text-[13px] font-bold text-[#003cbb] dark:text-[#7aa2ff]">
              {c.code} · {groupText}
            </p>
            <h1 className="mt-1 text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-50">{c.title}</h1>
            <p className="mt-2 text-[14px] text-gray-600 dark:text-gray-400">
              {dayDate(date)} · {timeRange(s.start, s.end)} · {s.online ? "Online" : `${s.venue}, ${s.building}`}
            </p>
            {topic && <p className="mt-1 text-[14px] text-gray-500">This week: {topic}</p>}
            <p className="mt-1 text-[13px] text-gray-500">{roster.length} students expected</p>
          </Surface>
          <Btn size="lg" icon={ScanLine} onClick={goToMethod}>
            Take attendance
          </Btn>
          <div className="grid grid-cols-2 gap-3">
            <Btn size="lg" variant="secondary" icon={Presentation} onClick={() => router.push(`/lecturer/courses/${courseId}?tab=materials`)}>
              Share today&apos;s slides
            </Btn>
            <Btn size="lg" variant="secondary" icon={Megaphone} onClick={() => router.push(`/lecturer/courses/${courseId}?tab=overview&compose=1`)}>
              Post a note
            </Btn>
          </div>
        </div>
      )}

      {step === "method" && (
        <div className="flex flex-col gap-3">
          <h1 className="mb-1 text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-50">How do you want to take attendance?</h1>
          {(
            [
              { m: "code", icon: Hash, title: "Show a code", body: "Students check in on their phones. Best for big halls. Late after 15 minutes." },
              { m: "list", icon: ClipboardList, title: "Tick a list", body: "Everyone starts Present. Tap to mark Absent; hold for Late or Excused. Works offline." },
              { m: "photo", icon: Camera, title: "Upload a signed sheet photo", body: "We read names and matric numbers. You check before saving." },
            ] as const
          ).map((o) => (
            <button
              key={o.m}
              type="button"
              onClick={() => choose(o.m)}
              className={cn(
                "flex items-start gap-4 rounded-[20px] border bg-white p-5 text-left transition-all hover:shadow-md dark:bg-gray-900",
                remembered && method === o.m ? "border-[#003cbb] ring-2 ring-[#003cbb]/15 dark:border-[#4d82ff]" : "border-gray-200 dark:border-gray-800",
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]">
                <o.icon className="size-5" />
              </span>
              <span>
                <span className="flex items-center gap-2 text-[16px] font-bold text-gray-900 dark:text-gray-100">
                  {o.title} {remembered && method === o.m && <Chip tone="blue" noIcon>Last used</Chip>}
                </span>
                <span className="mt-1 block text-[14px] text-gray-500">{o.body}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {step === "list" && <TickList roster={roster.map((r) => r.student)} marks={marks} setMarks={setMarks} onSave={() => save(marks)} />}

      {step === "photo" && <PhotoSheetStep roster={roster.map((r) => r.student)} onDone={(m) => (setMarks(m), setStep("list"))} />}

      {step === "saved" && saved && (
        <SavedStep
          saved={saved}
          onUndo={async () => {
            if (saved.id) await lecturerApi.deleteRegister(saved.id);
            invalidate("today:");
            setStep("list");
            toast.message("Register undone. Nothing was kept.");
          }}
          onEdit={() => setStep("list")}
          doneHref={`/lecturer/courses/${courseId}`}
        />
      )}
    </Page>
  );
}

// ── 3.4b Tick a list ────────────────────────────────────────────────────────

const NEXT_TAP: Record<AttendanceStatus, AttendanceStatus> = { present: "absent", absent: "present", late: "present", excused: "present" };
const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900",
  absent: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900",
  late: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900",
  excused: "bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700",
};
const STATUS_LABEL: Record<AttendanceStatus, string> = { present: "Present", absent: "Absent", late: "Late", excused: "Excused" };

function TickList({ roster, marks, setMarks, onSave }: { roster: Student[]; marks: Marks; setMarks: (fn: (m: Marks) => Marks) => void; onSave: () => Promise<void> }) {
  const [term, setTerm] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const counts = useMemo(() => {
    const c = { present: 0, late: 0, absent: 0, excused: 0 };
    Object.values(marks).forEach((s) => c[s]++);
    return c;
  }, [marks]);
  const list = roster.filter((s) => `${s.firstName} ${s.lastName} ${s.matric}`.toLowerCase().includes(term.trim().toLowerCase()));

  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setMenuFor(id);
      navigator.vibrate?.(10);
    }, 450);
  };
  const endPress = () => pressTimer.current && clearTimeout(pressTimer.current);

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="green">{counts.present} present</Chip>
        <Chip tone="amber">{counts.late} late</Chip>
        <Chip tone="red">{counts.absent} absent</Chip>
        {counts.excused > 0 && <Chip tone="neutral">{counts.excused} excused</Chip>}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
        <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Find a student" className="pl-10" aria-label="Find a student" />
      </div>
      <p className="text-[12px] text-gray-500">Tap to switch Present and Absent. Hold (or right-click) for Late or Excused.</p>
      <ul className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {list.map((s) => {
          const st = marks[s.id] ?? "present";
          return (
            <li key={s.id} className="relative border-b border-gray-100 last:border-0 dark:border-gray-800">
              <button
                type="button"
                onPointerDown={() => startPress(s.id)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onContextMenu={(e) => (e.preventDefault(), setMenuFor(s.id))}
                onClick={() => {
                  if (longPressed.current) return;
                  setMarks((m) => ({ ...m, [s.id]: NEXT_TAP[st] }));
                }}
                aria-label={`${fullName(s)}: ${STATUS_LABEL[st]}. Tap to change.`}
                className="flex min-h-[60px] w-full items-center gap-3 px-4 text-left select-none active:bg-gray-50 dark:active:bg-gray-800"
              >
                <PersonAvatar first={s.firstName} last={s.lastName} src={s.photoUrl} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-gray-900 dark:text-gray-100">{fullName(s)}</span>
                  <span className="block text-[12px] text-gray-500 tabular-nums">{s.matric}</span>
                </span>
                <span className={cn("rounded-full px-3 py-1 text-[12px] font-bold ring-1", STATUS_STYLE[st])}>{STATUS_LABEL[st]}</span>
              </button>
              {menuFor === s.id && (
                <div className="absolute top-1 right-3 z-10 flex gap-1 rounded-2xl bg-white p-1 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
                  {(["present", "late", "excused", "absent"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => (setMarks((m) => ({ ...m, [s.id]: k })), setMenuFor(null))} className={cn("min-h-[40px] rounded-xl px-3 text-[12px] font-bold ring-1", STATUS_STYLE[k])}>
                      {STATUS_LABEL[k]}
                    </button>
                  ))}
                  <button type="button" aria-label="Close" onClick={() => setMenuFor(null)} className="inline-flex size-10 items-center justify-center text-gray-400">
                    <X className="size-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur md:static md:mt-2 md:border-0 md:bg-transparent md:p-0 dark:border-gray-800 dark:bg-gray-900/95 md:dark:bg-transparent">
        <Btn size="lg" className="w-full" loading={saving} onClick={async () => (setSaving(true), await onSave(), setSaving(false))}>
          Save register · {counts.present + counts.late} of {roster.length} here
        </Btn>
      </div>
    </div>
  );
}

// ── 3.4c Photo of a signed sheet ────────────────────────────────────────────

function PhotoSheetStep({ roster, onDone }: { roster: Student[]; onDone: (m: Marks) => void }) {
  const [phase, setPhase] = useState<"pick" | "reading" | "review">("pick");
  const [matched, setMatched] = useState<Marks>({});
  const [unmatched, setUnmatched] = useState<{ raw: string; resolved: string | null }[]>([]);

  const read = () => {
    setPhase("reading");
    // TODO(api): POST the image to /lecturer/attendance/ocr; returns matched matric numbers and unreadable lines.
    setTimeout(() => {
      const m: Marks = {};
      roster.forEach((s, i) => (m[s.id] = i % 9 === 4 ? "absent" : "present"));
      setMatched(m);
      setUnmatched([
        { raw: "Adebay? T. — 23/14??", resolved: null },
        { raw: "illegible signature, row 31", resolved: null },
      ]);
      setPhase("review");
    }, 1400);
  };

  if (phase === "pick")
    return (
      <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
        <Camera className="size-10 text-gray-400" />
        <span className="text-[16px] font-bold text-gray-900 dark:text-gray-100">Take or choose a photo of the signed sheet</span>
        <span className="max-w-[340px] text-[13px] text-gray-500">We&apos;ll read names and matric numbers. Check before saving.</span>
        <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && read()} />
      </label>
    );
  if (phase === "reading")
    return (
      <Surface className="flex flex-col items-center gap-4 py-12">
        <ProgressRing value={66} size={64}>
          <ScanLine className="size-5 text-[#003cbb]" />
        </ProgressRing>
        <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Reading names and matric numbers…</p>
      </Surface>
    );
  const open = unmatched.filter((u) => u.resolved === null).length;
  return (
    <div className="flex flex-col gap-4">
      <Surface>
        <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
          {Object.values(matched).filter((m) => m === "present").length} matched as present
        </p>
        <p className="text-[13px] text-gray-500">Unmatched rows stay highlighted until you resolve them or mark them Unknown.</p>
      </Surface>
      <ul className="flex flex-col gap-2">
        {unmatched.map((u, i) => (
          <li key={u.raw} className={cn("flex flex-col gap-2 rounded-2xl p-4 ring-1", u.resolved === null ? "bg-amber-50 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900" : "bg-white ring-gray-200 dark:bg-gray-900 dark:ring-gray-800")}>
            <p className="font-mono text-[13px] text-gray-800 dark:text-gray-200">“{u.raw}”</p>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Match to student"
                className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[14px] dark:border-gray-700 dark:bg-gray-950"
                value={u.resolved ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setUnmatched((list) => list.map((x, k) => (k === i ? { ...x, resolved: id } : x)));
                  if (id && id !== "unknown") setMatched((m) => ({ ...m, [id]: "present" }));
                }}
              >
                <option value="">Match to a student…</option>
                {roster
                  .filter((s) => matched[s.id] === "absent")
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {fullName(s)} · {s.matric}
                    </option>
                  ))}
                <option value="unknown">Mark as Unknown</option>
              </select>
            </div>
          </li>
        ))}
      </ul>
      <Btn size="lg" disabled={open > 0} onClick={() => onDone(matched)}>
        {open > 0 ? `Resolve ${open} more` : "Review the full list"}
      </Btn>
    </div>
  );
}

// ── 3.5 Saved ───────────────────────────────────────────────────────────────

function SavedStep({ saved, onUndo, onEdit, doneHref }: { saved: { counts: Record<AttendanceStatus, number>; queued: boolean }; onUndo: () => Promise<void>; onEdit: () => void; doneHref: string }) {
  const [left, setLeft] = useState(10);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const { present, late, absent, excused } = saved.counts;
  return (
    <Surface className="flex flex-col items-center gap-4 py-10 text-center">
      <CheckCircle2 className="size-14 text-emerald-500" />
      <h1 className="text-[20px] font-bold text-gray-900 dark:text-gray-100">
        Register saved: {present} present, {late} late, {absent} absent{excused ? `, ${excused} excused` : ""}.
      </h1>
      {saved.queued && <p className="text-[13px] text-gray-500">Saved on this device. It sends when you&apos;re back online.</p>}
      <p className="text-[13px] text-gray-500">You can edit it for 7 days. After that, edits need a reason and are logged.</p>
      <div className="flex flex-wrap justify-center gap-2">
        {left > 0 && (
          <Btn variant="secondary" icon={Undo2} onClick={onUndo}>
            Undo ({left}s)
          </Btn>
        )}
        <Btn variant="secondary" onClick={onEdit}>
          Edit
        </Btn>
        <Link href={doneHref} className="inline-flex h-11 items-center rounded-xl bg-[#003cbb] px-5 text-[14px] font-semibold text-white">
          Done
        </Link>
      </div>
    </Surface>
  );
}

