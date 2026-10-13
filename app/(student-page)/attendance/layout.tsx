import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/lib/features";

/** Preview feature: returns 404 when "attendance" is switched off (see lib/features.ts). */
export default function PreviewFeatureLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled("attendance")) notFound();
  return children;
}
