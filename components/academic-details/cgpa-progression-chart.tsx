"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Award } from "lucide-react";
import { useUserData } from "@/contexts/user-data-context";
import { useAcademicDetailsStore } from "@/hooks/use-academic-details-store";
import { getAcademicProgressAction } from "@/app/actions/academic-details";

export function CGPAProgressionChart() {
  const userData = useUserData();

  const {
    academicProgress,
    isFetchingAcademicProgress,
    setAcademicProgress,
    setAcademicProgressError,
    setIsFetchingAcademicProgress,
  } = useAcademicDetailsStore();

  // Trigger fetch only if not already loaded or in-flight
  useEffect(() => {
    if (academicProgress || isFetchingAcademicProgress) return;
    setIsFetchingAcademicProgress(true);
    getAcademicProgressAction().then((result) => {
      if (result.data) {
        setAcademicProgress(result.data);
      } else {
        setAcademicProgressError(result.error ?? "Unknown error");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = isFetchingAcademicProgress && !academicProgress;

  // Chart layout
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const height = 240;
  const paddingY = 40;
  
  // Responsive horizontal padding based on card width
  const paddingX = width < 500 ? 24 : 36;
  const isMobile = width < 500;

  // Formats semester labels for mobile viewports to prevent clutter
  const formatSemesterLabel = (label: string) => {
    if (!isMobile) return label;
    
    const ordinalMap: { [key: string]: string } = {
      "1st": "1",
      "2nd": "2",
      "3rd": "3",
      "4th": "4",
    };
    
    const parts = label.trim().split(/\s+/);
    if (parts.length >= 2) {
      const levelStr = parts[0].replace("L", "");
      const levelNum = Number(levelStr);
      const yearNum = !isNaN(levelNum) && levelNum >= 100 ? Math.floor(levelNum / 100) : (levelStr || "1");
      
      const termWord = parts[1].toLowerCase();
      const term = ordinalMap[termWord] || termWord.replace(/\D/g, "") || "1";
      return `Y${yearNum}.${term}`;
    }
    return label;
  };

  // Respond to container size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Real data from store (only semesters with a non-null GPA)
  const chartData = academicProgress?.semesterProgression ?? [];

  // ── Dynamic Y-axis: micro-aware tight range around actual values ────────────
  const gpas = chartData.map((d) => d.semesterGpa);
  const dataMin = gpas.length > 0 ? Math.min(...gpas) : 0;
  const dataMax = gpas.length > 0 ? Math.max(...gpas) : 5;

  let minGpa: number;
  let maxGpa: number;

  if (gpas.length === 0) {
    minGpa = 0;
    maxGpa = 5.0;
  } else {
    const rawDiff = dataMax - dataMin;
    if (rawDiff === 0) {
      minGpa = Math.max(0, parseFloat((dataMin - 0.1).toFixed(2)));
      maxGpa = Math.min(5.0, parseFloat((dataMax + 0.1).toFixed(2)));
    } else {
      // Scale padding dynamically based on data spread (15% padding, min 0.015).
      // This ensures micro-changes (e.g. 4.29 → 4.30) zoom in tight and show clear growth.
      const padding = Math.max(0.015, rawDiff * 0.19);
      minGpa = Math.max(0, parseFloat((dataMin - padding).toFixed(3)));
      maxGpa = Math.min(5.0, parseFloat((dataMax + padding).toFixed(3)));
    }
  }

  const gpaRange = maxGpa - minGpa || 1; // avoid divide-by-zero

  // 4 evenly-spaced horizontal grid lines
  const gridValues = [0, 1, 2, 3].map((i) =>
    parseFloat((minGpa + (i / 3) * gpaRange).toFixed(2))
  );

  // ── Data point coordinates ─────────────────────────────────────────────────
  const points = chartData.map((d, i) => {
    const x =
      chartData.length < 2
        ? width / 2
        : paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
    const y =
      height -
      paddingY -
      ((d.semesterGpa - minGpa) / gpaRange) * (height - 2 * paddingY);
    return { ...d, x, y };
  });

  // ── SVG Path helpers ───────────────────────────────────────────────────────
  const createPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0 || width === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      d += ` C ${cp1x} ${p1.y}, ${cp2x} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createPath(points);
  const areaPath =
    points.length > 0 && width > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <CardContent className="p-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff]" />
              Academic Progression
            </h3>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
              Your GPA trend across semesters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#effaf6] dark:bg-[#12B76A]/20 border border-[#d1fadf] dark:border-[#12B76A]/30 rounded-[10px] px-3 py-1.5 flex items-center gap-2 transition-colors duration-200">
              <Award className="w-4 h-4 text-[#12B76A] dark:text-[#34d399]" />
              <span className="text-[13px] font-bold text-[#027A48] dark:text-[#34d399]">
                CGPA:{" "}
                {userData?.user_data?.academic_information?.cummulative_gpa?.toFixed(2) ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div
          ref={containerRef}
          className="relative w-full h-[240px]"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Loading skeleton */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col justify-end gap-2 px-10 pb-6">
              <div className="w-full h-[150px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              <div className="flex justify-between">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && chartData.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2">
              <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              <p className="text-[13px] text-gray-400 dark:text-gray-500">
                No semester GPA data available yet.
              </p>
            </div>
          )}

          {/* Chart */}
          {!isLoading && chartData.length > 0 && width > 0 && (
            <svg width={width} height={height} className="absolute inset-0 overflow-visible">

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="cgpa-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" stopOpacity="0.15" />
                  <stop offset="100%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="cgpa-line-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" />
                  <stop offset="100%" className="[stop-color:#0052ff] dark:[stop-color:#7aa4ff]" />
                </linearGradient>
              </defs>

              {/* Horizontal grid lines */}
              {gridValues.map((gpa, i) => {
                const y =
                  height -
                  paddingY -
                  ((gpa - minGpa) / gpaRange) * (height - 2 * paddingY);
                return (
                  <g key={`grid-${i}`}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      className="stroke-[#f1f5f9] dark:stroke-gray-800"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] font-medium fill-gray-400 dark:fill-gray-500"
                    >
                      {gpa.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              <path
                d={areaPath}
                fill="url(#cgpa-area-gradient)"
                className="transition-all duration-500 ease-out"
              />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#cgpa-line-gradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-out"
              />

              {/* Data points & hover targets */}
              {points.map((p, i) => (
                <g
                  key={`point-${i}`}
                  onMouseEnter={() => setHoveredIndex(i)}
                  className="cursor-pointer group"
                >
                  {/* Invisible larger hit area */}
                  <circle cx={p.x} cy={p.y} r={15} fill="transparent" />

                  {/* Outer glow ring (on hover) */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 7 : 0}
                    fillOpacity="0.2"
                    className="transition-all duration-200 fill-[#003cbb] dark:fill-[#4d82ff]"
                  />

                  {/* Inner dot */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIndex === i ? 5 : 4}
                    strokeWidth="2.5"
                    className={`transition-all duration-200 fill-white dark:fill-gray-900 ${
                      hoveredIndex === i
                        ? "stroke-[#003cbb] dark:stroke-[#4d82ff]"
                        : "stroke-[#e2e8f0] dark:stroke-gray-700"
                    }`}
                  />

                  {/* X-axis label */}
                  <text
                    x={p.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold transition-colors duration-200 ${
                      hoveredIndex === i
                        ? "fill-[#003cbb] dark:fill-[#4d82ff]"
                        : "fill-gray-500 dark:fill-gray-400"
                    }`}
                  >
                    {formatSemesterLabel(p.semester)}
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* HTML tooltip overlay */}
          {!isLoading &&
            width > 0 &&
            points.map((p, i) => (
              <div
                key={`tooltip-${i}`}
                className={`absolute flex flex-col items-center pointer-events-none transition-all duration-200 ease-out ${
                  hoveredIndex === i
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 translate-y-2"
                }`}
                style={{
                  left: p.x,
                  top: p.y - 45,
                  transform: "translateX(-50%)",
                  zIndex: 10,
                }}
              >
                <div className="bg-[#1e293b] dark:bg-gray-800 text-white dark:text-gray-100 text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-lg relative border dark:border-gray-700 transition-colors duration-200">
                  {p.semesterGpa.toFixed(2)} GPA
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] dark:bg-gray-800 border-b border-r dark:border-gray-700 rotate-45 transition-colors duration-200" />
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
