"use client";

/**
 * 1.1 Sign in → 1.1b Not recognised → code from department admin.
 * Staff email only; student emails are sent to the student portal.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Activity, BadgeCheck, CalendarCheck2, ClipboardCheck, GraduationCap, KeyRound, ShieldCheck } from "lucide-react";
import { requestInstructorLink, signInWithSso, signInWithStaffId, verifyInstructorLink, type AuthResult } from "@/app/actions/lecturer-auth";
import { BackButton, Btn, Field, Input } from "../ui/primitives";

type Step = { kind: "choose" } | { kind: "sso" } | { kind: "not-recognised"; email: string } | { kind: "code"; instructorId: string; admin: string };

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reason = params.get("reason");
  const notice = reason === "expired" ? "Your session ended after 8 hours or when the browser closed. Sign in again." : reason === "signed-out" ? "You're signed out." : null;

  const handle = (result: AuthResult) => {
    switch (result.status) {
      case "ok":
        router.replace(result.redirectTo);
        router.refresh();
        return;
      case "invalid":
      case "student":
        setError(result.message);
        return;
      case "not-recognised":
        setError(null);
        setStep({ kind: "not-recognised", email: result.email });
        return;
      case "code-sent":
        setError(null);
        setStep({ kind: "code", instructorId: result.instructorId, admin: result.admin });
    }
  };

  const submit = (fn: () => Promise<AuthResult>) => (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => handle(await fn()));
  };

  return (
    <div className="flex min-h-dvh bg-[#F4F5F7] dark:bg-black">
      {/* Brand panel — Revolut-style gradient hero */}
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#002a85] via-[#003cbb] to-[#2563eb] p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 size-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 size-[300px] rounded-full bg-sky-300/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Image src="/images/bu_logo.png" alt="Babcock University" width={40} height={40} className="rounded-full bg-white p-1" />
          <span className="text-[15px] font-semibold">Babcock University · Pulse</span>
        </div>
        <div className="relative">
          <h1 className="text-[40px] leading-[1.1] font-bold tracking-tight">Your week, not a wall of tables.</h1>
          <p className="mt-4 max-w-[420px] text-[16px] leading-relaxed text-white/80">Teach, assess, approve and supervise from one screen that shows what needs you today.</p>
          <ul className="mt-8 grid max-w-[440px] grid-cols-2 gap-3 text-[14px]">
            {[
              { icon: CalendarCheck2, label: "Registers in under a minute" },
              { icon: ClipboardCheck, label: "Approvals with a reason" },
              { icon: GraduationCap, label: "Chapter reviews in place" },
              { icon: BadgeCheck, label: "Grades checked before submit" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <Icon className="size-4 shrink-0" /> {label}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[12px] text-white/60">BU Pulse keeps one record for teaching, grading and approvals.</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/20">
              <Activity className="size-5 text-[#003cbb]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Pulse</p>
              <p className="text-[13px] text-gray-500">Lecturer</p>
            </div>
          </div>

          {notice && <p className="mb-5 rounded-2xl bg-white px-4 py-3 text-[13px] text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800">{notice}</p>}

          {step.kind === "choose" && (
            <>
              <h2 className="text-[26px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Sign in</h2>
              <p className="mt-1 text-[14px] text-gray-500">For lecturers, course advisors and supervisors.</p>

              <Btn size="lg" variant="dark" className="mt-7 w-full" icon={ShieldCheck} onClick={() => (setError(null), setStep({ kind: "sso" }))}>
                Continue with university account
              </Btn>

              <div className="my-6 flex items-center gap-3 text-[12px] font-medium text-gray-400">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" /> or use your staff ID <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>

              <StaffIdForm pending={pending} error={error} onSubmit={(id, pw) => submit(() => signInWithStaffId(id, pw))} />
            </>
          )}

          {step.kind === "sso" && (
            <form onSubmit={(e) => submit(() => signInWithSso(new FormData(e.currentTarget).get("email") as string))(e)} className="flex flex-col gap-5">
              <BackButton className="w-fit" onClick={() => (setError(null), setStep({ kind: "choose" }))} />
              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-50">University account</h2>
                <p className="mt-1 text-[14px] text-gray-500">
                  {/* TODO(api): replace with the university IdP redirect (see lib/auth/google.ts). */}
                  Demo: type the staff email your SSO would return.
                </p>
              </div>
              <Field label="Staff email" htmlFor="email" error={error}>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="name@babcock.edu.ng" required aria-invalid={!!error} defaultValue="amos.awoniyi@babcock.edu.ng" />
              </Field>
              <Btn type="submit" size="lg" loading={pending} className="w-full">
                Continue
              </Btn>
            </form>
          )}

          {step.kind === "not-recognised" && (
            <form onSubmit={(e) => submit(() => requestInstructorLink(new FormData(e.currentTarget).get("instructorId") as string))(e)} className="flex flex-col gap-5">
              <BackButton className="w-fit" onClick={() => (setError(null), setStep({ kind: "sso" }))} />
              <div className="rounded-2xl bg-amber-50 p-4 text-[14px] leading-relaxed text-amber-900 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
                <p className="font-semibold">We can&apos;t find a staff record for {step.email}.</p>
                <p className="mt-1">Your instructor record may have no email (this is common). Ask ICT to add it, or enter your Instructor ID below.</p>
              </div>
              <Field label="Instructor ID" htmlFor="instructorId" hint="Shown on your BU Pulse staff profile, for example NIYI." error={error}>
                <Input id="instructorId" name="instructorId" autoCapitalize="characters" autoComplete="off" required aria-invalid={!!error} />
              </Field>
              <Btn type="submit" size="lg" loading={pending} className="w-full">
                Send code to department admin
              </Btn>
            </form>
          )}

          {step.kind === "code" && (
            <form onSubmit={(e) => submit(() => verifyInstructorLink(step.instructorId, new FormData(e.currentTarget).get("code") as string))(e)} className="flex flex-col gap-5">
              <BackButton className="w-fit" onClick={() => (setError(null), setStep({ kind: "choose" }))} />
              <div>
                <h2 className="text-[24px] font-bold tracking-tight text-gray-900 dark:text-gray-50">Ask for your code</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-gray-500">
                  We sent a one-time code to <span className="font-semibold text-gray-800 dark:text-gray-200">{step.admin}</span>. They confirm it&apos;s you, then share the code. We log this link for audit.
                </p>
              </div>
              <Field label="6-digit code" htmlFor="code" error={error}>
                <Input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required aria-invalid={!!error} className="text-center font-mono text-[20px] tracking-[0.5em]" />
              </Field>
              <Btn type="submit" size="lg" loading={pending} className="w-full">
                Verify and sign in
              </Btn>
            </form>
          )}

          <p className="mt-8 text-center text-[13px] text-gray-500">
            A student? <Link href="/login" className="font-semibold text-[#003cbb] hover:underline dark:text-[#7aa2ff]">Go to the student portal</Link>
          </p>
          <p className="mt-2 text-center text-[12px] text-gray-400">Sessions end after 8 hours or when you close the browser.</p>
        </div>
      </main>
    </div>
  );
}

function StaffIdForm({ pending, error, onSubmit }: { pending: boolean; error: string | null; onSubmit: (id: string, pw: string) => (e: FormEvent) => void }) {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  return (
    <form onSubmit={onSubmit(id, pw)} className="flex flex-col gap-4">
      <Field label="Staff ID" htmlFor="staffId">
        <Input id="staffId" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="characters" placeholder="e.g. NIYI" required aria-invalid={!!error} />
      </Field>
      <Field label="Password" htmlFor="password" error={error}>
        <Input id="password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required aria-invalid={!!error} />
      </Field>
      <Btn type="submit" size="lg" variant="secondary" icon={KeyRound} loading={pending} className="w-full">
        Sign in with staff ID
      </Btn>
    </form>
  );
}
