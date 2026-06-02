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
  Activity
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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

export function Sidebar() {
  const pathname = usePathname();

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
        <div className="bg-[#F8F9FB] dark:bg-gray-800/50 rounded-2xl p-4 mb-4 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Headset className="w-5 h-5 text-gray-800 dark:text-gray-200" />
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Need support?</span>
          </div>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
            Contact with one of our experts to get support.
          </p>
        </div>
        
        <Link href="/profile" className="flex items-center gap-3 px-2 py-2 border-t dark:border-gray-800 pt-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl -mx-2">
          <div className="relative">
            <Avatar className="w-10 h-10 border border-gray-100 dark:border-gray-700">
              <AvatarFallback className="bg-[#f5f8fe] dark:bg-gray-800 text-[#003cbb] dark:text-[#4d82ff] font-medium">YJ</AvatarFallback>
              <AvatarImage src="/student-image.png" alt="Yakubu Onome Joy" />
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
              Yakubu Onome Joy
              <BadgeCheck className="w-[14px] h-[14px] text-[#0048e0] dark:text-[#4d82ff] shrink-0" />
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 truncate">yakubu.onome@univ.edu</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
