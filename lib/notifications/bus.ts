/**
 * In-app notification bus. Screens call `notify()` when something happens
 * (registration submitted, wallet funded, password changed…); the
 * NotificationProvider picks it up, applies the student's settings and adds
 * it to the inbox. Server-side triggers arrive through the SSE stream instead
 * and go through the same pipeline.
 */

import type { Notice } from "./triggers";

export const NOTIFY_EVENT = "pulse:notify";

export function notify(notice: Notice) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Notice>(NOTIFY_EVENT, { detail: notice }));
}

/** One key per occurrence for one-off actions (each payment, each password change). */
export function actionKey(kind: string, id?: string | number) {
  return `${kind}:${id ?? Date.now().toString(36)}`;
}

export type { Notice };
