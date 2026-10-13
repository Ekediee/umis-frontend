"use client";

/**
 * Small single-series charts for study insights. One brand hue per chart
 * (no legend needed; the card title names the series), recessive grid,
 * 4px rounded bar ends on the baseline, 2px line, hover tooltips.
 * Light marks use #2563eb and dark marks #4d82ff; both pass contrast on
 * their surfaces (validated with the dataviz palette script).
 */

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMinutes, localDateKey } from "@/lib/student/rules";

export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setDark(el.classList.contains("dark"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

function palette(dark: boolean) {
  return dark
    ? { mark: "#4d82ff", soft: "#2b3d66", grid: "#1f2937", axis: "#9ca3af", cursor: "rgba(255,255,255,0.05)" }
    : { mark: "#2563eb", soft: "#c7d7fb", grid: "#f1f3f6", axis: "#6b7280", cursor: "rgba(0,60,187,0.05)" };
}

function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100 tabular-nums">{value}</p>
    </div>
  );
}

const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Minutes logged per day this week; today is the solid bar, other days a lighter step of the same hue. */
export function StudyByDayChart({ byDay, height = 180 }: { byDay: { date: string; minutes: number }[]; height?: number }) {
  const dark = useIsDark();
  const p = palette(dark);
  const today = localDateKey(new Date());
  const data = byDay.map((d, i) => ({ ...d, day: DAY[i], isToday: d.date === today }));
  const max = Math.max(60, ...data.map((d) => d.minutes));

  return (
    <div style={{ height }} role="img" aria-label={`Minutes studied each day this week: ${data.map((d) => `${d.day} ${d.minutes}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={p.grid} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: p.axis, fontSize: 12 }} dy={4} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: p.axis, fontSize: 11 }} domain={[0, Math.ceil(max / 30) * 30]} allowDecimals={false} tickFormatter={(v) => (v ? formatMinutes(v) : "0")} width={48} />
          <Tooltip cursor={{ fill: p.cursor, radius: 8 }} content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={new Date(String(payload[0].payload.date)).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })} value={formatMinutes(Number(payload[0].value))} /> : null)} />
          <Bar dataKey="minutes" radius={[4, 4, 0, 0]} maxBarSize={36} minPointSize={2}>
            {data.map((d) => (
              <Cell key={d.date} fill={d.isToday ? p.mark : p.soft} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** CGPA-relevant trend: semester GPA per graded semester. */
export function GpaTrendChart({ points, height = 180 }: { points: { semester: string; gpa: number }[]; height?: number }) {
  const dark = useIsDark();
  const p = palette(dark);
  return (
    <div style={{ height }} role="img" aria-label={`Semester GPA: ${points.map((x) => `${x.semester} ${x.gpa.toFixed(2)}`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={p.grid} />
          <XAxis dataKey="semester" tickLine={false} axisLine={false} tick={{ fill: p.axis, fontSize: 11 }} dy={4} interval="preserveStartEnd" />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={{ fill: p.axis, fontSize: 11 }} width={28} />
          <Tooltip cursor={{ stroke: p.axis, strokeDasharray: "3 3" }} content={({ active, payload }) => (active && payload?.[0] ? <TooltipBox title={String(payload[0].payload.semester)} value={`GPA ${Number(payload[0].value).toFixed(2)}`} /> : null)} />
          <Line type="monotone" dataKey="gpa" stroke={p.mark} strokeWidth={2} dot={{ r: 4, fill: p.mark, stroke: dark ? "#111827" : "#ffffff", strokeWidth: 2 }} activeDot={{ r: 6, stroke: dark ? "#111827" : "#ffffff", strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Minutes per course as labelled HTML bars: names and values are text, the bar only shows proportion. */
export function CourseMinutesBars({ rows, columns = 1 }: { rows: { courseId: string; title?: string; minutes: number }[]; columns?: 1 | 2 }) {
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <ul className={columns === 2 ? "grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3.5" : "flex flex-col gap-3.5"}>
      {rows.map((r) => (
        <li key={r.courseId} className="group">
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className="min-w-0 text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate">
              {r.courseId}
              {r.title && <span className="font-normal text-gray-400 dark:text-gray-500"> · {r.title}</span>}
            </span>
            <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100 tabular-nums shrink-0">{r.minutes ? formatMinutes(r.minutes) : "—"}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-[#2563eb] dark:bg-[#4d82ff] transition-[width] duration-700" style={{ width: `${(r.minutes / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
