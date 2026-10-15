"use client";

/**
 * "Install Pulse" prompt and the iPhone/iPad walkthrough.
 *
 * - A small card invites students to install, a few seconds after they land
 *   (never on top of a task they just opened). "Not now" hides it for a day.
 * - Chromium installs in one tap (the browser's own dialog).
 * - iOS gets a step-by-step guide for Share → Add to Home Screen, tuned to the
 *   browser they are in, since iOS has no install button for web apps.
 * - Menus can reopen it any time: `openInstallApp()`.
 */

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, Check, Copy, Download, Ellipsis, MoreHorizontal, PlusSquare, Share, WifiOff, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet } from "@/components/student/ui";
import { cn } from "@/lib/utils";
import { iosBrowser, isIPad, promptInstall, snoozeInstallPrompt, useInstallPlatform, wasDismissedRecently, type IosBrowser } from "@/lib/pwa/install";

const OPEN_EVENT = "pulse:install-app";

/** Opens the install flow from anywhere (menus, settings). */
export function openInstallApp() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** True when this device can install Pulse and hasn't yet; menus use it to show "Install app". */
export function useCanInstallApp() {
  const p = useInstallPlatform();
  return p === "native" || p === "ios";
}

/** Pages where a prompt would interrupt a task in progress */
const QUIET_ROUTES = ["/registration/courses", "/dashboard/finance/fees", "/attendance/check-in", "/campus-map"];
const PROMPT_DELAY_MS = 6000;

export function InstallAppHost() {
  const platform = useInstallPlatform();
  const pathname = usePathname() ?? "";
  const [cardOpen, setCardOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const canInstall = platform === "native" || platform === "ios";
  const quiet = QUIET_ROUTES.some((r) => pathname.startsWith(r));

  // Offer once per snooze window, after the student has had a moment on the page
  useEffect(() => {
    if (!canInstall || quiet || wasDismissedRecently()) return;
    const t = window.setTimeout(() => setCardOpen(true), PROMPT_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [canInstall, quiet]);

  const install = useCallback(async () => {
    setCardOpen(false);
    if (platform === "ios") {
      setGuideOpen(true);
      return;
    }
    if (platform === "native") {
      const accepted = await promptInstall();
      if (accepted) toast.success("Pulse is installing. Find it on your home screen, desktop or app list.");
    }
  }, [platform]);

  // Menus ask for the flow directly
  useEffect(() => {
    const open = () => {
      setCardOpen(false);
      if (platform === "ios") setGuideOpen(true);
      else if (platform === "native") void install();
      else if (platform === "installed") toast.success("Pulse is already installed on this device.");
      else toast("Open Pulse in Chrome, Edge or Safari to install it.");
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, [platform, install]);

  const dismiss = () => {
    setCardOpen(false);
    snoozeInstallPrompt();
  };

  return (
    <>
      <AnimatePresence>
        {cardOpen && canInstall && !quiet && (
          <motion.div
            role="dialog"
            aria-label="Install Pulse"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
              "fixed z-[60] left-4 right-4 bottom-[calc(96px+env(safe-area-inset-bottom,0px))]",
              "md:left-[calc(16rem+24px)] md:right-auto md:bottom-6 md:w-[380px]",
              "rounded-[20px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4",
              "shadow-[0_12px_40px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)]",
            )}
          >
            <div className="flex items-start gap-3">
              <AppIcon className="w-12 h-12 rounded-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Get the Pulse app</p>
                <p className="text-[13px] leading-snug text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="md:hidden">Opens in one tap from your home screen, full screen, with class and fee alerts.</span>
                  <span className="hidden md:inline">Opens in its own window from your desktop or taskbar, with class and fee alerts.</span>
                </p>
              </div>
              <button type="button" onClick={dismiss} aria-label="Not now" className="-mt-1 -mr-1 w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <Btn variant="secondary" className="flex-1 whitespace-nowrap" onClick={dismiss}>
                Not now
              </Btn>
              <Btn className="flex-1 whitespace-nowrap" icon={platform === "ios" ? PlusSquare : Download} onClick={install}>
                {platform === "ios" ? "Show me how" : "Install"}
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <IosInstallGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}

function AppIcon({ className }: { className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden shrink-0 bg-white border border-[#dbe5fb] dark:border-white/10", className)}>
      {/* The BU Pulse logomark, padded inside a white app tile */}
      <Image src="/images/bu-pulse-logomark.svg" alt="" fill sizes="64px" className="object-contain p-[18%]" />
    </span>
  );
}

// ── iOS walkthrough ───────────────────────────────────────────────────────────

type Step = { title: string; body: React.ReactNode; art: React.ReactNode };

function stepsFor(browser: IosBrowser, ipad: boolean): Step[] {
  const shareWhere =
    browser === "safari"
      ? ipad
        ? "at the top right of Safari, next to the address bar"
        : "in Safari's toolbar. On iOS 26, tap the ••• button first, then Share"
      : browser === "chrome"
        ? "at the right end of Chrome's address bar"
        : browser === "edge"
          ? "in Edge's menu (•••), then tap Share"
          : "in Firefox's menu (☰), then tap Share";

  return [
    {
      title: "Tap Share",
      body: (
        <>
          Find the <ShareGlyph /> Share button {shareWhere}.
        </>
      ),
      art: <ShareArt browser={browser} ipad={ipad} />,
    },
    {
      title: "Choose Add to Home Screen",
      body: (
        <>
          Scroll the list and tap <b className="font-semibold text-gray-900 dark:text-gray-100">Add to Home Screen</b>. Don&apos;t see it? Tap <b className="font-semibold text-gray-900 dark:text-gray-100">Edit Actions</b> at the bottom to add it.
        </>
      ),
      art: <ShareSheetArt />,
    },
    {
      title: "Tap Add",
      body: (
        <>
          Keep <b className="font-semibold text-gray-900 dark:text-gray-100">Open as Web App</b> switched on, then tap <b className="font-semibold text-gray-900 dark:text-gray-100">Add</b> at the top right.
        </>
      ),
      art: <AddArt />,
    },
    {
      title: "Open Pulse from your home screen",
      body: <>Pulse now opens full screen like any app. Sign in once and you&apos;re set.</>,
      art: <HomeScreenArt />,
    },
  ];
}

export function IosInstallGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [browser, ipad] = typeof navigator === "undefined" ? (["safari", false] as const) : ([iosBrowser(), isIPad()] as const);
  const unsupported = browser === "other";
  const steps = stepsFor(browser, ipad);
  const last = step === steps.length - 1;

  const close = () => {
    onClose();
    setStep(0);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/dashboard");
      toast.success("Link copied. Paste it into Safari.");
    } catch {
      toast.error("Couldn't copy. Open this page in Safari instead.");
    }
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Install Pulse on your iPhone"
      footer={
        unsupported ? (
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={close}>
              Close
            </Btn>
            <Btn className="flex-1" icon={Copy} onClick={copyLink}>
              Copy link
            </Btn>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 mr-auto" aria-hidden>
              {steps.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === step ? "w-5 bg-[#003cbb] dark:bg-[#4d82ff]" : "w-1.5 bg-gray-200 dark:bg-gray-700")} />
              ))}
            </div>
            {step > 0 && (
              <Btn variant="secondary" onClick={() => setStep((s) => s - 1)}>
                Back
              </Btn>
            )}
            <Btn icon={last ? Check : undefined} onClick={() => (last ? close() : setStep((s) => s + 1))}>
              {last ? "Got it" : "Next"}
            </Btn>
          </div>
        )
      }
    >
      {unsupported ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <AppIcon className="w-16 h-16 rounded-[16px]" />
          <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">Open Pulse in Safari to install it</p>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[320px]">
            This browser can&apos;t add apps to your home screen. Copy the link, open Safari, paste it in the address bar, then follow the steps.
          </p>
        </div>
      ) : (
        <>
          <Benefits />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              <div className="rounded-[20px] bg-[#f5f8fe] dark:bg-gray-800/60 border border-[#e5ecfb] dark:border-gray-800 h-[220px] flex items-center justify-center overflow-hidden">{steps[step].art}</div>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-wider text-[#003cbb] dark:text-[#4d82ff]">
                Step {step + 1} of {steps.length}
              </p>
              <h4 className="mt-1 text-[17px] font-semibold text-gray-900 dark:text-gray-100">{steps[step].title}</h4>
              <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600 dark:text-gray-400">{steps[step].body}</p>
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </Sheet>
  );
}

function Benefits() {
  const items = [
    { icon: Zap, label: "One tap to open" },
    { icon: BellRing, label: "Class & fee alerts" },
    { icon: WifiOff, label: "Works on weak signal" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 mb-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-gray-100 dark:border-gray-800 px-2 py-2.5 text-center">
          <i.icon className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
          <span className="text-[11px] leading-tight font-medium text-gray-600 dark:text-gray-400">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Illustrations (drawn with the app's own tokens, so they follow dark mode) ──

function ShareGlyph() {
  return <Share className="inline w-4 h-4 -mt-0.5 text-[#007aff]" aria-label="Share" />;
}

function Tap({ className }: { className?: string }) {
  return (
    <span className={cn("absolute pointer-events-none", className)} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-[#007aff]/30 animate-ping" />
      <span className="relative block w-full h-full rounded-full ring-2 ring-[#007aff]" />
    </span>
  );
}

function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("relative w-[150px] h-[200px] mt-10 rounded-t-[26px] border-[5px] border-b-0 border-gray-900 dark:border-gray-600 bg-white dark:bg-gray-950 overflow-hidden", className)}>{children}</div>;
}

function ShareArt({ browser, ipad }: { browser: IosBrowser; ipad: boolean }) {
  // Where the Share button lives, roughly, per browser
  const topRight = ipad || browser === "chrome";
  const viaMenu = browser === "edge" || browser === "firefox";
  return (
    <Phone>
      <div className="px-3 pt-3 flex items-center gap-1.5">
        <div className="h-5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[8px] text-gray-400 flex items-center px-2 truncate">pulse.babcock.edu.ng</div>
        {topRight && (
          <span className="relative w-5 h-5 flex items-center justify-center">
            <Share className="w-3.5 h-3.5 text-[#007aff]" />
            <Tap className="-inset-1.5" />
          </span>
        )}
      </div>
      <div className="px-3 mt-3 space-y-1.5">
        <div className="h-8 rounded-lg bg-[#eef3fd] dark:bg-[#003cbb]/25" />
        <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-4/5" />
        <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-3/5" />
      </div>
      {!topRight && (
        <div className="absolute bottom-0 inset-x-0 h-11 border-t border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-950 flex items-center justify-around px-2 text-gray-400">
          <span className="text-[10px]">‹</span>
          <span className="text-[10px]">›</span>
          {viaMenu || browser === "safari" ? (
            <span className="relative w-5 h-5 flex items-center justify-center">
              {viaMenu ? <MoreHorizontal className="w-3.5 h-3.5 text-[#007aff]" /> : <Share className="w-3.5 h-3.5 text-[#007aff]" />}
              <Tap className="-inset-1.5" />
            </span>
          ) : null}
          <Ellipsis className="w-3.5 h-3.5" />
        </div>
      )}
    </Phone>
  );
}

function ShareSheetArt() {
  const rows = ["Copy", "Add to Reading List", "Add Bookmark", "Add to Home Screen", "Find on Page"];
  return (
    <Phone className="bg-gray-100 dark:bg-gray-900">
      <div className="absolute inset-x-0 bottom-0 top-6 rounded-t-[14px] bg-white dark:bg-gray-950 px-2 pt-2 space-y-1">
        {rows.map((r) => {
          const hit = r === "Add to Home Screen";
          return (
            <div key={r} className={cn("relative h-6 rounded-md px-2 flex items-center justify-between text-[8.5px]", hit ? "bg-[#eaf2ff] dark:bg-[#007aff]/20 text-gray-900 dark:text-gray-100 font-semibold" : "bg-gray-50 dark:bg-gray-900 text-gray-500")}>
              {r}
              {hit && <PlusSquare className="w-3 h-3 text-gray-700 dark:text-gray-300" />}
              {hit && <Tap className="-inset-0.5 rounded-md [&>span]:rounded-md" />}
            </div>
          );
        })}
      </div>
    </Phone>
  );
}

function AddArt() {
  return (
    <Phone className="bg-gray-100 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-1 px-2.5 pt-3 text-[8px] whitespace-nowrap">
        <span className="text-[#007aff]">Cancel</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">Add to Home</span>
        <span className="relative font-semibold text-[#007aff]">
          Add
          <Tap className="-inset-x-2 -inset-y-1.5" />
        </span>
      </div>
      <div className="mx-2.5 mt-3 rounded-lg bg-white dark:bg-gray-950 p-2 flex items-center gap-2">
        <AppIcon className="w-8 h-8 rounded-[8px]" />
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-gray-900 dark:text-gray-100">Pulse</p>
          <p className="text-[7.5px] text-gray-400 truncate">pulse.babcock.edu.ng</p>
        </div>
      </div>
      <div className="mx-2.5 mt-2 rounded-lg bg-white dark:bg-gray-950 px-2 h-7 flex items-center justify-between">
        <span className="text-[8.5px] text-gray-700 dark:text-gray-300">Open as Web App</span>
        <span className="w-6 h-3.5 rounded-full bg-[#34c759] p-[2px] flex justify-end">
          <span className="w-2.5 h-2.5 rounded-full bg-white" />
        </span>
      </div>
    </Phone>
  );
}

function HomeScreenArt() {
  return (
    <Phone className="bg-gradient-to-b from-[#1d3f9a] to-[#0b1f55] border-gray-900">
      <div className="grid grid-cols-4 gap-2.5 p-3.5 pt-5">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className="aspect-square rounded-[7px] bg-white/15" />
        ))}
        <span className="relative flex flex-col items-center gap-0.5">
          <AppIcon className="w-full aspect-square rounded-[7px]" />
          <span className="text-[6.5px] text-white font-medium">Pulse</span>
          <Tap className="-inset-1 bottom-2 rounded-[9px] [&>span]:rounded-[9px]" />
        </span>
      </div>
    </Phone>
  );
}
