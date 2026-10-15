"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { categoryOf, deliveryFor, inQuietHours, isUrgent } from "@/lib/student/rules";
import { readCachedPrefs } from "@/lib/student/notification-prefs";
import { isFeatureEnabled } from "@/lib/features";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/student/rules";
import { NOTIFY_EVENT } from "@/lib/notifications/bus";
import { deadlineTriggers, liveClassTriggers, type Notice } from "@/lib/notifications/triggers";
import { studentApi } from "@/lib/student/api";

/** With the notifications preview off, behave exactly as before: every category on, no quiet hours. */
const PREFS_OFF = { ...DEFAULT_NOTIFICATION_PREFS, quietHours: { ...DEFAULT_NOTIFICATION_PREFS.quietHours, enabled: false } };

const STORAGE_KEY = "student_notifications";
/** The inbox keeps the newest notices; older ones fall off */
const MAX_STORED = 100;
/** Sign-in pages: no student session yet, so nothing to watch */
const isAuthPath = (p: string) => p === "/" || p.startsWith("/login") || p.startsWith("/forgot-password") || p.startsWith("/lecturer");

/** Preview-data triggers (deadlines, class check-in) are re-evaluated this often */
const PREVIEW_POLL_MS = 5 * 60 * 1000;

export interface Notification {
  /** Stable milestone key, so the same event is never listed twice */
  id: string;
  type: string;
  title?: string;
  message: string;
  href?: string;
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

/** Legacy items (no key) get a stable id from type + text; safe for any Unicode (e.g. ₦) */
function hashId(type: string, message: string) {
  return (type + message)
    .split("")
    .reduce((acc, char) => {
      const hash = (acc << 5) - acc + char.charCodeAt(0);
      return hash & hash;
    }, 0)
    .toString(36);
}

function readStored(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as (Omit<Notification, "timestamp"> & { timestamp: string })[]).map((n) => ({ ...n, timestamp: new Date(n.timestamp) }));
  } catch (e) {
    console.error("Failed to load notifications from localStorage", e);
    return [];
  }
}

function pushedTodayCount(): number {
  try {
    return localStorage.getItem("last_toast_date") === new Date().toDateString() ? parseInt(localStorage.getItem("toast_count_today") || "0", 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Shows an OS notification when the app is in the background, through the
 * service worker when there is one (works for the installed app) and the
 * page-level API otherwise. Needs permission granted in Notification settings.
 */
async function showSystemNotification(n: Notice) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
  const options: NotificationOptions = { body: n.message, tag: n.key, icon: "/icons/icon-192.png", badge: "/icons/badge-96.png", data: { url: n.href ?? "/notifications", type: n.type } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(n.title, options);
      return true;
    }
    const sys = new Notification(n.title, options);
    sys.onclick = () => {
      window.focus();
      window.location.assign(n.href ?? "/notifications");
    };
    return true;
  } catch {
    return false;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [mounted, setMounted] = useState(false);
  // Mirror of the ids in the inbox, readable synchronously when a notice arrives
  const known = useRef<Set<string>>(new Set());
  // Watchers start once the student reaches a signed-in page (and stop on sign-out)
  const pathname = usePathname() ?? "";
  const active = mounted && !isAuthPath(pathname);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    const stored = readStored();
    known.current = new Set(stored.map((n) => n.id));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setNotifications(stored);
    setMounted(true);
  }, []);

  // 2. Persist state changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
    } catch {}
  }, [notifications, mounted]);

  // 3. Other tabs: keep the inbox and badge in step
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = readStored();
      known.current = new Set(next.map((n) => n.id));
      setNotifications(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /**
   * Every notice, from the live stream or from an in-app action, goes through here:
   * dedupe on its key → the student's category switch → inbox → toast or system notification.
   */
  const ingest = useCallback((notice: Notice) => {
    // A switched-off category is dropped entirely
    const prefs = isFeatureEnabled("notifications") ? readCachedPrefs() : PREFS_OFF;
    const delivery = deliveryFor(prefs, notice, pushedTodayCount(), new Date());
    if (!delivery) return;

    // The inbox lists each event once; a check that finds it again only toasts
    const isNew = !known.current.has(notice.key);
    if (isNew) {
      known.current.add(notice.key);
      setNotifications((prev) => [
        { id: notice.key, type: notice.type, title: notice.title, message: notice.message, href: notice.href, read: false, timestamp: new Date() },
        ...prev,
      ].slice(0, MAX_STORED));
    }

    // The screen that caused it already confirmed it
    if (notice.silent) return;

    if (document.visibilityState === "hidden") {
      // App in the background: one system notification per event, only if the student turned push on
      if (isNew && delivery === "push") void showSystemNotification(notice).then((shown) => shown && countDelivery());
    } else if (isUrgent(notice.type, notice.message) || !inQuietHours(prefs, new Date())) {
      // App on screen: a toast every time a check finds it; quiet hours hold non-urgent ones in the inbox
      showToast(notice);
    }
  }, []);

  // 4. Live server triggers (registration milestones), see app/api/notifications/stream
  useEffect(() => {
    // Students only, and only once signed in (the lecturer portal has its own)
    if (!active) return;

    const eventSource = new EventSource("/api/notifications/stream");
    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "connected") return;
        ingest({
          key: data.key ?? hashId(data.type, data.message),
          type: data.type,
          title: data.title ?? String(data.type).replace(/_/g, " "),
          message: data.message,
          href: data.href,
        });
      } catch (err) {
        console.error("Failed to parse SSE message", err);
      }
    };
    eventSource.onerror = (error) => {
      // EventSource reconnects by itself on transient drops; only log a permanent close.
      if (eventSource.readyState === EventSource.CLOSED) console.error("SSE connection closed:", error);
    };
    return () => eventSource.close();
  }, [active, ingest]);

  // 5. In-app actions (registration submitted, wallet funded, password changed…), see lib/notifications/bus
  useEffect(() => {
    const onNotify = (e: Event) => ingest((e as CustomEvent<Notice>).detail);
    window.addEventListener(NOTIFY_EVENT, onNotify);
    return () => window.removeEventListener(NOTIFY_EVENT, onNotify);
  }, [ingest]);

  // 6. Preview features: deadline reminders and "class is on, check in", from their own data
  useEffect(() => {
    if (!active) return;
    const wantDeadlines = isFeatureEnabled("courses");
    const wantCheckIn = isFeatureEnabled("attendance");
    if (!wantDeadlines && !wantCheckIn) return;

    let cancelled = false;
    const check = async () => {
      const now = new Date();
      const [deadlines, live] = await Promise.all([
        wantDeadlines ? studentApi.getDeadlines().catch(() => []) : Promise.resolve([]),
        wantCheckIn ? studentApi.getLiveClass().catch(() => null) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      [...liveClassTriggers(live, now), ...deadlineTriggers(deadlines, now, (id) => id)].forEach(ingest);
    };
    void check();
    const t = window.setInterval(check, PREVIEW_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [active, ingest]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Installed app: mirror the unread count on the home-screen icon where supported
  useEffect(() => {
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (!mounted || !nav.setAppBadge) return;
    (unreadCount > 0 ? nav.setAppBadge(unreadCount) : nav.clearAppBadge?.())?.catch(() => {});
  }, [unreadCount, mounted]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── Delivery helpers ──

/** Counts system notifications toward the daily cap in the student's settings */
function countDelivery() {
  try {
    const todayStr = new Date().toDateString();
    const count = localStorage.getItem("last_toast_date") === todayStr ? pushedTodayCount() : 0;
    localStorage.setItem("last_toast_date", todayStr);
    localStorage.setItem("toast_count_today", String(count + 1));
  } catch {}
}

/** Toasts share the notice key as their id, so a repeat check refreshes the toast instead of stacking a copy. */
function showToast(n: Notice) {
  const action = n.href ? { label: "View", onClick: () => window.location.assign(n.href!) } : undefined;
  if (isUrgent(n.type, n.message) || categoryOf(n.type) === "fees") {
    toast.warning(n.title, { id: n.key, description: n.message, action });
  } else {
    toast.info(n.title, { id: n.key, description: n.message, action });
  }
}

export const useNotifications = () => useContext(NotificationContext);
