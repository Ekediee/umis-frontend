"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY, type Place } from "@/lib/student/campus";
import { cn } from "@/lib/utils";

/** Category-coloured map pin, shared by both map engines. */
export function Pin({ place, selected, dimmed, label = false, onClick }: { place: Place; selected: boolean; dimmed: boolean; label?: boolean; onClick: () => void }) {
  const c = CATEGORY[place.category];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={place.name}
      className={cn("group relative flex flex-col items-center transition-all duration-200 focus:outline-none", dimmed && "opacity-35", selected ? "z-20" : "z-10 hover:z-20")}
    >
      {selected && (
        <span className="absolute bottom-[calc(100%+6px)] whitespace-nowrap px-2.5 py-1 rounded-full bg-gray-900 text-white text-[12px] font-semibold shadow-lg animate-in fade-in zoom-in-95 duration-150">{place.name}</span>
      )}
      <span
        className={cn("flex items-center justify-center rounded-full border-2 border-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform duration-200 group-focus-visible:ring-4 group-focus-visible:ring-[#003cbb]/30", selected ? "w-11 h-11 scale-110" : "w-8 h-8 group-hover:scale-110")}
        style={{ background: c.color }}
      >
        <c.icon className={cn("text-white", selected ? "w-5 h-5" : "w-4 h-4")} strokeWidth={2.25} />
      </span>
      <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent -mt-[2px]" style={{ borderTopColor: c.color }} />
      {/* Name under the pin when zoomed in (the WebGL map draws these as a map layer instead) */}
      {label && !selected && (
        <span className="absolute top-[calc(100%+2px)] max-w-[120px] text-center text-[11px] font-semibold leading-tight text-gray-800 dark:text-gray-100 [text-shadow:0_0_3px_#fff,0_0_3px_#fff] dark:[text-shadow:0_0_3px_#111827,0_0_3px_#111827] pointer-events-none">
          {place.name}
        </span>
      )}
    </button>
  );
}

/**
 * "You are here": a pulsing blue dot. While the student walks, a soft cone
 * shows which way they're heading (`heading`, degrees from north; `mapBearing`
 * keeps it right on a rotated map).
 */
export function MeDot({ heading = null, mapBearing = 0 }: { heading?: number | null; mapBearing?: number }) {
  return (
    <span className="relative flex w-5 h-5" aria-label="You are here">
      {heading != null && (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
          style={{ transform: `translate(-50%, -50%) rotate(${heading - mapBearing}deg)` }}
        >
          <span className="absolute left-1/2 top-0 -translate-x-1/2 w-0 h-0 border-x-[12px] border-x-transparent border-b-[24px] border-b-[#2563eb]/35" />
        </span>
      )}
      <span className="absolute inline-flex h-full w-full rounded-full bg-[#2563eb] opacity-40 animate-ping" />
      <span className="relative inline-flex w-5 h-5 rounded-full bg-[#2563eb] border-[3px] border-white shadow-md" />
    </span>
  );
}

/**
 * Glides a [lng, lat] point to each new target (GPS readings arrive every second or
 * so; jumping looks broken). Re-renders only the component that uses it.
 */
export function useGlide(target: [number, number] | null, ms = 900): [number, number] | null {
  const [pos, setPos] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (!target) {
      from.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tracking stopped: hide the dot
      setPos(null);
      return;
    }
    const start = from.current ?? target;
    // A big jump (first fix, or back from far away) snaps instead of sliding across campus
    const far = Math.abs(start[0] - target[0]) + Math.abs(start[1] - target[1]) > 0.003;
    if (far) {
      from.current = target;
      setPos(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - k) * (1 - k);
      const p: [number, number] = [start[0] + (target[0] - start[0]) * e, start[1] + (target[1] - start[1]) * e];
      from.current = p;
      setPos(p);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return pos;
}
