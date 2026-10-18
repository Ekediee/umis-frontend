"use client";

/**
 * Lecturer app shell — mirrors the student layout (white sidebar, gray canvas,
 * desktop header, mobile top bar + bottom nav) with lecturer navigation.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { Activity, Bell, Search, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { lecturerApi } from "@/lib/lecturer/api";
import { API_MODE } from "@/lib/lecturer/api/http";
import { useLecturerQuery, useOnline } from "@/lib/lecturer/query";
import { useLecturer } from "./lecturer-provider";
import { AvatarMenu, SemesterSwitcher } from "./menus";
import { MAIN_NAV, ROLE_NAV, isActive, pageTitle, type NavItem } from "./nav";
import { SearchDialog, useSearchShortcut } from "./search-dialog";
import { PersonAvatar } from "../ui/primitives";

function useUnread() {
  const q = useLecturerQuery("notifications", () => lecturerApi.getNotifications());
  return q.data?.filter((n) => !n.read).length ?? 0;
}

function NavLink({ item, pathname, badge }: { item: NavItem; pathname: string; badge?: number }) {
  const active = isActive(pathname, item) && !(item.href === "/lecturer/students" && pathname !== "/lecturer/students");
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        active ? "bg-[#f5f8fe] text-[#003cbb] dark:bg-gray-800 dark:text-[#4d82ff]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100",
      )}
    >
      <item.icon className={cn("size-5", active ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400 dark:text-gray-500")} />
      <span className="flex-1">{item.title}</span>
      {!!badge && <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white tabular-nums">{badge}</span>}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { hasRole, lecturer, displayName } = useLecturer();
  const unread = useUnread();
  const roleItems = ROLE_NAV.filter((i) => !i.role || hasRole(i.role));

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r bg-white transition-colors md:flex dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/20">
          <Activity className="size-5 text-[#003cbb] dark:text-[#4d82ff]" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[15px] leading-tight font-semibold text-gray-900 dark:text-gray-100">Pulse</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">Lecturer</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
        <div>
          <p className="mb-3 px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">Main</p>
          <div className="flex flex-col gap-1">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} badge={item.href === "/lecturer/inbox" ? unread : undefined} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 px-3 text-[11px] font-bold tracking-wider text-gray-400 uppercase dark:text-gray-500">Your roles</p>
          <div className="flex flex-col gap-1">
            {roleItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>
      <div className="mt-auto p-4">
        <Link href="/lecturer/profile" className="flex items-center gap-3 border-t px-1 pt-4 hover:opacity-80 dark:border-gray-800">
          <PersonAvatar first={lecturer?.firstName ?? "?"} last={lecturer?.lastName} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{displayName || "Loading…"}</span>
            <span className="block truncate text-[12px] text-gray-500 dark:text-gray-400">{lecturer?.department}</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const unread = useUnread();
  // Full-screen tasks (attendance code, score entry, chapter review) hide the tab bar.
  if (/\/(attendance|scores|grades)(\/|$|\?)/.test(pathname) || /\/supervision\/[^/]+\/[^/]+/.test(pathname)) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 flex h-[76px] items-center justify-around border-t bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-gray-800 dark:bg-gray-900/95">
      {MAIN_NAV.map((item) => {
        const active = isActive(pathname, item);
        const badge = item.href === "/lecturer/inbox" ? unread : 0;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex h-14 w-16 flex-col items-center justify-center gap-1", active ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400 dark:text-gray-500")}>
            <span className={cn("relative flex h-8 w-12 items-center justify-center rounded-full transition-colors", active && "bg-[#003cbb] text-white dark:bg-[#4d82ff] dark:text-gray-900")}>
              <item.icon className="size-[18px]" strokeWidth={active ? 2.5 : 2} />
              {!!badge && <span className="absolute -top-0.5 right-1 size-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" aria-label={`${badge} unread`} />}
            </span>
            <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-gray-800 px-4 py-2 text-[13px] font-medium text-white">
      <WifiOff className="size-4" /> You&apos;re offline. You can still take attendance and draft comments; they send when you reconnect.
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const unread = useUnread();
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useSearchShortcut(openSearch);
  const title = pageTitle(pathname);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#1E1E1E]">
      <a href="#lecturer-main" className="sr-only z-[500] rounded-lg bg-white px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F4F5F7] transition-colors dark:bg-black">
        {/* Desktop header */}
        <header className="relative z-20 hidden h-[76px] shrink-0 items-center justify-between gap-4 border-b bg-white px-8 md:flex dark:border-gray-800 dark:bg-gray-900">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
            <div className="shrink-0">
              <SemesterSwitcher />
            </div>
            {/* Grows with the header (up to 420px) and keeps its text on one line. */}
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search courses, students, projects"
              aria-keyshortcuts="Control+K"
              className="flex h-10 w-full max-w-[420px] min-w-0 flex-1 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 text-[13px] whitespace-nowrap text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-800"
            >
              <Search className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">
                Search<span className="hidden lg:inline"> courses, students, projects</span>
              </span>
              <kbd className="hidden shrink-0 rounded-md border border-gray-200 bg-white px-1.5 text-[11px] font-semibold lg:inline-block dark:border-gray-700 dark:bg-gray-900">Ctrl K</kbd>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-gray-500">
            <ThemeToggle />
            <Link href="/lecturer/inbox" aria-label={`Inbox, ${unread} unread`} className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-bold text-white dark:border-gray-900">{unread > 9 ? "9+" : unread}</span>}
            </Link>
            <div className="ml-2">
              <AvatarMenu />
            </div>
          </div>
        </header>

        {/* Mobile header */}
        <header className="relative z-40 flex h-[64px] shrink-0 items-center justify-between gap-2 border-b bg-white px-3 md:hidden dark:border-gray-800 dark:bg-gray-900">
          <AvatarMenu size={36} />
          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-center text-[16px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">{title}</p>
          </div>
          <div className="flex items-center">
            <button type="button" onClick={openSearch} aria-label="Search" className="inline-flex size-11 items-center justify-center rounded-full text-gray-600 active:bg-gray-100 dark:text-gray-300">
              <Search className="size-5" />
            </button>
            <Link href="/lecturer/inbox" aria-label={`Inbox, ${unread} unread`} className="relative inline-flex size-11 items-center justify-center rounded-full text-gray-600 active:bg-gray-100 dark:text-gray-300">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-2 right-2 size-2.5 rounded-full border-2 border-white bg-red-500 dark:border-gray-900" />}
            </Link>
          </div>
        </header>

        <OfflineBanner />
        {API_MODE === "mock" && (
          <div className="hidden bg-amber-50 px-8 py-1.5 text-[12px] font-medium text-amber-800 md:block dark:bg-amber-950/40 dark:text-amber-300">
            Demo data · the clock is set to Wed 7 Oct 2026, 09:12 (Semester 1, week 6). Connect the BU Pulse API with NEXT_PUBLIC_LECTURER_API_MODE=live.
          </div>
        )}

        <main id="lecturer-main" className="relative min-h-0 flex-1 overflow-y-auto pb-28 md:pb-10">
          {children}
        </main>
        <MobileNav />
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
