"use client";

/**
 * Camera QR scanner. Uses the browser's built-in BarcodeDetector (Chrome on
 * Android) and falls back to @zxing/browser where it's missing (Safari, older
 * Android WebViews). Calls onResult once, then stops the camera.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CameraOff, Loader2 } from "lucide-react";

type Status = "starting" | "scanning" | "denied" | "unsupported" | "error";

interface Detector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

export function QrScanner({ onResult, paused = false }: { onResult: (text: string) => void; paused?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const doneRef = useRef(false);
  const onResultRef = useRef(onResult);
  useLayoutEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (paused) return;
    doneRef.current = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopZxing: (() => void) | null = null;
    let cancelled = false;

    const finish = (text: string) => {
      if (doneRef.current) return;
      doneRef.current = true;
      if ("vibrate" in navigator) navigator.vibrate?.(60);
      onResultRef.current(text);
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unsupported");
        return;
      }
      const video = videoRef.current;
      if (!video) return;

      const Native = (window as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector;
      const nativeOk = Native && (await Native.getSupportedFormats?.().then((f) => f.includes("qr_code")).catch(() => false));

      try {
        if (nativeOk && Native) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
          if (cancelled) return;
          video.srcObject = stream;
          await video.play();
          setStatus("scanning");
          const detector = new Native({ formats: ["qr_code"] });
          let last = 0;
          const tick = async (t: number) => {
            if (cancelled || doneRef.current) return;
            if (t - last > 220 && video.readyState >= 2) {
              last = t;
              try {
                const codes = await detector.detect(video);
                if (codes[0]?.rawValue) return finish(codes[0].rawValue);
              } catch {
                // a frame failed to decode; keep going
              }
            }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        } else {
          const { BrowserQRCodeReader } = await import("@zxing/browser");
          if (cancelled) return;
          const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 200 });
          const controls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video, (result) => {
            if (result) finish(result.getText());
          });
          stopZxing = () => controls.stop();
          if (cancelled) return stopZxing();
          setStatus("scanning");
        }
      } catch (e) {
        const name = (e as DOMException)?.name;
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "error");
      }
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopZxing?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [paused]);

  const blocked = status === "denied" || status === "unsupported" || status === "error";

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto rounded-[24px] overflow-hidden bg-black">
      <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" aria-label="Camera preview" />

      {/* Corner brackets + sweep line (PayPal / Opera pattern) */}
      {!blocked && (
        <div aria-hidden className="absolute inset-[14%]">
          {["top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-[18px]", "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-[18px]", "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-[18px]", "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-[18px]"].map((c) => (
            <span key={c} className={`absolute w-10 h-10 border-white ${c}`} />
          ))}
          {status === "scanning" && <span className="absolute left-2 right-2 h-[2px] rounded-full bg-[#4d82ff] shadow-[0_0_12px_2px_rgba(77,130,255,0.7)] animate-[scan_2.2s_ease-in-out_infinite]" />}
        </div>
      )}

      {status === "starting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-[13px]">Starting camera…</p>
        </div>
      )}

      {blocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-white">
          <span className="w-12 h-12 rounded-full bg-white/10 inline-flex items-center justify-center">
            <CameraOff className="w-6 h-6" />
          </span>
          <p className="text-[15px] font-semibold">{status === "denied" ? "Camera access is off" : "Camera isn't available"}</p>
          <p className="text-[13px] text-white/70 leading-relaxed">
            {status === "denied" ? "Allow camera access for Pulse in your browser settings, or type the 6-digit code instead." : "Type the 6-digit code shown on the lecturer's screen instead."}
          </p>
        </div>
      )}
    </div>
  );
}
