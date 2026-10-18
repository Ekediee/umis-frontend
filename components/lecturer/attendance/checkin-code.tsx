"use client";

/**
 * 3.4a Show a code: full-screen 6-digit code + QR, refreshing every 30 s, with
 * a live "47 of 58 checked in" count. Readable from 10 m on a projector and
 * spoken on request. Works offline: the code is time-based (TOTP-style), so
 * students' phones can verify it and upload check-ins when they reconnect.
 *
 * TODO(api): live count via SSE (GET /lecturer/sessions/:id/checkins/stream);
 * the server validates campus Wi-Fi / geofence. The QR is a real code (see CheckinQr).
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Maximize2, Minimize2, Volume2, X } from "lucide-react";
import type { AttendanceStatus, Student } from "@/lib/lecturer/types";
import { fullName } from "@/lib/lecturer/format";
import { PersonAvatar } from "../ui/primitives";
import { CHECKIN_PERIOD_S, checkinUrl, encodeMockToken, totpCode } from "@/lib/attendance/code";

const PERIOD = CHECKIN_PERIOD_S;
const LATE_AFTER_MIN = 15;

export { totpCode };

/**
 * Scannable check-in QR. It encodes a link to /attendance/check-in, so a
 * student's own camera app opens Pulse on the right screen.
 * Mock mode: the token carries the session seed + the code on screen.
 * TODO(api): in live mode draw the backend-signed token from POST /lecturer/sessions/:id/qr.
 */
function CheckinQr({ seed, code, size = 220 }: { seed: string; code: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const url = checkinUrl(window.location.origin, encodeMockToken({ seed, code }));
    QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0a0d14", light: "#ffffff" } })
      .then((s) => !cancelled && setSvg(s))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [seed, code]);
  return (
    <div role="img" aria-label="Check-in QR code" style={{ width: size, height: size }} className="rounded-xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full">
      {svg ? <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />}
    </div>
  );
}

export function CheckinCode({ seed, roster, title, onEnd, onCancel }: { seed: string; roster: Student[]; title: string; onEnd: (checked: Record<string, AttendanceStatus>) => void; onCancel: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const [startedAt] = useState(() => Date.now());
  const [checked, setChecked] = useState<Record<string, AttendanceStatus>>({});
  const [latest, setLatest] = useState<Student | null>(null);
  const [full, setFull] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // Demo: students check in over time until ~90% are here.
  useEffect(() => {
    const target = Math.round(roster.length * 0.9);
    const pending = [...roster].sort(() => 0.5 - Math.random());
    let i = 0;
    const t = setInterval(() => {
      if (i >= target) return clearInterval(t);
      const s = pending[i++];
      const late = (Date.now() - startedAt) / 60_000 > LATE_AFTER_MIN;
      setChecked((c) => ({ ...c, [s.id]: late ? "late" : "present" }));
      setLatest(s);
    }, 280 + Math.random() * 400);
    return () => clearInterval(t);
  }, [roster, startedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.fullscreenElement && onCancel();
    document.addEventListener("keydown", onKey);
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [onCancel]);

  const code = totpCode(seed, now);
  const secondsLeft = PERIOD - (Math.floor(now / 1000) % PERIOD);
  const count = Object.keys(checked).length;
  const elapsedMin = Math.floor((now - startedAt) / 60_000);
  const elapsedSec = Math.floor(((now - startedAt) / 1000) % 60);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(`The code is ${code.split("").join(" ")}`);
    u.rate = 0.8;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : rootRef.current?.requestFullscreen?.());

  return (
    <div ref={rootRef} className="fixed inset-0 z-[400] flex flex-col bg-[#0a0d14] text-white" role="dialog" aria-modal="true" aria-label={`Check-in code for ${title}`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-5">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          <p className="text-[12px] text-white/60">
            Open Pulse → Check in · {elapsedMin}:{String(elapsedSec).padStart(2, "0")} elapsed · late after {LATE_AFTER_MIN} min
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={speak} aria-label="Read the code aloud" className="inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
            <Volume2 className="size-5" />
          </button>
          <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} className="hidden size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 md:inline-flex">
            {full ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
          </button>
          <button type="button" onClick={onCancel} aria-label="Cancel check-in" className="inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 md:flex-row md:gap-16">
        <div className="flex flex-col items-center gap-4">
          <p className="font-mono text-[18vw] leading-none font-bold tracking-[0.08em] tabular-nums md:text-[11vw]" aria-live="polite" aria-label={`Code ${code.split("").join(" ")}`}>
            {code.slice(0, 3)}
            <span className="text-white/40"> </span>
            {code.slice(3)}
          </p>
          <div className="flex w-full max-w-[420px] items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sky-400 transition-[width] duration-200" style={{ width: `${(secondsLeft / PERIOD) * 100}%` }} />
            </div>
            <span className="w-14 text-right text-[13px] text-white/70 tabular-nums">New in {secondsLeft}s</span>
          </div>
        </div>
        <div className="hidden sm:block">
          <CheckinQr seed={seed} code={code} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 pb-[max(16px,env(safe-area-inset-bottom))] md:flex-row md:items-center md:justify-between md:px-8">
        <div className="flex items-center gap-3">
          <p className="text-[28px] font-bold tabular-nums">
            {count}
            <span className="text-[16px] font-medium text-white/60"> of {roster.length} checked in</span>
          </p>
          {latest && (
            <span className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-[13px] md:inline-flex">
              <PersonAvatar first={latest.firstName} last={latest.lastName} size={24} /> {fullName(latest)}
            </span>
          )}
        </div>
        <button type="button" onClick={() => onEnd(checked)} className="h-12 rounded-xl bg-white px-6 text-[15px] font-bold text-gray-900 hover:bg-gray-100">
          End check-in
        </button>
      </div>
    </div>
  );
}
