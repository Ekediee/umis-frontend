/**
 * A local copy of the student's notification settings, so the notification
 * provider can apply them synchronously to each incoming event. The source of
 * truth is `PATCH /student/notification-preferences`; the settings page writes
 * both.
 */

import { DEFAULT_NOTIFICATION_PREFS } from "./rules";
import type { NotificationPrefs } from "./types";

const KEY = "pulse-notification-prefs";

export function readCachedPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const p = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...p,
      categories: { ...DEFAULT_NOTIFICATION_PREFS.categories, ...(p.categories ?? {}) },
      quietHours: { ...DEFAULT_NOTIFICATION_PREFS.quietHours, ...(p.quietHours ?? {}) },
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function writeCachedPrefs(p: NotificationPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage blocked: the server copy still applies to push
  }
}
