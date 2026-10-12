"use client";

/**
 * Lecturer UI kit, built on the BU Pulse student app's shared components
 * (components/ui: Button, Card, Badge, Avatar, Tabs, EmptyState, Skeleton) and
 * its visual language (white 20px-radius cards, brand blue #003cbb, gray-50
 * canvas, full dark mode). It adds what the lecturer flows need: count-first
 * cards, status chips that never rely on colour alone, segmented filters with
 * counts, and explained empty states.
 *
 * Tap targets are ≥ 44px (WCAG 2.2 AA, quality bar).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, CircleDot, Clock, FolderOpen, Info, LifeBuoy, Loader2, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials as toInitials } from "@/lib/lecturer/format";
import type { ApiError } from "@/lib/lecturer/api/http";

// ── Surface ──────────────────────────────────────────────────────────────────

export function Surface({ className, padded = true, ...props }: ComponentProps<"div"> & { padded?: boolean }) {
  return (
    <Card
      className={cn(
        // Student dashboard card (quick-actions, recent-updates): 20px radius, hairline border.
        "block gap-0 rounded-[20px] border border-gray-200 bg-white py-0 text-[14px] ring-0 transition-colors dark:border-gray-800 dark:bg-gray-900",
        padded && "p-5 md:p-6",
        // Card defaults to flex-col; a caller asking for "flex" wants a row unless it says otherwise.
        /(^|\s)flex(\s|$)/.test(className ?? "") && !/flex-col/.test(className ?? "") && "flex-row",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ title, count, action, className, as: Tag = "h2" }: { title: string; count?: number; action?: ReactNode; className?: string; as?: "h2" | "h3" }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <Tag className="flex items-center gap-2 text-[16px] font-bold tracking-tight text-gray-900 md:text-[17px] dark:text-gray-100">
        {title}
        {count !== undefined && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 px-2 text-[12px] font-semibold text-gray-600 tabular-nums dark:bg-gray-800 dark:text-gray-300">
            {count}
          </span>
        )}
      </Tag>
      {action}
    </div>
  );
}

/**
 * The student app's back button (semester results, courses, transcript, fees):
 * shared outline Button, ChevronLeft, "Back". `to` names the destination for
 * screen readers; with no href it goes back in history like the student app.
 */
export function BackButton({ href, onClick, to, className }: { href?: string; onClick?: () => void; to?: string; className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      aria-label={to ? `Back to ${to}` : "Back"}
      className={cn(
        "rounded-[10px] text-[#003cbb] dark:text-[#4d82ff] font-semibold px-4 h-10 border-gray-200 dark:border-gray-700 hover:bg-[#f5f8fe] dark:hover:bg-gray-800 hover:text-[#003095] dark:hover:text-[#8ba7ff] bg-white dark:bg-gray-900 transition-colors",
        className,
      )}
      onClick={onClick ?? (() => (href ? router.push(href) : router.back()))}
    >
      <ChevronLeft className="w-4 h-4 mr-1" />
      Back
    </Button>
  );
}

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <BackButton href={back.href} to={back.label} className="mb-4" />
        )}
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900 md:text-[26px] dark:text-gray-50">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "dark";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-xl font-semibold transition-all outline-none focus-visible:ring-3 focus-visible:ring-[#003cbb]/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px] [&_svg]:shrink-0";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-[#003cbb] text-white hover:bg-[#003199] dark:bg-[#2d6bff] dark:hover:bg-[#4d82ff]",
  secondary: "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
  danger: "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  dark: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-12 px-5 text-[15px]",
};

export function btnClass(variant: BtnVariant = "primary", size: BtnSize = "md", className?: string) {
  return cn(btnBase, btnVariants[variant], btnSizes[size], className);
}

const SHARED_VARIANT: Record<BtnVariant, "default" | "outline" | "ghost" | "destructive"> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
  success: "default",
  dark: "default",
};

/** The student app's shared Button, sized for 44px tap targets. */
export const Btn = forwardRef<HTMLButtonElement, ComponentProps<"button"> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean; icon?: LucideIcon }>(
  function Btn({ variant = "primary", size = "md", loading, icon: Icon, className, children, disabled, type = "button", ...props }, ref) {
    return (
      <Button ref={ref} type={type} variant={SHARED_VARIANT[variant]} className={btnClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
        {loading ? <Loader2 className="animate-spin" /> : Icon ? <Icon /> : null}
        {children}
      </Button>
    );
  },
);

export function BtnLink({ href, variant = "primary", size = "md", icon: Icon, className, children, ...props }: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: BtnSize; icon?: LucideIcon }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant: SHARED_VARIANT[variant] }), btnClass(variant, size, className))} {...props}>
      {Icon && <Icon />}
      {children}
    </Link>
  );
}

export function IconBtn({ label, icon: Icon, className, badge, ...props }: ComponentProps<"button"> & { label: string; icon: LucideIcon; badge?: number }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-3 focus-visible:ring-[#003cbb]/30 focus-visible:outline-none dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        className,
      )}
      {...props}
    >
      <Icon className="size-5" />
      {!!badge && (
        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white dark:border-gray-900">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

/** Revolut-style round quick action: circle icon + label underneath. */
export function RoundAction({ icon: Icon, label, href, onClick, tone = "light" }: { icon: LucideIcon; label: string; href?: string; onClick?: () => void; tone?: "light" | "onBrand" }) {
  const inner = (
    <>
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition-transform group-active:scale-95",
          tone === "onBrand" ? "bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-sm group-hover:bg-white/25" : "bg-[#eef3fd] text-[#003cbb] group-hover:bg-[#e1eafc] dark:bg-[#003cbb]/20 dark:text-[#7aa2ff]",
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className={cn("max-w-[84px] text-center text-[12px] leading-tight font-semibold", tone === "onBrand" ? "text-white/90" : "text-gray-700 dark:text-gray-300")}>{label}</span>
    </>
  );
  const cls = "group flex min-w-[64px] flex-col items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-white/40 rounded-2xl p-1";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ── Chips & status ───────────────────────────────────────────────────────────

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "purple";

const toneClass: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  blue: "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  red: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
};

const toneIcon: Record<Tone, LucideIcon> = {
  neutral: CircleDot,
  blue: Info,
  green: CheckCircle2,
  amber: Clock,
  red: AlertTriangle,
  purple: CircleDot,
};

/** Status chip: icon + words, so status is never conveyed by colour alone. */
export function Chip({ tone = "neutral", icon, children, className, noIcon }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string; noIcon?: boolean }) {
  const Icon = icon ?? toneIcon[tone];
  return (
    <Badge variant="secondary" className={cn("h-6 gap-1 rounded-full px-2.5 text-[12px] font-semibold", toneClass[tone], className)}>
      {!noIcon && <Icon strokeWidth={2.4} aria-hidden />}
      {children}
    </Badge>
  );
}

export function Dot({ tone }: { tone: "amber" | "red" | "green" | "blue" }) {
  const c = { amber: "bg-amber-500", red: "bg-red-500", green: "bg-emerald-500", blue: "bg-[#003cbb]" }[tone];
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", c)} aria-hidden />;
}

// ── Segmented filter with counts (6.1, Gumloop/AirOps pattern) ───────────────

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
  size?: "sm" | "md";
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("no-scrollbar -mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 py-0.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-[#003cbb]/30 focus-visible:outline-none",
              size === "md" ? "h-10 px-4 text-[13px]" : "h-8 px-3 text-[12px]",
              active
                ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:text-white",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20 dark:bg-gray-900/10" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Underline tabs for the course workspace (2.2): the shared Tabs, line variant. */
export function LineTabs<T extends string>({ value, onChange, options, ariaLabel }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; badge?: number }[]; ariaLabel: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)} className="gap-0">
      <TabsList
        variant="line"
        aria-label={ariaLabel}
        className="no-scrollbar -mx-4 w-[calc(100%+2rem)] justify-start gap-1 overflow-x-auto rounded-none border-b border-gray-200 px-4 group-data-horizontal/tabs:h-12 md:mx-0 md:w-full md:px-0 dark:border-gray-800"
      >
        {options.map((o) => (
          <TabsTrigger
            key={o.value}
            value={o.value}
            className="h-12 flex-none px-3 text-[14px] font-semibold text-gray-500 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-[3px] after:rounded-full after:bg-[#003cbb] data-active:text-gray-900 dark:text-gray-400 dark:after:bg-[#4d82ff] dark:data-active:text-white"
          >
            {o.label}
            {!!o.badge && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white tabular-nums">{o.badge}</span>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

// ── People ───────────────────────────────────────────────────────────────────

const AVATAR_TONES = [
  "bg-[#eef3fd] text-[#003cbb] dark:bg-[#003cbb]/25 dark:text-[#9bb8ff]",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
];

/** Photo or initials — never a broken image (2 rules). */
export function PersonAvatar({ first, last, src, size = 40, className }: { first: string; last?: string; src?: string | null; size?: number; className?: string }) {
  const seed = (first + (last ?? "")).split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  // Shared Avatar: initials show until (and unless) the photo loads — never a broken image.
  return (
    <Avatar className={cn("after:border-0", className)} style={{ width: size, height: size }} aria-hidden>
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback className={cn("font-bold", AVATAR_TONES[seed % AVATAR_TONES.length])} style={{ fontSize: Math.max(11, size * 0.36) }}>
        {toInitials(first, last)}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Form controls ────────────────────────────────────────────────────────────

export function Field({ label, hint, error, children, htmlFor, optional }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
        {label}
        {optional && <span className="ml-1 font-normal text-gray-400">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1 text-[12px] font-medium text-red-600 dark:text-red-400">
          <XCircle className="size-3.5" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 placeholder:text-gray-400 transition-colors outline-none focus:border-[#003cbb] focus:ring-3 focus:ring-[#003cbb]/15 disabled:bg-gray-50 disabled:text-gray-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-[#4d82ff] dark:disabled:bg-gray-900";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, "h-auto min-h-[96px] resize-y py-3 leading-relaxed", className)} {...props} />;
});

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%239ca3af%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[right_12px_center] bg-no-repeat pr-9", className)} {...props}>
      {children}
    </select>
  );
}

/** Linktree-style toggle switch. */
export function Toggle({ checked, onChange, label, description, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean; id?: string }) {
  return (
    <label htmlFor={id} className={cn("flex min-h-[44px] cursor-pointer items-center justify-between gap-4", disabled && "cursor-not-allowed opacity-60")}>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100">{label}</span>
        {description && <span className="mt-0.5 block text-[12px] text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-7 w-12 rounded-full bg-gray-200 transition-colors peer-checked:bg-emerald-600 peer-focus-visible:ring-3 peer-focus-visible:ring-[#003cbb]/30 dark:bg-gray-700" />
        <span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, className }: { checked: boolean; onChange: (v: boolean) => void; label: string; indeterminate?: boolean; disabled?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex size-11 shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = !!indeterminate;
        }}
        onChange={(e) => onChange(e.target.checked)}
        className="size-[18px] cursor-pointer rounded-[5px] accent-[#003cbb] disabled:cursor-not-allowed disabled:opacity-40"
      />
    </span>
  );
}

// ── Progress ─────────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, tone = "blue", className, label }: { value: number; max?: number; tone?: "blue" | "green" | "amber" | "red"; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(max, 1)) * 100));
  const c = { blue: "bg-[#003cbb] dark:bg-[#4d82ff]", green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" }[tone];
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label} className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", c)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Linktree "67% set up" ring. */
export function ProgressRing({ value, size = 64, stroke = 6, children, tone = "#003cbb" }: { value: number; size?: number; stroke?: number; children?: ReactNode; tone?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-gray-100 dark:stroke-gray-800" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" stroke={tone} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-center">{children}</span>
    </span>
  );
}

// ── States ───────────────────────────────────────────────────────────────────

/** Never a bare "No records to view": say why it's empty and what to do (principle 3). */
export function ExplainedEmpty({ icon = FolderOpen, title, reason, action, className, compact }: { icon?: LucideIcon; title: string; reason: ReactNode; action?: ReactNode; className?: string; compact?: boolean }) {
  return <EmptyState icon={icon} title={title} description={reason} action={action && <div className="flex flex-wrap justify-center gap-2">{action}</div>} className={cn(compact && "min-h-0 p-6 md:p-8", className)} />;
}

/** Every error shows what to do, a reference code and a Get help link (quality bar). */
export function ErrorState({ error, screen, onRetry, className }: { error: ApiError | Error; screen: string; onRetry?: () => void; className?: string }) {
  const code = "code" in error ? (error as ApiError).code : "UI-0000";
  const ref = `${code}`;
  return (
    <div role="alert" className={cn("flex flex-col items-start gap-3 rounded-[20px] border border-red-100 bg-red-50/60 p-5 dark:border-red-900/50 dark:bg-red-950/30", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <p className="text-[14px] font-semibold text-red-900 dark:text-red-200">{error.message}</p>
          <p className="mt-1 text-[12px] text-red-700/80 dark:text-red-300/70">
            Reference <span className="font-mono">{ref}</span> · {screen}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Btn size="sm" variant="secondary" onClick={onRetry}>
            Try again
          </Btn>
        )}
        <a
          href={`mailto:ict-support@babcock.edu.ng?subject=${encodeURIComponent(`BU Pulse Lecturer · ${screen} · ${ref}`)}`}
          className={btnClass("ghost", "sm")}
        >
          <LifeBuoy /> Get help
        </a>
      </div>
    </div>
  );
}

export function CardSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <Surface className={cn("flex flex-col gap-4", className)} aria-busy aria-label="Loading">
      <Skeleton className="h-5 w-40 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-md" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </div>
        </div>
      ))}
    </Surface>
  );
}

export function KeyValue({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-h-[44px] items-center justify-between gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800">
      <span className="text-[13px] text-gray-500 dark:text-gray-400">{label}</span>
      <span className={cn("text-right text-[14px] font-semibold text-gray-900 dark:text-gray-100", mono && "font-mono")}>{value}</span>
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "amber" | "red" | "green" }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
      <span className={cn("text-[22px] leading-none font-bold tracking-tight text-gray-900 tabular-nums dark:text-gray-50", tone === "amber" && "text-amber-600", tone === "red" && "text-red-600", tone === "green" && "text-emerald-600")}>
        {value}
      </span>
      {hint && <span className="text-[12px] text-gray-500 dark:text-gray-400">{hint}</span>}
    </div>
  );
}
