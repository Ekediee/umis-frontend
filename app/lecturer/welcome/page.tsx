"use client";

/**
 * First run: 1.1c "Is this right?" (roles from BU Pulse) → 1.1d notifications
 * and office. The lecturer can continue with confirmed roles even if something
 * is wrong; the report goes to the department admin.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Bell, Check, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { useLecturerQuery } from "@/lib/lecturer/query";
import { markOnboarded } from "@/app/actions/lecturer-auth";
import { Btn, Chip, Field, Input, KeyValue, PersonAvatar, Surface, Textarea, Toggle } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { LecturerRole } from "@/lib/lecturer/types";

const ROLE_LABEL: Record<LecturerRole, string> = {
  lecturer: "Lecturer",
  course_advisor: "Course advisor",
  supervisor: "Project supervisor",
  hod: "Head of department",
  dean: "Dean",
};

export default function WelcomePage() {
  const router = useRouter();
  const session = useLecturerQuery("session", () => lecturerApi.getSession());
  const [step, setStep] = useState<1 | 2>(1);
  const [reportOpen, setReportOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [office, setOffice] = useState("");
  const [prefs, setPrefs] = useState({ email: true, push: false });
  const [saving, setSaving] = useState(false);
  const l = session.data?.lecturer;

  const enablePush = async (on: boolean) => {
    // Ask the browser only after a tap (1.1d).
    if (on && typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const result = await Notification.requestPermission().catch(() => "denied" as const);
      if (result !== "granted") {
        toast.message("Push is blocked in this browser", { description: "You'll still get email reminders. You can allow notifications in browser settings later." });
        return;
      }
    }
    setPrefs((p) => ({ ...p, push: on }));
  };

  const finish = async () => {
    const trimmed = email.trim();
    if (prefs.email && !l?.email && trimmed && !/^[^@\s]+@babcock\.edu\.ng$/i.test(trimmed)) {
      toast.error("Use your Babcock staff email (name@babcock.edu.ng).");
      return;
    }
    setSaving(true);
    try {
      await lecturerApi.completeOnboarding({ prefs, office: office.trim() || null, email: l?.email ?? (trimmed || null) });
      await markOnboarded();
      router.replace("/lecturer");
    } catch {
      toast.error("We couldn't save that. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-start justify-center bg-[#F4F5F7] px-4 py-10 md:items-center dark:bg-black">
      <div className="w-full max-w-[520px]">
        <div className="mb-6 flex items-center gap-2" aria-label={`Step ${step} of 2`}>
          {[1, 2].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-[#003cbb]" : "bg-gray-200 dark:bg-gray-800"}`} />
          ))}
        </div>

        {step === 1 && (
          <Surface className="flex flex-col gap-5">
            <div>
              <p className="text-[13px] font-semibold text-[#003cbb] dark:text-[#7aa2ff]">Welcome to Pulse</p>
              <h1 className="mt-1 text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Is this right?</h1>
              <p className="mt-1 text-[14px] text-gray-500">We pulled this from your BU Pulse staff record. Your roles decide what you see.</p>
            </div>
            {!l ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800/60">
                  <PersonAvatar first={l.firstName} last={l.lastName} size={48} />
                  <div>
                    <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100">
                      {l.title} {l.firstName} {l.lastName}
                    </p>
                    <p className="text-[13px] text-gray-500">
                      {l.department} · {l.school}
                    </p>
                  </div>
                </div>
                <div>
                  <KeyValue label="Campus" value={l.campus} />
                  <KeyValue label="Course advisor" value={l.roles.includes("course_advisor") ? `Yes · Level ${l.levelsApproving.join(", ")}` : "No"} />
                  <KeyValue label="Head of department" value={l.roles.includes("hod") ? "Yes" : "No"} />
                  <KeyValue label="Dean" value={l.roles.includes("dean") ? "Yes" : "No"} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {l.roles.map((r) => (
                    <Chip key={r} tone="blue" icon={Check}>
                      {ROLE_LABEL[r]}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Btn size="lg" className="flex-1" disabled={!l} onClick={() => setStep(2)}>
                Yes, that&apos;s right
              </Btn>
              <Btn size="lg" variant="secondary" className="flex-1" icon={AlertCircle} onClick={() => setReportOpen(true)}>
                Something&apos;s wrong
              </Btn>
            </div>
          </Surface>
        )}

        {step === 2 && l && (
          <Surface className="flex flex-col gap-5">
            <div>
              <h1 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-50">How should we reach you?</h1>
              <p className="mt-1 text-[14px] text-gray-500">Reminders for deadlines go by email. You can change this any time.</p>
            </div>
            {!l.email && (
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:ring-amber-900/50">
                <Field label="Your staff email" htmlFor="welcome-email" hint="Your staff record has no email, so reminders can't reach you yet.">
                  <Input id="welcome-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@babcock.edu.ng" autoComplete="email" />
                </Field>
              </div>
            )}
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 px-4 dark:divide-gray-800 dark:border-gray-800">
              <div className="flex items-center gap-3 py-2">
                <Mail className="size-5 shrink-0 text-gray-400" />
                <div className="flex-1">
                  <Toggle id="pref-email" checked={prefs.email} onChange={(v) => setPrefs((p) => ({ ...p, email: v }))} label="Email" description="Deadlines, returned grades, supervision requests" />
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Bell className="size-5 shrink-0 text-gray-400" />
                <div className="flex-1">
                  <Toggle id="pref-push" checked={prefs.push} onChange={enablePush} label="Push on this device" description="Chapter submissions, bookings, registration deadlines" />
                </div>
              </div>
            </div>
            <Field label="Office location" htmlFor="welcome-office" optional hint="Students see this on your staff page.">
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
                <Input id="welcome-office" value={office} onChange={(e) => setOffice(e.target.value)} placeholder="e.g. Room 214, Software Engineering Building" className="pl-10" />
              </div>
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Btn size="lg" className="flex-1" loading={saving} onClick={finish}>
                Done
              </Btn>
              <Btn size="lg" variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Btn>
            </div>
          </Surface>
        )}
      </div>

      <ReportRolesSheet open={reportOpen} onClose={() => setReportOpen(false)} onContinue={() => (setReportOpen(false), setStep(2))} />
    </div>
  );
}

function ReportRolesSheet({ open, onClose, onContinue }: { open: boolean; onClose: () => void; onContinue: () => void }) {
  const [what, setWhat] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const res = await lecturerApi.reportMistake({ field: "Roles", problem: what, shouldBe: what });
      toast.success("Sent to your department admin", { description: `Reference ${res.reference}. Continue with your confirmed roles for now.` });
      onContinue();
    } finally {
      setSending(false);
    }
  };
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="What's wrong?"
      description="This goes to your department admin. You can keep using Pulse with the roles that are right."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={send} loading={sending} disabled={what.trim().length < 5}>
            Send and continue
          </Btn>
        </>
      }
    >
      <Field label="Tell us what should change" htmlFor="roles-wrong">
        <Textarea id="roles-wrong" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g. I also approve Level 200, and I'm no longer a course advisor for Level 100." />
      </Field>
    </Sheet>
  );
}
