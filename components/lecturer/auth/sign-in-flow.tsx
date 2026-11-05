"use client";

/**
 * 1.1 Sign in → 1.1b Not recognised → code from department admin.
 * Staff email only; student emails are sent to the student portal.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { requestInstructorLink, signInWithSso, signInWithStaffId, verifyInstructorLink, type AuthResult } from "@/app/actions/lecturer-auth";
import { BackButton, Btn, Field, Input } from "../ui/primitives";
import { BrandPanel, PulseMark } from "./brand-panel";

const ROLES = ["Lecturers", "Course advisors", "Supervisors", "HODs and deans"];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

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
      <BrandPanel />

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[420px]">
          <div className="relative mb-8 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#001f66] via-[#003cbb] to-[#1d4ed8] p-5 text-white lg:hidden">
            <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-sky-300/25 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <PulseMark size={44} />
              <div>
                <p className="text-[16px] leading-tight font-bold">BU Pulse</p>
                <p className="text-[12px] text-white/70">Babcock University · Lecturer</p>
              </div>
            </div>
            <p className="relative mt-4 text-[15px] leading-snug font-semibold">Your week, not a wall of tables.</p>
          </div>

          <div className="mb-8 hidden lg:block">
            <PulseMark size={52} className="shadow-none ring-gray-200 dark:ring-gray-800" />
          </div>

          {notice && (
            <p role="status" className="mb-5 rounded-2xl bg-[#eef3fd] px-4 py-3 text-[13px] font-medium text-[#0b2a72] dark:bg-[#003cbb]/20 dark:text-[#cfe0ff]">
              {notice}
            </p>
          )}

          {step.kind === "choose" && (
            <>
              <p className="text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff]" suppressHydrationWarning>
                {greeting()} 👋
              </p>
              <h2 className="mt-1 text-[28px] leading-tight font-bold tracking-tight text-gray-900 dark:text-gray-50">Sign in to Pulse</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Who can sign in">
                {ROLES.map((r) => (
                  <li key={r} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-gray-600 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800">
                    {r}
                  </li>
                ))}
              </ul>

              <Btn size="lg" className="group mt-7 w-full" icon={ShieldCheck} onClick={() => (setError(null), setStep({ kind: "sso" }))}>
                Continue with university account
                <ArrowRight className="ml-auto transition-transform group-hover:translate-x-0.5" />
              </Btn>
              <p className="mt-2 text-center text-[12px] text-gray-500">Recommended · uses your Babcock staff email</p>

              <div className="my-7 flex items-center gap-3 text-[12px] font-medium text-gray-400">
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

          <p className="mt-10 text-center text-[13px] text-gray-500">
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
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (
    <form onSubmit={onSubmit(id, pw)} className="flex flex-col gap-4">
      <Field label="Staff ID" htmlFor="staffId">
        <Input id="staffId" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="characters" placeholder="e.g. NIYI" required aria-invalid={!!error} />
      </Field>
      <Field label="Password" htmlFor="password" error={error} hint={caps ? "Caps Lock is on." : undefined}>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyUp={checkCaps}
            onKeyDown={checkCaps}
            autoComplete="current-password"
            required
            aria-invalid={!!error}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute top-1/2 right-1 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>
      <Btn type="submit" size="lg" variant="secondary" icon={KeyRound} loading={pending} className="w-full">
        Sign in with staff ID
      </Btn>
    </form>
  );
}
