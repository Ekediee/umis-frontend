"use client";

/**
 * 9.1 My profile · 9.1a what students see · 9.4 report a mistake.
 * Staff-record fields (name, roles) are read-only and reported, never edited;
 * fields (email, office, bio, research areas, ORCID) never write back.
 */

import { useState } from "react";
import { BookOpen, Check, Clock3, Copy, ExternalLink, Flag, Mail, MapPin, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { WEEKDAYS, formatSemester, timeRange } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Lecturer, PublicField } from "@/lib/lecturer/types";
import { useLecturer } from "@/components/lecturer/shell/lecturer-provider";
import { Page } from "@/components/lecturer/shell/page";
import { Btn, CardSkeleton, Field, Input, KeyValue, PageHeader, PersonAvatar, ProgressRing, SectionTitle, Surface, Textarea, Toggle } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

type Editable = Pick<Lecturer, "email" | "phone" | "office" | "bio" | "researchAreas" | "orcid" | "publicFields">;

const VISIBILITY: { key: PublicField; label: string }[] = [
  { key: "photo", label: "Photo" },
  { key: "email", label: "Email" },
  { key: "office", label: "Office" },
  { key: "officeHours", label: "Office hours" },
  { key: "courses", label: "Courses this semester" },
  { key: "researchAreas", label: "Research areas" },
  { key: "publications", label: "Recent publications" },
];

export default function ProfilePage() {
  const { lecturer, semester, refresh } = useLecturer();
  const courses = useLecturerQuery(semester ? `courses:${semester.code}` : null, () => lecturerApi.getCourses(semester!.code));
  const hours = useLecturerQuery("officehours", () => lecturerApi.getOfficeHours());
  const save = useMutation(lecturerApi.updateProfile, { invalidates: ["session", "today:"] });
  const [draft, setForm] = useState<Editable | null>(null);
  const form: Editable | null = draft ?? (lecturer ? { email: lecturer.email, phone: lecturer.phone, office: lecturer.office, bio: lecturer.bio, researchAreas: lecturer.researchAreas, orcid: lecturer.orcid, publicFields: lecturer.publicFields } : null);
  const [area, setArea] = useState("");
  const [report, setReport] = useState(false);


  const dirty = draft !== null && !!lecturer && JSON.stringify(draft) !== JSON.stringify({ email: lecturer.email, phone: lecturer.phone, office: lecturer.office, bio: lecturer.bio, researchAreas: lecturer.researchAreas, orcid: lecturer.orcid, publicFields: lecturer.publicFields });

  if (!lecturer || !form)
    return (
      <Page>
        <CardSkeleton rows={6} />
      </Page>
    );

  const checks = [
    { label: "Email", done: !!form.email },
    { label: "Office", done: !!form.office },
    { label: "Office hours", done: (hours.data?.slots.length ?? 0) > 0 },
    { label: "Research areas", done: form.researchAreas.length > 0 },
    { label: "ORCID", done: !!form.orcid },
    { label: "Photo", done: !!lecturer.photoUrl },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const emailError = form.email && !/^[^@\s]+@babcock\.edu\.ng$/i.test(form.email) ? "Use your Babcock staff email (name@babcock.edu.ng)." : null;
  const orcidError = form.orcid && !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(form.orcid) ? "ORCID looks like 0000-0002-1825-0097." : null;
  const set = <K extends keyof Editable>(k: K, v: Editable[K]) => setForm({ ...form, [k]: v });

  return (
    <Page>
      <PageHeader title="My profile" description="Your public staff page helps students find and contact you, and helps your HOD match supervisees." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface className="flex items-center gap-5">
            <ProgressRing value={pct} size={76} stroke={7} tone={pct === 100 ? "#059669" : "#003cbb"}>
              <span className="text-[15px] leading-tight font-bold text-gray-900 dark:text-gray-100">
                {pct}%<span className="block text-[10px] font-medium text-gray-500">set up</span>
              </span>
            </ProgressRing>
            <div className="flex flex-wrap gap-1.5">
              {checks.map((c) => (
                <span key={c.label} className={c.done ? "inline-flex h-7 items-center gap-1 rounded-full bg-emerald-50 px-2.5 text-[12px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" : "inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 text-[12px] font-semibold text-gray-500 dark:border-gray-700"}>
                  {c.done ? <Check className="size-3.5" /> : <Plus className="size-3.5" />} {c.label}
                </span>
              ))}
            </div>
          </Surface>

          <Surface>
            <SectionTitle
              title="From your BU Pulse record"
              action={
                <Btn size="sm" variant="ghost" icon={Flag} onClick={() => setReport(true)}>
                  Report a mistake
                </Btn>
              }
            />
            <KeyValue label="Instructor ID" value={<span className="font-mono">{lecturer.instructorId}</span>} />
            <KeyValue label="Name" value={`${lecturer.title} ${lecturer.firstName} ${lecturer.lastName}`} />
            <KeyValue label="School" value={lecturer.school} />
            <KeyValue label="Department" value={lecturer.department} />
            <KeyValue label="Course advisor" value={lecturer.roles.includes("course_advisor") ? `Yes · Level ${lecturer.levelsApproving.join(", ")}` : "No"} />
            <KeyValue label="Head of department" value={lecturer.roles.includes("hod") ? "Yes" : "No"} />
            <KeyValue label="Dean" value={lecturer.roles.includes("dean") ? "Yes" : "No"} />
            <p className="mt-2 text-[12px] text-gray-500">These come from the university record. They can&apos;t be edited here; report a mistake and your department admin fixes it.</p>
          </Surface>

          <Surface className="flex flex-col gap-4">
            <SectionTitle title="Edit in Pulse" className="mb-0" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" htmlFor="pf-email" error={emailError} hint={!form.email ? "Missing from your staff record. Add it so reminders and students reach you." : undefined}>
                <Input id="pf-email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} aria-invalid={!!emailError} placeholder="name@babcock.edu.ng" />
              </Field>
              <Field label="Phone" htmlFor="pf-phone" optional hint="Private. Never on your public page.">
                <Input id="pf-phone" type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
              </Field>
              <Field label="Office" htmlFor="pf-office">
                <Input id="pf-office" value={form.office ?? ""} onChange={(e) => set("office", e.target.value || null)} placeholder="Room 214, Software Engineering Building" />
              </Field>
              <Field label="ORCID" htmlFor="pf-orcid" optional error={orcidError} hint="Pulls your publications onto your staff page.">
                <Input id="pf-orcid" value={form.orcid ?? ""} onChange={(e) => set("orcid", e.target.value || null)} placeholder="0000-0000-0000-0000" aria-invalid={!!orcidError} />
              </Field>
            </div>
            <Field label="Short bio" htmlFor="pf-bio">
              <Textarea id="pf-bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={3} maxLength={280} />
            </Field>
            <Field label="Research areas" htmlFor="pf-area" hint="Helps your HOD assign supervisees to you.">
              <div className="flex flex-wrap gap-2">
                {form.researchAreas.map((a) => (
                  <span key={a} className="inline-flex h-9 items-center gap-1 rounded-full bg-[#eef3fd] pr-1 pl-3 text-[13px] font-semibold text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]">
                    {a}
                    <button type="button" aria-label={`Remove ${a}`} onClick={() => set("researchAreas", form.researchAreas.filter((x) => x !== a))} className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white/60 dark:hover:bg-black/20">
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = area.trim();
                    if (v && !form.researchAreas.includes(v)) set("researchAreas", [...form.researchAreas, v]);
                    setArea("");
                  }}
                  className="flex"
                >
                  <Input id="pf-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Add an area, press Enter" className="h-9 w-[220px] text-[13px]" />
                </form>
              </div>
            </Field>
          </Surface>
          <div className="sticky bottom-24 z-20 flex justify-end md:bottom-4">
            <Btn
              size="lg"
              disabled={!dirty || !!emailError || !!orcidError}
              loading={save.pending}
              className="shadow-lg"
              onClick={async () => {
                const saved = await save.mutate(form).catch(() => undefined);
                if (saved) {
                  refresh();
                  toast.success("Profile saved");
                }
              }}
            >
              Save changes
            </Btn>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <p className="px-1 text-[13px] font-semibold text-gray-500">What students see</p>
          <PublicPreview lecturer={{ ...lecturer, ...form }} courses={courses.data?.current.map((c) => `${c.code} · ${c.title}`) ?? []} hours={hours.data?.slots ?? []} semesterLabel={semester ? formatSemester(semester) : ""} />
          <Surface>
            <SectionTitle title="Show on my page" as="h3" />
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {VISIBILITY.map((v) => (
                <Toggle key={v.key} id={`vis-${v.key}`} checked={form.publicFields[v.key]} onChange={(on) => set("publicFields", { ...form.publicFields, [v.key]: on })} label={v.label} />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-gray-500">Phone and Instructor ID are never public.</p>
          </Surface>
        </aside>
      </div>
      <ReportSheet open={report} onClose={() => setReport(false)} />
    </Page>
  );
}

function PublicPreview({ lecturer: l, courses, hours, semesterLabel }: { lecturer: Lecturer; courses: string[]; hours: { day: number; start: string; end: string }[]; semesterLabel: string }) {
  const show = l.publicFields;
  const url = `pulse.babcock.edu.ng/staff/${l.lastName.toLowerCase()}`;
  return (
    <div className="overflow-hidden rounded-[32px] border-[6px] border-gray-900 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-950">
      <div className="relative bg-gradient-to-br from-[#002a85] via-[#003cbb] to-[#2563eb] px-6 pt-8 pb-14 text-center text-white">
        <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative mx-auto w-fit rounded-full ring-4 ring-white/30">{show.photo ? <PersonAvatar first={l.firstName} last={l.lastName} src={l.photoUrl} size={84} /> : <PersonAvatar first={l.firstName} last={l.lastName} size={84} />}</div>
        <p className="relative mt-3 text-[18px] font-bold">
          {l.title} {l.firstName} {l.lastName}
        </p>
        <p className="relative text-[13px] text-white/80">
          {l.department} · {l.school}
        </p>
        {l.bio && <p className="relative mx-auto mt-2 max-w-[260px] text-[12px] leading-relaxed text-white/75">{l.bio}</p>}
      </div>
      <div className="-mt-8 flex flex-col gap-2 px-4 pb-5">
        {show.email && l.email && <LinkRow icon={Mail} label={l.email} />}
        {show.office && l.office && <LinkRow icon={MapPin} label={l.office} />}
        {show.officeHours && hours.length > 0 && <LinkRow icon={Clock3} label={`Book office hours · ${hours.map((h) => `${WEEKDAYS[h.day - 1]} ${timeRange(h.start, h.end)}`).join(", ")}`} />}
        {show.courses && courses.length > 0 && <LinkRow icon={BookOpen} label={`${courses.length} courses · ${semesterLabel}`} />}
        {show.researchAreas && l.researchAreas.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {l.researchAreas.map((a) => (
              <span key={a} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {a}
              </span>
            ))}
          </div>
        )}
        {show.publications &&
          l.publications.slice(0, 2).map((p) => <LinkRow key={p.title} icon={Sparkles} label={p.title} sub={`${p.venue}, ${p.year}`} />)}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(`https://${url}`).catch(() => undefined);
            toast.success("Link copied");
          }}
          className="mt-2 flex min-h-[44px] items-center justify-between rounded-2xl border border-gray-200 px-4 text-[12px] text-gray-600 dark:border-gray-700 dark:text-gray-300"
        >
          {url} <Copy className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LinkRow({ icon: Icon, label, sub }: { icon: typeof Mail; label: string; sub?: string }) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
      <Icon className="size-4 shrink-0 text-[#003cbb] dark:text-[#7aa2ff]" />
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">{label}</span>
        {sub && <span className="block truncate text-[11px] text-gray-500">{sub}</span>}
      </span>
      <ExternalLink className="size-3.5 text-gray-300" />
    </div>
  );
}

function ReportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [field, setField] = useState("Name");
  const [problem, setProblem] = useState("");
  const [shouldBe, setShouldBe] = useState("");
  const send = useMutation(lecturerApi.reportMistake);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Report a mistake"
      description="Goes to your department admin's queue with your Instructor ID."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={send.pending}
            disabled={problem.trim().length < 3 || shouldBe.trim().length < 1}
            onClick={async () => {
              const r = await send.mutate({ field, problem, shouldBe }).catch(() => undefined);
              if (r) toast.success("Sent to your department admin", { description: `Reference ${r.reference}` });
              setProblem("");
              setShouldBe("");
              onClose();
            }}
          >
            Send
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Field" htmlFor="rm-field">
          <Input id="rm-field" value={field} onChange={(e) => setField(e.target.value)} list="rm-fields" />
          <datalist id="rm-fields">
            {["Name", "School", "Department", "Course advisor", "Levels approving", "Head of department", "Dean"].map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Field>
        <Field label="What's wrong" htmlFor="rm-problem">
          <Textarea id="rm-problem" value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
        </Field>
        <Field label="What it should be" htmlFor="rm-should">
          <Input id="rm-should" value={shouldBe} onChange={(e) => setShouldBe(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
