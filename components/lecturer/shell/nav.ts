import { BookOpen, CalendarDays, ClipboardCheck, Clock3, GraduationCap, Home, Inbox, Landmark, UserRound, Users, type LucideIcon } from "lucide-react";
import type { LecturerRole } from "@/lib/lecturer/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Only shown when the lecturer holds this BU Pulse role. */
  role?: LecturerRole;
  exact?: boolean;
}

/** Today · Courses · Schedule · Students · Inbox (replaces the old 7-item sidebar). */
export const MAIN_NAV: NavItem[] = [
  { title: "Today", href: "/lecturer", icon: Home, exact: true },
  { title: "Courses", href: "/lecturer/courses", icon: BookOpen },
  { title: "Schedule", href: "/lecturer/schedule", icon: CalendarDays },
  { title: "Students", href: "/lecturer/students", icon: Users },
  { title: "Inbox", href: "/lecturer/inbox", icon: Inbox },
];

export const ROLE_NAV: NavItem[] = [
  { title: "Course advising", href: "/lecturer/advising", icon: ClipboardCheck, role: "course_advisor" },
  { title: "Supervision", href: "/lecturer/supervision", icon: GraduationCap, role: "supervisor" },
  { title: "Office hours", href: "/lecturer/office-hours", icon: Clock3 },
];

/** Profile and School Info move under the avatar menu. */
export const ACCOUNT_NAV: NavItem[] = [
  { title: "My profile", href: "/lecturer/profile", icon: UserRound },
  { title: "Department", href: "/lecturer/department", icon: Landmark },
];

export function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  // Advising and Supervision live inside the Students hub on phones.
  if (item.href === "/lecturer/students") return pathname.startsWith("/lecturer/advising") || pathname.startsWith("/lecturer/supervision");
  return false;
}

export function pageTitle(pathname: string) {
  const all = [...ROLE_NAV, ...ACCOUNT_NAV, ...MAIN_NAV];
  const hit = all.filter((i) => !i.exact && (pathname === i.href || pathname.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
  return hit?.title ?? "Today";
}
