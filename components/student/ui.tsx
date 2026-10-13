"use client";

/**
 * Building blocks for the phase-1 student screens. Every value here is lifted
 * from existing student components (dashboard cards, notifications page,
 * header bottom sheet) so new screens look native:
 * 20px cards with a 1px gray border and a soft shadow, 12px primary buttons in
 * brand blue #003cbb (#2563eb in dark mode), 10px outline "Back" buttons,
 * pastel icon bubbles, 11px uppercase section labels.
 */

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { AlertTriangle, ChevronLeft, Loader2, RotateCw, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/lib/student/api/http";

// ── Layout ────────────────────────────────────────────────────────────────────

export function PageContainer({ className, children, wide = false }: { className?: string; children: ReactNode; wide?: boolean }) {
  return <div className={cn("p-4 md:p-6 pb-28 md:pb-6 overflow-y-auto w-full mx-auto", wide ? "max-w-7xl" : "max-w-[1100px]", className)}>{children}</div>;
}

export function Panel({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" } & Omit<ComponentProps<"div">, "className" | "children">) {
  return (
    <As className={cn("bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 p-5 md:p-6 transition-colors duration-200", className)} {...rest}>
      {children}
    </As>
  );
}

export function PanelHeader({ title, action, icon: Icon, className }: { title: ReactNode; action?: ReactNode; icon?: LucideIcon; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 mb-4 md:mb-5", className)}>
      <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      {action ?? (Icon ? <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : null)}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-[11px] md:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3", className)}>{children}</h3>;
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[13px] md:text-[14px] font-medium text-[#3159d1] dark:text-[#4d82ff] hover:text-[#003095] dark:hover:text-[#8ba7ff] shrink-0">
      {children}
    </Link>
  );
}

// ── Tones ─────────────────────────────────────────────────────────────────────

export type Tone = "blue" | "green" | "purple" | "sky" | "amber" | "red" | "gray";

export const toneBubble: Record<Tone, string> = {
  blue: "bg-[#ebf1ff] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]",
  green: "bg-[#effaf6] dark:bg-[#12B76A]/20 text-[#12B76A] dark:text-[#34d399]",
  purple: "bg-[#fdebff] dark:bg-[#a855f7]/20 text-[#a855f7] dark:text-[#c084fc]",
  sky: "bg-[#ebfaff] dark:bg-[#0ea5e9]/20 text-[#0ea5e9] dark:text-[#38bdf8]",
  amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400",
  red: "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

export const toneChip: Record<Tone, string> = {
  blue: "bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]",
  green: "bg-[#CBF5E5] dark:bg-emerald-900/40 text-[#176448] dark:text-emerald-300",
  purple: "bg-[#fdebff] dark:bg-[#a855f7]/20 text-[#7e22ce] dark:text-[#c084fc]",
  sky: "bg-[#ebfaff] dark:bg-[#0ea5e9]/20 text-[#0369a1] dark:text-[#38bdf8]",
  amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300",
  red: "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300",
};

export function IconBubble({ icon: Icon, tone = "blue", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const glyph = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5";
  return (
    <div className={cn("rounded-full flex items-center justify-center shrink-0", box, toneBubble[tone], className)}>
      <Icon className={glyph} strokeWidth={2} />
    </div>
  );
}

export function Pill({ tone = "blue", children, className, icon: Icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap", toneChip[tone], className)}>
      {Icon && <Icon className="w-3 h-3" strokeWidth={2.5} />}
      {children}
    </span>
  );
}

// ── Buttons ───────────────────────────────────────────────────────────────────

const primary = "inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[12px] text-[14px] font-medium bg-[#003cbb] hover:bg-[#002e8f] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
const secondary = "inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[12px] text-[14px] font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";
const soft = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[13px] font-semibold bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] hover:bg-[#e4ebfa] dark:hover:bg-[#003cbb]/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

export const buttonClass = { primary, secondary, soft };

type BtnProps = ComponentProps<"button"> & { variant?: keyof typeof buttonClass; icon?: LucideIcon; loading?: boolean };

export function Btn({ variant = "primary", icon: Icon, loading, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button type="button" className={cn(buttonClass[variant], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4" /> : null}
      {children}
    </button>
  );
}

export function BtnLink({ variant = "primary", icon: Icon, className, children, ...rest }: ComponentProps<typeof Link> & { variant?: keyof typeof buttonClass; icon?: LucideIcon }) {
  return (
    <Link className={cn(buttonClass[variant], className)} {...rest}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );
}

export function BackLink({ href, children = "Back" }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[#003cbb] dark:text-gray-200 text-[14px] font-medium bg-white dark:bg-gray-900 border border-[#003cbb]/20 dark:border-gray-800 rounded-[10px] px-4 py-2 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
      {children}
    </Link>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────────

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("w-11 h-6 rounded-full p-1 transition-colors duration-200 shrink-0 disabled:opacity-50", checked ? "bg-[#003cbb] dark:bg-[#2563eb]" : "bg-gray-200 dark:bg-gray-700")}
    >
      <span className={cn("block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

export function FilterChip({ active, onClick, children, icon: Icon, count }: { active: boolean; onClick: () => void; children: ReactNode; icon?: LucideIcon; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap border transition-colors shrink-0",
        active
          ? "bg-[#003cbb] dark:bg-[#2563eb] text-white border-transparent"
          : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800",
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      {count !== undefined && count > 0 && <span className={cn("min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center", active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800")}>{count}</span>}
    </button>
  );
}

// ── States ────────────────────────────────────────────────────────────────────

/** A <span> so it can sit inside text elements (<p>, headings) without breaking HTML nesting. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-full bg-gray-200 dark:bg-gray-700", className)} />;
}

export function PanelSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <Panel className={className}>
      <Skeleton className="h-5 w-1/3 mb-6" />
      <div className="flex flex-col gap-5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ErrorPanel({ error, onRetry, className }: { error: ApiError; onRetry?: () => void; className?: string }) {
  return (
    <Panel className={cn("flex flex-col items-center text-center py-10", className)}>
      <IconBubble icon={AlertTriangle} tone="red" size="lg" className="mb-4" />
      <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-1">We couldn&apos;t load this</h3>
      <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">{error.message}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-2">Reference {error.code}</p>
      {onRetry && (
        <Btn variant="soft" icon={RotateCw} onClick={onRetry} className="mt-5">
          Try again
        </Btn>
      )}
    </Panel>
  );
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

/**
 * Bottom sheet on phones (same look as the header's options sheet), centred
 * dialog from md up. Closes on overlay tap and Escape; locks body scroll.
 */
export function Sheet({ open, onClose, title, children, footer, size = "md", dark = false }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "md" | "lg" | "full"; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;
  // Portalled to <body>: the layout's content column is its own stacking context (z-10),
  // so a sheet rendered inside it could sit under fixed elements like the AI assistant button.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full outline-none flex flex-col max-h-[92dvh]",
          "rounded-t-[24px] md:rounded-[24px] animate-in slide-in-from-bottom md:slide-in-from-bottom-4 md:fade-in md:zoom-in-95 duration-300 pb-safe",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] md:shadow-xl",
          dark ? "bg-[#0a0d14] text-white" : "bg-white dark:bg-gray-900",
          size === "lg" ? "md:max-w-[640px]" : size === "full" ? "md:max-w-[880px]" : "md:max-w-[480px]",
        )}
      >
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className={cn("w-10 h-1 rounded-full", dark ? "bg-white/25" : "bg-gray-300 dark:bg-gray-700")} />
        </div>
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 md:px-6 py-3 md:pt-5">
            <h3 className={cn("text-[17px] font-semibold", dark ? "text-white" : "text-gray-900 dark:text-gray-100")}>{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={cn("w-9 h-9 flex items-center justify-center rounded-full transition-colors", dark ? "text-white/70 hover:bg-white/10" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 md:px-6 pb-6 flex-1">{children}</div>
        {footer && <div className={cn("px-5 md:px-6 py-4 border-t", dark ? "border-white/10" : "border-gray-100 dark:border-gray-800")}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ── Formatting ────────────────────────────────────────────────────────────────

const noop = () => () => {};

/**
 * False during server render and hydration, true after. Use it for text that
 * depends on the browser's clock, time zone or locale (greetings, dates), so
 * server HTML and the first client render always match.
 */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
