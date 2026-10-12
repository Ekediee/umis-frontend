/**
 * Preview ("Coming soon") feature flags.
 *
 * The phase-1 student features are still being built and tested. They live
 * under "Coming soon" in the sidebar and can be switched off for a release
 * without deleting any code.
 *
 *   NEXT_PUBLIC_PREVIEW_FEATURES=all                     every preview feature on
 *   NEXT_PUBLIC_PREVIEW_FEATURES=none                    every preview feature off (V1 release)
 *   NEXT_PUBLIC_PREVIEW_FEATURES=courses,attendance      only the listed ones on
 *
 * When the variable is not set: on in `next dev`, off in production builds,
 * so a deploy never ships preview features by accident.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so the same answer applies
 * on the server (route guards) and in the browser (navigation, cards).
 */

export const PREVIEW_FEATURES = {
  courses: "Course Spaces (/courses)",
  attendance: "Attendance and QR check-in (/attendance)",
  insights: "Personal study insights and the study timer (/insights)",
  today: "Today cards on the dashboard",
  notifications: "Notification settings, filters and quiet hours (/notifications/settings)",
} as const;

export type PreviewFeature = keyof typeof PREVIEW_FEATURES;

const ALL = Object.keys(PREVIEW_FEATURES) as PreviewFeature[];

function resolve(raw: string | undefined, isDev: boolean): Set<PreviewFeature> {
  const value = raw?.trim().toLowerCase();
  if (!value) return new Set(isDev ? ALL : []);
  if (value === "all" || value === "on" || value === "true") return new Set(ALL);
  if (value === "none" || value === "off" || value === "false") return new Set();
  const wanted = value.split(",").map((s) => s.trim());
  return new Set(ALL.filter((f) => wanted.includes(f.toLowerCase())));
}

const enabled = resolve(process.env.NEXT_PUBLIC_PREVIEW_FEATURES, process.env.NODE_ENV === "development");

export function isFeatureEnabled(feature: PreviewFeature) {
  return enabled.has(feature);
}

export function enabledPreviewFeatures(): PreviewFeature[] {
  return ALL.filter((f) => enabled.has(f));
}

/** Exported for tests. */
export const _resolveForTest = resolve;
