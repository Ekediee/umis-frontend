/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Extra caching for the phase-1 student features, checked before the defaults:
 * - Course materials (PDF, slides) open offline once viewed.
 * - Campus map tiles and the places file load fast on the second visit.
 */
const studentCaching: RuntimeCaching[] = [
  {
    matcher: ({ url }) => /\.(pdf|pptx?|docx?)$/i.test(url.pathname),
    handler: new CacheFirst({
      cacheName: "course-materials",
      plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 120 })],
    }),
  },
  {
    matcher: ({ url }) => url.hostname === "tiles.openfreemap.org",
    handler: new CacheFirst({
      cacheName: "campus-map-tiles",
      plugins: [new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 })],
    }),
  },
  {
    matcher: ({ url }) => url.pathname.startsWith("/campus/") && url.pathname.endsWith(".geojson"),
    handler: new StaleWhileRevalidate({ cacheName: "campus-places" }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...studentCaching, ...defaultCache],
});

serwist.addEventListeners();

// ── Web push (sent by POST /api/push/send) ───────────────────────────────────

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  type?: string;
  tag?: string;
  urgent?: boolean;
}

self.addEventListener("push", (event) => {
  let data: PushPayload = { title: "Pulse", body: "You have a new update." };
  try {
    if (event.data) data = { ...data, ...(event.data.json() as PushPayload) };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag ?? data.type,
      requireInteraction: !!data.urgent,
      data: { url: data.url ?? "/notifications", type: data.type },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data as { url?: string })?.url ?? "/notifications", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        return existing.navigate(target);
      }
      return self.clients.openWindow(target);
    })(),
  );
});
