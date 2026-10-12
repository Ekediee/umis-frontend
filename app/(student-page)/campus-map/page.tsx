"use client";

import { Suspense, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { supportsWebGL } from "@/lib/student/campus";

// The map needs the browser (canvas, window), so it never renders on the server.
const CampusMap = dynamic(() => import("@/components/campus/campus-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#eef0f3] dark:bg-gray-900 animate-pulse" />,
});

const noop = () => () => {};

function MapPage() {
  const search = useSearchParams();
  const webgl = useSyncExternalStore(noop, supportsWebGL, () => true);
  // WebGL vector map where the device supports it; the lite (Canvas/SVG) map everywhere else.
  // ?engine=lite forces the lite map, for testing.
  const engine = !webgl || search.get("engine") === "lite" ? "lite" : "gl";
  return <CampusMap initialQuery={search.get("q") ?? search.get("venue")} mapping={search.get("mapping") === "1"} engine={engine} />;
}

export default function Page() {
  return (
    <div className="h-full w-full">
      <Suspense>
        <MapPage />
      </Suspense>
    </div>
  );
}
