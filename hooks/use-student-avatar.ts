"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useUserData } from "@/contexts/user-data-context";
import { getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";

export const DEFAULT_AVATAR = "/images/student-image.png";

/**
 * Routes backend images through the local proxy to avoid TLS, CORS, and auth issues.
 * Handles relative paths, absolute URLs, and data URLs cleanly.
 */
export function proxyImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_AVATAR;

  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_AVATAR;

  // 1. Data URLs (e.g. FileReader preview base64) work directly in browser
  if (trimmed.startsWith("data:")) return trimmed;

  // 2. Local frontend public assets (e.g. /images/student-image.png, /favicon.ico)
  if (
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("/_next/") ||
    trimmed.startsWith("/favicon") ||
    trimmed === DEFAULT_AVATAR
  ) {
    return trimmed;
  }

  // 3. Already proxied URLs — don't double-proxy
  if (trimmed.startsWith("/api/image-proxy")) return trimmed;

  // 4. Relative backend paths (e.g. "/storage/...", "storage/...", "/uploads/...")
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_URL ||
      "https://umis-sb.babcock.edu.ng";
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    const fullUrl = `${apiBase.replace(/\/$/, "")}${cleanPath}`;
    return `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
  }

  // 5. Absolute backend URLs (https://umis-sb.babcock.edu.ng/...)
  return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
}

/**
 * Extracts the profile picture URL from any shape of the UMISResponse object.
 * Handles all known API envelope variants (nested, flat, alternative keys).
 */
export function extractPicUrl(
  data: UMISResponse | null | undefined
): string | null {
  if (!data) return null;
  const d = data as unknown as Record<string, unknown>;
  const ud = (d?.user_data ?? {}) as Record<string, unknown>;
  const pi = (ud?.personal_information ?? d?.personal_information ?? {}) as Record<string, unknown>;

  const candidate =
    pi.profile_picture_url ||
    pi.profile_picture ||
    pi.picture_url ||
    pi.picture ||
    pi.photo_url ||
    pi.photo ||
    pi.avatar_url ||
    pi.avatar ||
    ud.profile_picture_url ||
    ud.profile_picture ||
    ud.picture_url ||
    ud.picture ||
    ud.photo_url ||
    ud.photo ||
    ud.avatar_url ||
    ud.avatar ||
    d.profile_picture_url ||
    d.profile_picture ||
    d.picture_url ||
    d.picture ||
    d.photo_url ||
    d.photo ||
    d.avatar_url ||
    d.avatar;

  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  return null;
}

interface UseStudentAvatarReturn {
  /** The proxied avatar URL to use as the `src` for an <Image> or <img>. */
  avatarUrl: string;
  /** Setter — call with DEFAULT_AVATAR or new URL on update/error. */
  setAvatarUrl: (url: string) => void;
}

/**
 * Single source of truth for the student profile picture across all layout
 * components (Sidebar, Header, GPAWhatIfSimulator, etc.).
 *
 * Responsibilities:
 *  1. Derives the avatar during render from UserDataContext or SSR data.
 *  2. Supports async avatar overrides from live profile fetches and uploads.
 *  3. Syncs across tabs via `storage` and `profile_avatar_updated` events.
 *  4. Caches to per-user localStorage (`profile_avatar:<matric>`).
 */
export function useStudentAvatar(
  initialUserData?: UMISResponse | null
): UseStudentAvatarReturn {
  const pathname = usePathname();
  const contextUserData = useUserData();
  const [overrideAvatar, setOverrideAvatar] = useState<string | null>(null);

  // ── Derive the per-user identity ─────────────────────────────────────────────
  const liveData = contextUserData ?? initialUserData;
  type FlexStudentData = {
    personal_information?: { matric_number?: string | null };
    matric_number?: string | null;
  };
  const liveUserData = (liveData?.user_data ?? null) as FlexStudentData | null;
  const matricNumber =
    liveUserData?.personal_information?.matric_number ??
    liveUserData?.matric_number ??
    null;
  const avatarKey = matricNumber ? `profile_avatar:${matricNumber}` : null;

  // ── Derive base avatar synchronously (React 19 render-derived state) ─────────
  const baseAvatarUrl = useMemo(() => {
    const livePic =
      extractPicUrl(contextUserData) || extractPicUrl(initialUserData ?? null);
    if (livePic) return proxyImageUrl(livePic);

    if (avatarKey && typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(avatarKey);
        if (cached) return proxyImageUrl(cached);
      } catch {
        // Ignore storage errors
      }
    }

    return DEFAULT_AVATAR;
  }, [contextUserData, initialUserData, avatarKey]);

  // Current active avatar: override (from upload/fetch) takes precedence over derived base
  const avatarUrl = overrideAvatar ?? baseAvatarUrl;

  // ── Effect: fetch fresh profile + subscribe to update events ─────────────────
  useEffect(() => {
    // Clear legacy (un-namespaced) keys from older app versions
    try {
      localStorage.removeItem("profile_avatar");
      localStorage.removeItem("student_avatar");
    } catch {
      // Ignore storage errors
    }

    // Cache current live pic to per-user key
    const livePic =
      extractPicUrl(contextUserData) || extractPicUrl(initialUserData ?? null);
    if (livePic && avatarKey) {
      try {
        localStorage.setItem(avatarKey, livePic);
      } catch {
        // Ignore
      }
    }

    // Fetch live profile on mount and route changes to catch recent photo changes
    getStudentProfileAction().then((res) => {
      if (res) {
        const pic = extractPicUrl(res);
        const matric = res.user_data?.personal_information?.matric_number;
        const key = matric ? `profile_avatar:${matric}` : null;
        if (pic) {
          const proxied = proxyImageUrl(pic);
          setOverrideAvatar(proxied);
          if (key) {
            try {
              localStorage.setItem(key, pic);
            } catch {
              // Ignore
            }
          }
        }
      }
    });

    // Listen for updates dispatched after profile picture upload or cross-tab sync
    const updateAvatar = (e: Event) => {
      const customEvt = e as CustomEvent<{ url?: string }>;
      if (customEvt.detail?.url) {
        setOverrideAvatar(customEvt.detail.url);
      }
    };

    window.addEventListener("profile_avatar_updated", updateAvatar);
    window.addEventListener("storage", updateAvatar);
    return () => {
      window.removeEventListener("profile_avatar_updated", updateAvatar);
      window.removeEventListener("storage", updateAvatar);
    };
  }, [pathname]);

  return {
    avatarUrl,
    setAvatarUrl: (url: string) => setOverrideAvatar(url),
  };
}
