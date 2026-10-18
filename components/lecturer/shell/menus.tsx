"use client";

/**
 * Header menus: semester switcher (one switcher replaces "Course Listing"'s
 * 188 semester rows) and the avatar menu (profile, department, campus, sign out).
 */

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Building2, Check, ChevronDown, LogOut, Moon, ShieldOff, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSemester } from "@/lib/lecturer/format";
import { useTheme } from "@/components/theme-provider";
import { signOutLecturer } from "@/app/actions/lecturer-auth";
import { clearBrowserSessionCache } from "@/lib/auth-cleanup";
import { PersonAvatar } from "../ui/primitives";
import { ACCOUNT_NAV } from "./nav";
import { useLecturer } from "./lecturer-provider";
import { toast } from "sonner";

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function Popover({ open, children, align = "left", className }: { open: boolean; children: ReactNode; align?: "left" | "right"; className?: string }) {
  if (!open) return null;
  return (
    <div
      role="menu"
      className={cn(
        "absolute top-full z-[120] mt-2 w-[300px] origin-top animate-in rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl duration-150 fade-in zoom-in-95 dark:border-gray-700 dark:bg-gray-900",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SemesterSwitcher({ compact }: { compact?: boolean }) {
  const { semesters, semester, setSemester } = useLecturer();
  const { open, setOpen, ref } = usePopover();
  const active = semesters.filter((s) => s.active);
  const past = semesters.filter((s) => !s.active && s.hasMyClasses);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white pr-3 pl-3.5 text-left font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800",
          compact ? "text-[12px]" : "text-[13px]",
        )}
      >
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <span className="truncate">{semester ? formatSemester(semester) : "Loading semester…"}</span>
        <ChevronDown className="size-4 shrink-0 text-gray-400" />
      </button>
      <Popover open={open}>
        <p className="px-3 pt-2 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">Active now</p>
        {active.map((s) => (
          <SemesterRow key={s.code} label={formatSemester(s)} hint={s.hasMyClasses ? "Your classes" : "No classes for you"} selected={s.code === semester?.code} onClick={() => (setSemester(s.code), setOpen(false))} />
        ))}
        {past.length > 0 && (
          <>
            <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">Earlier</p>
            {past.map((s) => (
              <SemesterRow key={s.code} label={formatSemester(s)} selected={s.code === semester?.code} onClick={() => (setSemester(s.code), setOpen(false))} />
            ))}
          </>
        )}
        <p className="px-3 pt-2 pb-2 text-[11px] leading-relaxed text-gray-400">P is postgraduate and M is medical. Several semesters can be active at once.</p>
      </Popover>
    </div>
  );
}

function SemesterRow({ label, hint, selected, onClick }: { label: string; hint?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onClick}
      className={cn("flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800", selected && "bg-[#eef3fd] dark:bg-[#003cbb]/20")}
    >
      <span>
        <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100">{label}</span>
        {hint && <span className="block text-[12px] text-gray-500">{hint}</span>}
      </span>
      {selected && <Check className="size-4 text-[#003cbb] dark:text-[#7aa2ff]" />}
    </button>
  );
}

export function AvatarMenu({ size = 40 }: { size?: number }) {
  const { lecturer, displayName } = useLecturer();
  const { theme, setTheme } = useTheme();
  const { open, setOpen, ref } = usePopover();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async (everywhere: boolean) => {
    setSigningOut(true);
    try {
      await clearBrowserSessionCache({ reason: "signed-out", isInitiator: true });
    } catch {
      // ignore
    }
    await signOutLecturer(everywhere);
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" onClick={() => setOpen((v) => !v)} className="rounded-full p-0.5 focus-visible:ring-3 focus-visible:ring-[#003cbb]/30 focus-visible:outline-none">
        <PersonAvatar first={lecturer?.firstName ?? "?"} last={lecturer?.lastName} src={lecturer?.photoUrl} size={size} />
      </button>
      <Popover open={open} align="right" className="w-[280px]">
        <div className="flex items-center gap-3 px-3 py-3">
          <PersonAvatar first={lecturer?.firstName ?? "?"} last={lecturer?.lastName} size={40} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-gray-900 dark:text-gray-100">{displayName}</p>
            <p className="truncate text-[12px] text-gray-500">{lecturer?.email ?? "No email on record"}</p>
          </div>
        </div>
        <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
        {ACCOUNT_NAV.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} role="menuitem" className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800">
            <item.icon className="size-[18px] text-gray-400" /> {item.title}
          </Link>
        ))}
        <button
          type="button"
          role="menuitem"
          onClick={() => toast.info("You only teach on Main Campus (Undergraduate).", { description: "Lecturers at two campuses switch here; tasks never mix campuses." })}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Building2 className="size-[18px] text-gray-400" />
          <span className="flex-1">Campus</span>
          <span className="max-w-[120px] truncate text-[12px] text-gray-400">{lecturer?.campus}</span>
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {theme === "dark" ? <Sun className="size-[18px] text-gray-400" /> : <Moon className="size-[18px] text-gray-400" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div className="my-1 h-px bg-gray-100 dark:bg-gray-800" />
        <button type="button" role="menuitem" disabled={signingOut} onClick={() => signOut(false)} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40">
          <LogOut className="size-[18px]" /> {signingOut ? "Signing out…" : "Sign out"}
        </button>
        <button type="button" role="menuitem" disabled={signingOut} onClick={() => signOut(true)} className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-800">
          <ShieldOff className="size-[18px] text-gray-400" /> Sign out everywhere
        </button>
      </Popover>
    </div>
  );
}
