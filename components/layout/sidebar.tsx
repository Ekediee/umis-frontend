"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  ListTodo, 
  Wallet, 
  User, 
  MonitorPlay, 
  Headset,
  X,
  BadgeCheck,
  LogOut,
  MoreVertical,
  KeyRound,
  CalendarCheck,
  Library,
  ClipboardCheck,
  ChartNoAxesColumn,
  Map as MapIcon,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserData } from "@/contexts/user-data-context";
import { performClientLogout } from "@/lib/auth-cleanup";
import { toTitleCase } from "@/lib/utils";
import type { UMISResponse } from "@/lib/session";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { usePersistentToggle } from "@/hooks/use-persistent-toggle";
import { isFeatureEnabled, type PreviewFeature } from "@/lib/features";

import { useStudentAvatar } from "@/hooks/use-student-avatar";
import { ChangePasswordModal } from "@/components/shared/change-password-modal";
import { openInstallApp, useCanInstallApp } from "@/components/pwa/install-app";
import { useExamPortal } from "@/components/exam/exam-portal-provider";


const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Academic Details", href: "/academic-details", icon: BookOpen },
  { title: "Registration", href: "/registration", icon: ListTodo },
  { title: "Finance", href: "/dashboard/finance", icon: Wallet },
  { title: "Timetable", href: "/dashboard/timetable", icon: CalendarCheck },
  { title: "Campus Map", href: "/campus-map", icon: MapIcon },
  { title: "My Profile", href: "/profile", icon: User },
];

/**
 * Features still in development. Each one shows only while its preview flag is on
 * (lib/features.ts), so a V1 build ships without them and without code changes.
 */
const comingSoonNavItems = (
  [
    { title: "My Courses", href: "/courses", icon: Library, feature: "courses" },
    { title: "Attendance", href: "/attendance", icon: ClipboardCheck, feature: "attendance" },
    { title: "Personal Study Insights", href: "/insights", icon: ChartNoAxesColumn, feature: "insights" },
  ] satisfies { title: string; href: string; icon: typeof LayoutDashboard; feature: PreviewFeature }[]
).filter((item) => isFeatureEnabled(item.feature));

const otherNavItems = [
  { title: "Online Exam", href: "#", icon: MonitorPlay },
  { title: "Support", href: "https://support.babcock.edu.ng/", icon: Headset },
];

/** Tablet held upright: the sidebar starts collapsed there to leave room for the page */
const TABLET_PORTRAIT = "(min-width: 768px) and (max-width: 1023px) and (orientation: portrait)";

function subscribeTabletPortrait(onChange: () => void) {
  const mq = window.matchMedia(TABLET_PORTRAIT);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsTabletPortrait() {
  return useSyncExternalStore(
    subscribeTabletPortrait,
    () => window.matchMedia(TABLET_PORTRAIT).matches,
    () => false
  );
}

/** A nav section's title; a thin divider when the sidebar is collapsed */
function SectionTitle({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  if (collapsed) return <div role="separator" className="h-px bg-gray-100 dark:bg-gray-800 mx-2 mb-3" />;
  return (
    <p className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-3 px-3 uppercase">
      {children}
    </p>
  );
}

interface SidebarProps {
  initialUserData?: UMISResponse | null;
}

export function Sidebar({ initialUserData = null }: SidebarProps = {}) {
  const pathname = usePathname();
  const contextUserData = useUserData();
  const { openExamPortal, isLoading: isAccessingExamPortal } = useExamPortal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const canInstallApp = useCanInstallApp();

  // Collapsed to an icon rail. Elsewhere it only collapses when the student says so (and
  // that choice is remembered); on a tablet held upright it collapses by itself, and the
  // button can still open it for the visit.
  const isTabletPortrait = useIsTabletPortrait();
  const [desktopCollapsed, toggleDesktopCollapsed] = usePersistentToggle("pulse:sidebar-collapsed", false);
  const [tabletExpanded, setTabletExpanded] = useState(false);
  const collapsed = isTabletPortrait ? !tabletExpanded : desktopCollapsed;
  const toggleCollapsed = () => {
    setIsMenuOpen(false);
    if (isTabletPortrait) setTabletExpanded((v) => !v);
    else toggleDesktopCollapsed();
  };

  // Single source of truth for avatar — no more copy-pasted logic
  const { avatarUrl, setAvatarUrl, placeholder } = useStudentAvatar(initialUserData);

  const userData = contextUserData ?? initialUserData;
  const rawName =
    userData?.entity_name ??
    userData?.user_data?.personal_information?.student_name ??
    userData?.user_data?.student_name ??
    "Yakubu Onome Joy";
  const studentName = toTitleCase(rawName);

  // The address on the profile cards (Babcock email; personal email if there is none) is
  // what the change-password code is sent to. The placeholder is for display only.
  const accountEmail =
    userData?.user_data?.contact_information?.babcock_email ||
    userData?.user_data?.contact_information?.email ||
    "";
  const studentEmail = accountEmail || "yakubu.onome@univ.edu";

  const matricNo =
    userData?.entity_id?.toString() ??
    userData?.user_data?.matric_number ??
    userData?.user_data?.personal_information?.matric_number ??
    "";

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "YJ";

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen]);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoggingOut(true);
    await performClientLogout("manual", true);
  };


  return (
    <>
    <div
      data-collapsed={collapsed || undefined}
      className={cn(
        "group/sidebar border-r dark:border-gray-800 bg-white dark:bg-gray-900 h-screen hidden md:flex flex-col flex-shrink-0 transition-[width,background-color] duration-200",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      {/* Brand, with the collapse button to the right of the name (stacked under the logo when collapsed) */}
      <div className={cn("py-8 flex items-center", collapsed ? "flex-col gap-3 px-3" : "gap-3 pl-6 pr-4")}>
        <Image src="/images/bu-pulse-logomark.svg" alt="BU Pulse" width={28} height={40} priority className="w-7 h-10 shrink-0" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-[15px] leading-tight text-gray-900 dark:text-gray-100">Pulse</h1>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">Undergraduate</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-[10px] text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation. Collapsed: icons only (names as tooltips), section titles become dividers */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6", collapsed ? "px-3" : "px-4")}>
        <div>
          <SectionTitle collapsed={collapsed}>MAIN</SectionTitle>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
              return (
                <Link 
                  key={item.title}
                  title={collapsed ? item.title : undefined}
                  href={item.href} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl group-data-[collapsed]/sidebar:justify-center text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-[#f5f8fe]/80 dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff]" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400 dark:text-gray-500")} />
                  <span className="truncate group-data-[collapsed]/sidebar:sr-only">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {comingSoonNavItems.length > 0 && (
        <div>
          <SectionTitle collapsed={collapsed}>
            COMING SOON
            <span className="normal-case tracking-normal text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff]">Preview</span>
          </SectionTitle>
          <nav className="flex flex-col gap-1">
            {comingSoonNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.title}
                  title={collapsed ? item.title : undefined}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl group-data-[collapsed]/sidebar:justify-center text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#f5f8fe]/80 dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff]"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400 dark:text-gray-500")} />
                  <span className="truncate group-data-[collapsed]/sidebar:sr-only">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        )}

        <div>
          <SectionTitle collapsed={collapsed}>OTHER</SectionTitle>
          <nav className="flex flex-col gap-1">
            {otherNavItems.map((item) => {
              if (item.title === "Online Exam") {
                return (
                  <button
                    key={item.title}
                    title={collapsed ? item.title : undefined}
                    type="button"
                    onClick={openExamPortal}
                    disabled={isAccessingExamPortal}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl group-data-[collapsed]/sidebar:justify-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full text-left disabled:opacity-60"
                  >
                    <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="truncate group-data-[collapsed]/sidebar:sr-only">{item.title}</span>
                  </button>
                );
              }
              return (
                <Link 
                  key={item.title}
                  title={collapsed ? item.title : undefined}
                  href={item.href} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl group-data-[collapsed]/sidebar:justify-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="truncate group-data-[collapsed]/sidebar:sr-only">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Area */}
      <div className={cn("mt-auto", collapsed ? "p-3" : "p-4")}>
        <div className={cn("flex border-t dark:border-gray-800 pt-4", collapsed ? "flex-col items-center gap-1" : "items-center justify-between px-1")}>
          <Link
            href="/profile"
            title={collapsed ? studentName : undefined}
            className={cn("flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity", !collapsed && "flex-1")}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <Image
                  src={avatarUrl}
                  alt={studentName}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => {
                    if (avatarUrl !== placeholder) {
                      setAvatarUrl(placeholder);
                    }
                  }}
                />
              </div>
            </div>
            <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                {studentName}
                <BadgeCheck className="w-[14px] h-[14px] text-[#0048e0] dark:text-[#4d82ff] shrink-0" />
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 truncate">{studentEmail}</p>
            </div>
          </Link>

          <div className="relative" ref={menuRef}>
            {/* Three-dots trigger */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              disabled={isLoggingOut}
              title="More options"
              aria-label="More options"
              className={cn("p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0 disabled:opacity-50", !collapsed && "ml-1")}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown */}
            {isMenuOpen && (
              <div className={cn(
                "absolute w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 z-50",
                // Collapsed: opens to the right of the rail instead of above the (missing) name
                collapsed ? "left-full bottom-0 ml-2 origin-bottom-left" : "bottom-full right-0 mb-2 origin-bottom-right"
              )}>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl mx-0"
                >
                  <KeyRound className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  Change Password
                </button>

                {canInstallApp && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      openInstallApp();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl mx-0"
                  >
                    <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    Install Pulse app
                  </button>
                )}

                <div className="h-px bg-gray-100 dark:bg-gray-800 mx-3 my-1" />

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 w-full px-4 py-3 text-[14px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors rounded-xl mx-0 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? "Logging out…" : "Log Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Change Password Modal — rendered outside the sidebar scroll area */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        matricNo={matricNo}
        email={accountEmail}
      />
    </>
  );
}
