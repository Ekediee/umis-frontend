/**
 * Install-the-app state for the Pulse PWA.
 *
 * - Chromium (Android, desktop Chrome/Edge) fires `beforeinstallprompt`; we keep
 *   the event and show our own prompt, then hand it back to the browser.
 * - iOS/iPadOS never fires it: installing is "Share → Add to Home Screen", so we
 *   show a walkthrough instead. Since iOS 16.4 that works from Chrome, Edge and
 *   Firefox on iOS too, not just Safari.
 * - Once the app runs standalone (installed), nothing is shown.
 *
 * "Not now" hides the prompt on this device for SNOOZE_DAYS (one day).
 */

import { useSyncExternalStore } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallPlatform =
  /** Chromium with a captured install event: one tap installs */
  | "native"
  /** iPhone/iPad: Share → Add to Home Screen walkthrough */
  | "ios"
  /** Already running as an installed app */
  | "installed"
  /** Can't install from here (e.g. Firefox desktop) or not known yet */
  | "unsupported";

export type IosBrowser = "safari" | "chrome" | "edge" | "firefox" | "other";

const DISMISS_KEY = "pulse-install-dismissed-at";
const INSTALLED_KEY = "pulse-installed";
export const SNOOZE_DAYS = 1;

let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Keep the browser's mini-infobar quiet; we show our own prompt at a better moment
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedNow = true;
    try {
      localStorage.setItem(INSTALLED_KEY, "1");
    } catch {}
    emit();
  });
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.matchMedia?.("(display-mode: window-controls-overlay)").matches ||
    // iOS Safari's own flag
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(ua = typeof navigator === "undefined" ? "" : navigator.userAgent, touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints): boolean {
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ reports itself as a Mac; touch support gives it away
  return /Macintosh/.test(ua) && touchPoints > 1;
}

export function iosBrowser(ua = typeof navigator === "undefined" ? "" : navigator.userAgent): IosBrowser {
  if (/CriOS/.test(ua)) return "chrome";
  if (/EdgiOS/.test(ua)) return "edge";
  if (/FxiOS/.test(ua)) return "firefox";
  if (/Safari/.test(ua) && !/(OPiOS|YaBrowser|GSA|FBAN|FBAV|Instagram|Line\/)/.test(ua)) return "safari";
  return "other";
}

export function isIPad(ua = typeof navigator === "undefined" ? "" : navigator.userAgent, touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints): boolean {
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
}

function platform(): InstallPlatform {
  if (installedNow || isStandalone()) return "installed";
  if (isIOS()) return "ios";
  if (deferred) return "native";
  return "unsupported";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia?.("(display-mode: standalone)");
  mq?.addEventListener?.("change", cb);
  return () => {
    listeners.delete(cb);
    mq?.removeEventListener?.("change", cb);
  };
}

/** Current install platform; "unsupported" on the server and before hydration. */
export function useInstallPlatform(): InstallPlatform {
  return useSyncExternalStore(subscribe, platform, () => "unsupported");
}

/** Shows the browser's install dialog. Resolves true if the student installed. */
export async function promptInstall(): Promise<boolean> {
  const e = deferred;
  if (!e) return false;
  deferred = null; // an event can only be used once
  await e.prompt();
  const { outcome } = await e.userChoice;
  emit();
  return outcome === "accepted";
}

export function wasDismissedRecently(now = Date.now()): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && now - at < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function snoozeInstallPrompt(now = Date.now()) {
  try {
    localStorage.setItem(DISMISS_KEY, String(now));
  } catch {}
  emit();
}
