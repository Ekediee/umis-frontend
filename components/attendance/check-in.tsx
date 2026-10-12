"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Hash, Loader2, MapPin, QrCode, RotateCw, TriangleAlert } from "lucide-react";
import { studentApi, demoLiveCode } from "@/lib/student/api";
import { ApiError, STUDENT_API_MODE } from "@/lib/student/api/http";
import { tokenFromScan } from "@/lib/attendance/code";
import { invalidateStudent } from "@/lib/student/query";
import type { CheckInResult } from "@/lib/student/types";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/student/ui";
import { QrScanner } from "./qr-scanner";

type Mode = "scan" | "code";
type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; result: CheckInResult } | { kind: "error"; error: ApiError };

function CodeInput({ value, onChange, onComplete, disabled }: { value: string; onChange: (v: string) => void; onComplete: (v: string) => void; disabled?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\s/g, "").slice(0, 6);
    onChange(next);
    if (next.length === 6) onComplete(next);
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-2.5" role="group" aria-label="6-digit check-in code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d.trim()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={6}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) {
              // pasted or autofilled the whole code
              const full = v.slice(0, 6);
              onChange(full);
              refs.current[Math.min(full.length, 5)]?.focus();
              if (full.length === 6) onComplete(full);
              return;
            }
            setAt(i, v);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d.trim() && i > 0) {
              refs.current[i - 1]?.focus();
              onChange(value.slice(0, i - 1));
            }
          }}
          className={cn(
            "w-11 h-14 md:w-12 md:h-16 rounded-[14px] text-center text-[24px] font-bold tabular-nums outline-none transition-all",
            "bg-white/10 border border-white/15 text-white focus:border-[#4d82ff] focus:ring-3 focus:ring-[#4d82ff]/30 disabled:opacity-60",
            i === 2 && "mr-2 md:mr-3",
          )}
        />
      ))}
    </div>
  );
}

function DemoHint() {
  const [code, setCode] = useState<string | null>(null);
  useEffect(() => {
    if (STUDENT_API_MODE !== "mock") return;
    const load = () => demoLiveCode().then(setCode);
    load();
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, []);
  if (!code) return null;
  return (
    <p className="text-center text-[12px] text-white/50 mt-4">
      Demo mode: the lecturer&apos;s screen shows <span className="font-mono font-bold text-white/80 tracking-wider">{code.slice(0, 3)} {code.slice(3)}</span>
    </p>
  );
}

export function SuccessView({ result, onDone }: { result: CheckInResult; onDone?: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="relative mb-5">
        <span className="absolute inset-0 rounded-full bg-[#12B76A]/30 animate-ping" />
        <span className="relative w-20 h-20 rounded-full bg-[#12B76A] inline-flex items-center justify-center shadow-[0_10px_30px_-6px_rgba(18,183,106,0.6)]">
          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
        </span>
      </motion.div>
      <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
        <p className="text-[22px] font-bold">{result.mark === "late" ? "Checked in, marked late" : "You're checked in"}</p>
        <p className="text-[15px] text-white/70 mt-1">
          {result.courseId} · {result.title}
        </p>
        <p className="inline-flex items-center gap-1.5 text-[13px] text-white/50 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {result.venue} · {new Date(result.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </motion.div>
      <div className="mt-6 w-full grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-white/10 p-4 text-left">
          <p className="text-[24px] font-bold leading-none">{result.percent}%</p>
          <p className="text-[12px] text-white/60 mt-1.5">{result.courseId} attendance</p>
        </div>
        <div className="rounded-[16px] bg-white/10 p-4 text-left">
          <p className="text-[24px] font-bold leading-none capitalize">{result.mark}</p>
          <p className="text-[12px] text-white/60 mt-1.5">{result.mark === "late" ? "Over 15 min after start" : "On time"}</p>
        </div>
      </div>
      {onDone ? (
        <button type="button" onClick={onDone} className="mt-6 w-full h-12 rounded-[12px] bg-white text-gray-900 text-[15px] font-bold hover:bg-gray-100">
          Done
        </button>
      ) : (
        <Link href="/attendance" className="mt-6 w-full h-12 rounded-[12px] bg-white text-gray-900 text-[15px] font-bold hover:bg-gray-100 inline-flex items-center justify-center">
          See my attendance
        </Link>
      )}
    </div>
  );
}

/** Scan / type-code flow. `initialToken` comes from a QR opened with the phone's camera app. */
export function CheckInFlow({ initialToken, onClose }: { initialToken?: string | null; onClose?: () => void }) {
  const [mode, setMode] = useState<Mode>("scan");
  const [code, setCode] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const startedToken = useRef(false);

  const submit = async (input: { token?: string; code?: string }) => {
    setState({ kind: "sending" });
    try {
      const result = await studentApi.checkIn(input);
      setState({ kind: "done", result });
      invalidateStudent("attendance");
      invalidateStudent("live");
      invalidateStudent("today");
    } catch (e) {
      setState({ kind: "error", error: e instanceof ApiError ? e : new ApiError("Check-in failed. Try again.", "ATT-500") });
      setCode("");
    }
  };

  useEffect(() => {
    if (initialToken && !startedToken.current) {
      startedToken.current = true;
      submit({ token: initialToken });
    }
  }, [initialToken]);

  if (state.kind === "done") return <SuccessView result={state.result} onDone={onClose} />;

  return (
    <div>
      <div className="flex items-center bg-white/10 rounded-[14px] p-1 mb-5" role="tablist">
        {(
          [
            ["scan", "Scan QR", QrCode],
            ["code", "Type code", Hash],
          ] as const
        ).map(([m, label, Icon]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setState({ kind: "idle" });
            }}
            className={cn("flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-[10px] text-[14px] font-semibold transition-colors", mode === m ? "bg-white text-gray-900" : "text-white/70 hover:text-white")}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {state.kind === "sending" ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-white/80">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-[14px]">Checking you in…</p>
        </div>
      ) : mode === "scan" ? (
        <>
          <QrScanner
            paused={state.kind === "error"}
            onResult={(text) => {
              const token = tokenFromScan(text);
              if (token) submit({ token });
              else setState({ kind: "error", error: new ApiError("That QR code isn't a Pulse check-in code.", "ATT-415") });
            }}
          />
          <p className="text-center text-[13px] text-white/60 mt-4">Point your camera at the QR code on the lecturer&apos;s screen.</p>
        </>
      ) : (
        <div className="py-6">
          <p className="text-center text-[14px] text-white/70 mb-5">Type the 6-digit code on the lecturer&apos;s screen. It changes every 30 seconds.</p>
          <CodeInput value={code} onChange={setCode} onComplete={(c) => submit({ code: c })} />
          <DemoHint />
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-5 flex items-start gap-3 p-4 rounded-[16px] bg-red-500/15 border border-red-400/30 animate-in fade-in slide-in-from-bottom-1 duration-200" role="alert">
          <TriangleAlert className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white">{state.error.message}</p>
            <p className="text-[11px] text-white/50 mt-1">Reference {state.error.code}</p>
          </div>
          <button type="button" onClick={() => setState({ kind: "idle" })} className="inline-flex items-center gap-1 text-[13px] font-semibold text-white hover:underline shrink-0">
            <RotateCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Check in to class" dark>
      <CheckInFlow onClose={onClose} />
    </Sheet>
  );
}
