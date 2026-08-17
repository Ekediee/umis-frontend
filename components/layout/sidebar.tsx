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
  LogOut
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUserData } from "@/contexts/user-data-context";
import { logoutAction } from "@/app/actions/auth";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import { getStudentProfileAction } from "@/app/actions/user";
import { toTitleCase } from "@/lib/utils";
import type { UMISResponse } from "@/lib/session";
import { useState, useEffect } from "react";

const mainNavItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Academic Details", href: "/academic-details", icon: BookOpen },
  { title: "Registration", href: "/registration", icon: ListTodo },
  { title: "Finance", href: "/dashboard/finance", icon: Wallet },
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
  const [profileData, setProfileData] = useState<UMISResponse | null>(
    initialUserData ?? contextUserData
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const DEFAULT_AVATAR = "/images/student-image.png";

  /** Routes backend images through the local proxy to avoid TLS/CORS issues. */
  const proxyImageUrl = (url: string): string => {
    if (!url || url.startsWith("/") || url.startsWith("data:")) return url;
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  };

  const extractPicUrl = (data: any): string | null => {
    if (!data) return null;
    return (
      data?.user_data?.personal_information?.profile_picture_url ||
      data?.user_data?.profile_picture_url ||
      data?.personal_information?.profile_picture_url ||
      data?.profile_picture_url ||
      null
    );
  };

  const initialPic = extractPicUrl(initialUserData ?? contextUserData);
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialPic ? proxyImageUrl(initialPic) : DEFAULT_AVATAR
  );

  const userData = profileData ?? contextUserData;
  const matricNumber =
    userData?.user_data?.personal_information?.matric_number ??
    userData?.user_data?.matric_number ??
    null;
  const avatarKey = matricNumber ? `profile_avatar:${matricNumber}` : null;

  // Sync avatar whenever profileData, contextUserData, or route changes
  useEffect(() => {
    // Clear legacy (non-namespaced) keys
    localStorage.removeItem("profile_avatar");
    localStorage.removeItem("student_avatar");

    // 1. Check live userData
    const livePic = extractPicUrl(profileData) || extractPicUrl(contextUserData);
    if (livePic) {
      setAvatarUrl(proxyImageUrl(livePic));
      if (avatarKey) localStorage.setItem(avatarKey, livePic);
      return;
    }

    // 2. Check per-user cache
    if (avatarKey) {
      const cached = localStorage.getItem(avatarKey);
      if (cached) {
        setAvatarUrl(proxyImageUrl(cached));
        return;
      }
    }

    // 3. Fallback
    setAvatarUrl(DEFAULT_AVATAR);
  }, [profileData, contextUserData, avatarKey]);

  useEffect(() => {
    getStudentProfileAction().then((res) => {
      if (res) {
        setProfileData(res);
        const pic = extractPicUrl(res);
        const matric = res.user_data?.personal_information?.matric_number;
        const key = matric ? `profile_avatar:${matric}` : null;
        if (pic) {
          setAvatarUrl(proxyImageUrl(pic));
          if (key) localStorage.setItem(key, pic);
        }
      }
    });

    const updateAvatar = (e: Event) => {
      const customEvt = e as CustomEvent<{ url?: string }>;
      if (customEvt.detail?.url) {
        setAvatarUrl(customEvt.detail.url);
      }
    };

    window.addEventListener("profile_avatar_updated", updateAvatar);
    window.addEventListener("storage", updateAvatar);
    return () => {
      window.removeEventListener("profile_avatar_updated", updateAvatar);
      window.removeEventListener("storage", updateAvatar);
    };
  }, [pathname]);
  const rawName =
    userData?.entity_name ??
    userData?.user_data?.personal_information?.student_name ??
    userData?.user_data?.student_name ??
    "Yakubu Onome Joy";
  const studentName = toTitleCase(rawName);

  const studentEmail =
    userData?.user_data?.contact_information?.email ??
    "yakubu.onome@univ.edu";

  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "YJ";

  const clearAcademicProgress = useAcademicDetailsStore((s) => s.clearAcademicProgress);
  const clearCourses = useAcademicDetailsStore((s) => s.clearCourses);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoggingOut(true);
    // Wipe all persisted student data so the next user gets a fresh fetch
    clearAcademicProgress();
    clearCourses();

    // Clear client-side avatar and student caches to prevent cross-user leakage
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("profile_avatar") ||
          key.startsWith("student_") ||
          key.includes("academic") ||
          key.includes("course")
        ) {
          localStorage.removeItem(key);
        }
      });
    }

    await logoutAction();
  };

  return (
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

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Log out of account"
            aria-label="Log out"
            className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-300 transition-colors ml-1 shrink-0 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
