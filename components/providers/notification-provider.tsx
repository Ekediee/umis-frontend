"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("student_notifications");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const mapped = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(mapped);
      } catch (e) {
        console.error("Failed to load notifications from localStorage", e);
      }
    }
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("student_notifications", JSON.stringify(notifications));
    }
  }, [notifications, mounted]);

  // 3. Connect to SSE
  useEffect(() => {
    if (!mounted) return;

    const eventSource = new EventSource('/api/notifications/stream');

    const handleNewMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;

        // Create a stable ID based on type and content to prevent duplication on reconnects
        // Safe for all Unicode characters (e.g. Naira currency symbol ₦)
        const stableId = (data.type + data.message)
          .split("")
          .reduce((acc: number, char: string) => {
            const hash = (acc << 5) - acc + char.charCodeAt(0);
            return hash & hash;
          }, 0)
          .toString(36);

        setNotifications((prev) => {
          // Check if notification already exists
          if (prev.some(n => n.id === stableId)) {
            return prev;
          }

          const newNotification: Notification = {
            id: stableId,
            type: data.type,
            message: data.message,
            read: false,
            timestamp: new Date(),
          };

          // Trigger toast with rate limiting
          triggerRateLimitedToast(data.type, data.message);

          return [newNotification, ...prev];
        });

      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    eventSource.onmessage = handleNewMessage;

    eventSource.onerror = (error) => {
      // EventSource automatically attempts to reconnect on transient network interrupts.
      // Only log if the connection is permanently closed.
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE connection closed:', error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [mounted]);

  // Rate Limiting Logic for Toasts
  const triggerRateLimitedToast = (type: string, message: string) => {
    try {
      const now = Date.now();
      const todayStr = new Date().toDateString();

      // Daily limit check (Max 3 toasts per day)
      const lastToastDate = localStorage.getItem("last_toast_date");
      let countToday = parseInt(localStorage.getItem("toast_count_today") || "0", 10);

      if (lastToastDate !== todayStr) {
        countToday = 0;
        localStorage.setItem("last_toast_date", todayStr);
      }

      if (countToday >= 3) {
        console.log(`[Toast Limit] Daily limit of 3 reached. Suppressing toast for: ${type}`);
        return;
      }

      // Check urgency (always show urgent notifications as toast)
      const textCombined = `${type} ${message}`.toUpperCase();
      const isUrgent = textCombined.includes("CLOSING") || 
                       textCombined.includes("REQUIRED") || 
                       textCombined.includes("DEADLINE") || 
                       textCombined.includes("URGENT") || 
                       textCombined.includes("FAIL");

      if (isUrgent) {
        console.log(`[Toast Limit] Urgent notification bypasses 5h cooldown: ${type}`);
        showToast(type, message);
        localStorage.setItem("toast_count_today", (countToday + 1).toString());
        return;
      }

      // 5-hour cooldown check
      const lastToastTimes = JSON.parse(localStorage.getItem("last_toast_times_by_type") || "{}");
      const lastTime = lastToastTimes[type] || 0;
      const cooldownMs = 5 * 60 * 60 * 1000; // 5 hours

      if (now - lastTime < cooldownMs) {
        console.log(`[Toast Limit] 5h cooldown active. Suppressing toast for type: ${type}`);
        return;
      }

      // Show toast and update timestamps
      showToast(type, message);
      lastToastTimes[type] = now;
      localStorage.setItem("last_toast_times_by_type", JSON.stringify(lastToastTimes));
      localStorage.setItem("toast_count_today", (countToday + 1).toString());

    } catch (e) {
      console.error("Error evaluating toast rate limits, showing fallback toast", e);
      showToast(type, message);
    }
  };

  const showToast = (type: string, message: string) => {
    const formattedTitle = type.replace(/_/g, ' ');
    if (type.includes('REQUIRED') || type.includes('FAILED') || type.includes('CLOSING') || type.includes('SOON')) {
      toast.error(formattedTitle, { description: message });
    } else {
      toast.info(formattedTitle, { description: message });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
