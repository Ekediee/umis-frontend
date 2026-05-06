"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const todayNotifications = [
  {
    id: 1,
    title: "Fee Payment Reminder",
    description: "The deadline for second semester tuition fees is March 15th. Please settle your arrears.",
    time: "2h ago",
    unread: true,
  },
  {
    id: 2,
    title: "Exam Timetable Released",
    description: "Final exam schedules for the Faculty of Science are now available for download.",
    time: "5h ago",
    unread: true,
  },
];

const earlierNotifications = [
  {
    id: 3,
    title: "Course Registration Open",
    description: "Registration for elective courses for the upcoming semester is now open until Friday.",
    time: "Yesterday",
    unread: false,
  },
  {
    id: 4,
    title: "Result Published",
    description: "Your results for CSC 401: Artificial Intelligence have been uploaded by the department.",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 5,
    title: "Library Due Date",
    description: 'Reminder: "Introduction to Algorithms" is due for return by tomorrow, 4:00 PM.',
    time: "Mar 08",
    unread: false,
  },
];

export default function NotificationsPage() {
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto max-w-[800px]">
      {/* Back Link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-1 text-[14px] font-medium text-[#003cbb] hover:text-[#002470] mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </Link>

      {/* Today Section */}
      <div className="mb-6 md:mb-8">
        <h3 className="text-[11px] md:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">Today</h3>
        <div className="flex flex-col gap-3 md:gap-4">
          {todayNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 md:p-5 flex items-start gap-3 transition-colors hover:bg-gray-50/50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] md:text-[16px] font-bold text-gray-900 leading-tight mb-1">{notification.title}</h4>
                <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed mb-2">{notification.description}</p>
                <span className="text-[11px] md:text-[12px] font-medium text-gray-400">{notification.time}</span>
              </div>
              {notification.unread && (
                <div className="w-[10px] h-[10px] rounded-full bg-[#003cbb] shrink-0 mt-1.5"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Earlier Section */}
      <div>
        <h3 className="text-[11px] md:text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">Earlier</h3>
        <div className="flex flex-col gap-3 md:gap-4">
          {earlierNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-4 md:p-5 flex items-start gap-3 transition-colors hover:bg-gray-50/50 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] md:text-[16px] font-bold text-gray-900 leading-tight mb-1">{notification.title}</h4>
                <p className="text-[13px] md:text-[14px] text-gray-500 leading-relaxed mb-2">{notification.description}</p>
                <span className="text-[11px] md:text-[12px] font-medium text-gray-400">{notification.time}</span>
              </div>
              {notification.unread && (
                <div className="w-[10px] h-[10px] rounded-full bg-[#003cbb] shrink-0 mt-1.5"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
