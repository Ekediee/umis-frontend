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
  Activity,
  LogOut,
  MoreVertical,
  KeyRound,
  CalendarCheck,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserData } from "@/contexts/user-data-context";
import { performClientLogout } from "@/lib/auth-cleanup";
import { toTitleCase } from "@/lib/utils";
import type { UMISResponse } from "@/lib/session";
import { useState, useEffect, useRef } from "react";

import { useStudentAvatar, DEFAULT_AVATAR } from "@/hooks/use-student-avatar";
import { ChangePasswordModal } from "@/components/shared/change-password-modal";


const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Academic Details", href: "/academic-details", icon: BookOpen },
  { title: "Registration", href: "/registration", icon: ListTodo },
  { title: "Finance", href: "/dashboard/finance", icon: Wallet },
  { title: "Timetable", href: "/dashboard/timetable", icon: CalendarCheck },
  { title: "My Profile", href: "/profile", icon: User },
];

const otherNavItems = [
  { title: "Online Exam", href: "#", icon: MonitorPlay },
  { title: "Support", href: "https://support.babcock.edu.ng/", icon: Headset },
];

interface SidebarProps {
  initialUserData?: UMISResponse | null;
}

export function Sidebar({ initialUserData = null }: SidebarProps = {}) {
  const pathname = usePathname();
  const contextUserData = useUserData();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Single source of truth for avatar — no more copy-pasted logic
  const { avatarUrl, setAvatarUrl } = useStudentAvatar(initialUserData);

  const userData = contextUserData ?? initialUserData;
  const rawName =
    userData?.entity_name ??
    userData?.user_data?.personal_information?.student_name ??
    userData?.user_data?.student_name ??
    "Yakubu Onome Joy";
  const studentName = toTitleCase(rawName);

  const studentEmail =
    userData?.user_data?.contact_information?.email ??
    "yakubu.onome@univ.edu";

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
    <div className="w-64 border-r dark:border-gray-800 bg-white dark:bg-gray-900 h-screen hidden md:flex flex-col flex-shrink-0 transition-colors duration-200">
      {/* Brand */}
      <div className="px-6 py-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#eef3fd] dark:bg-[#003cbb]/20 flex items-center justify-center">
          <Activity className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff]" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-semibold text-[15px] leading-tight text-gray-900 dark:text-gray-100">Pulse</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400">Undergraduate</p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-6">
        <div>
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-3 px-3 uppercase">
            MAIN
          </p>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
              return (
                <Link 
                  key={item.title} 
                  href={item.href} 
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-[#f5f8fe]/80 dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff]" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-[#003cbb] dark:text-[#4d82ff]" : "text-gray-400 dark:text-gray-500")} />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider mb-3 px-3 uppercase">
            OTHER
          </p>
          <nav className="flex flex-col gap-1">
            {otherNavItems.map((item) => (
              <Link 
                key={item.title} 
                href={item.href} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer Area */}
      <div className="p-4 mt-auto">
        <div className="flex items-center justify-between border-t dark:border-gray-800 pt-4 px-1">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <Image
                  src={avatarUrl}
                  alt={studentName}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={() => {
                    if (avatarUrl !== DEFAULT_AVATAR) {
                      setAvatarUrl(DEFAULT_AVATAR);
                    }
                  }}
                />
              </div>
            </div>
            <div className="min-w-0 flex-1">
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
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ml-1 shrink-0 disabled:opacity-50"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown */}
            {isMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-bottom-right z-50">
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
        email={studentEmail}
      />
    </>
  );
}
