"use client";

import { ChevronLeft, CheckCheck, BellOff, Info, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useNotifications } from "@/components/providers/notification-provider";
import { cn } from "@/lib/utils";

// Custom time formatter to prevent crashes if date-fns is not installed
const formatRelativeTime = (date: Date) => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const todayNotifications = notifications.filter(n => isToday(n.timestamp));
  const earlierNotifications = notifications.filter(n => !isToday(n.timestamp));

  const getIcon = (type: string) => {
    const typeUpper = type.toUpperCase();
    if (typeUpper.includes("REQUIRED") || typeUpper.includes("FAILED")) {
      return <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />;
    }
    if (typeUpper.includes("CLOSING") || typeUpper.includes("SOON")) {
      return <Info className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />;
    }
    return <CheckCircle className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff] shrink-0 mt-0.5" />;
  };

  return (
    <div className="p-4 mx-auto md:p-6 pb-24 md:pb-6 overflow-y-auto max-w-[800px]">
      
      {/* Header and Actions */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1 text-[14px] font-medium text-[#003cbb] dark:text-[#4d82ff] hover:text-[#002470] dark:hover:text-[#8ba7ff] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff] hover:text-[#002470] dark:hover:text-[#8ba7ff] transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[22px] font-bold text-gray-900 dark:text-gray-100">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-[#003cbb]/10 dark:bg-[#4d82ff]/10 text-[#003cbb] dark:text-[#4d82ff] text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} Unread
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[20px] text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BellOff className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 mb-1">All caught up!</h3>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-sm">
            You have no notifications at the moment. We'll let you know when something important happens.
          </p>
        </div>
      ) : (
        <>
          {/* Today Section */}
          {todayNotifications.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[11px] md:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Today</h3>
              <div className="flex flex-col gap-3 md:gap-4">
                {todayNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 md:p-5 flex items-start gap-4 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/40 cursor-pointer relative overflow-hidden rounded-[20px]",
                      notification.read 
                        ? "bg-white dark:bg-gray-900" 
                        : "bg-blue-50/30 dark:bg-[#4d82ff]/[0.03] border-l-4 border-l-[#003cbb] dark:border-l-[#4d82ff]"
                    )}
                  >
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-[14px] md:text-[15px] leading-tight mb-1",
                        notification.read ? "font-semibold text-gray-700 dark:text-gray-300" : "font-extrabold text-gray-950 dark:text-gray-50"
                      )}>
                        {notification.type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <span className="text-[11px] md:text-[12px] font-medium text-gray-400 dark:text-gray-400/80">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="w-[8px] h-[8px] rounded-full bg-[#003cbb] dark:bg-[#4d82ff] shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Earlier Section */}
          {earlierNotifications.length > 0 && (
            <div>
              <h3 className="text-[11px] md:text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Earlier</h3>
              <div className="flex flex-col gap-3 md:gap-4">
                {earlierNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      "border border-gray-100 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-4 md:p-5 flex items-start gap-4 transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/40 cursor-pointer relative overflow-hidden rounded-[20px]",
                      notification.read 
                        ? "bg-white dark:bg-gray-900" 
                        : "bg-blue-50/30 dark:bg-[#4d82ff]/[0.03] border-l-4 border-l-[#003cbb] dark:border-l-[#4d82ff]"
                    )}
                  >
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-[14px] md:text-[15px] leading-tight mb-1",
                        notification.read ? "font-semibold text-gray-700 dark:text-gray-300" : "font-extrabold text-gray-950 dark:text-gray-50"
                      )}>
                        {notification.type.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <span className="text-[11px] md:text-[12px] font-medium text-gray-400 dark:text-gray-400/80">
                        {formatRelativeTime(notification.timestamp)}
                      </span>
                    </div>
                    {!notification.read && (
                      <div className="w-[8px] h-[8px] rounded-full bg-[#003cbb] dark:bg-[#4d82ff] shrink-0 mt-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
