"use client";

/**
 * Web Push for the student app.
 *
 * Flow (agreed in the requirements plan): the browser subscribes with our
 * VAPID public key and the subscription is stored by the backend
 * (`POST /student/push-subscriptions`). When the backend has something to
 * send, it calls our route handler `POST /api/push/send`, which signs and
 * delivers with `web-push`. The service worker (app/sw.ts) shows it.
 */

import { studentApi } from "./api";

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type PushSupport = "supported" | "unsupported" | "ios-install" | "not-configured" | "no-service-worker";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
  // iPhones only get web push when Pulse is added to the Home Screen.
  if (ios && !standalone) return "ios-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "not-configured";
  return "supported";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw Object.assign(new Error("Push needs the installed app. The service worker isn't running in development mode."), { code: "PUSH-SW" });
  return reg;
}

export async function currentSubscription() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/** Asks for permission, subscribes and registers the device with the backend. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw Object.assign(new Error("Notifications are blocked for Pulse. Allow them in your browser's site settings."), { code: "PUSH-DENIED" });
  const reg = await registration();
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
  await studentApi.savePushSubscription(sub.toJSON());
  return sub;
}

export async function disablePush() {
  const sub = await currentSubscription();
  if (!sub) return;
  await studentApi.deletePushSubscription(sub.endpoint).catch(() => undefined);
  await sub.unsubscribe();
}
