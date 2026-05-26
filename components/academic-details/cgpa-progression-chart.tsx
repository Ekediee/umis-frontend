"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Award } from "lucide-react";

// Mock Data
const data = [
  { semester: "100L 1st", gpa: 3.45 },
  { semester: "100L 2nd", gpa: 3.61 },
  { semester: "100L 3rd", gpa: 3.73 },
  { semester: "200L 1st", gpa: 3.62 },
  { semester: "200L 2nd", gpa: 3.71 },
];

export function CGPAProgressionChart() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  
  const height = 240;
  const paddingY = 40;
  const paddingX = 40;

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };
    handleResize(); // Initial measurement
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate coordinates
  const minGpa = 2.0; // Y-axis floor for dramatic effect
  const maxGpa = 5.0; // Y-axis ceiling
  
  const points = data.map((d, i) => {
    const x = width === 0 ? 0 : paddingX + (i * (width - 2 * paddingX)) / (data.length - 1);
    const y = height - paddingY - ((d.gpa - minGpa) / (maxGpa - minGpa)) * (height - 2 * paddingY);
    return { ...d, x, y };
  });

  // Generate SVG Path (Curved)
  const createPath = (points: {x: number, y: number}[]) => {
    if (points.length === 0 || width === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 2;
      const cp1y = p1.y;
      const cp2x = p1.x + (p2.x - p1.x) / 2;
      const cp2y = p2.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createPath(points);
  
  // Area Path for Gradient Fill
  const areaPath = width === 0 ? "" : `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

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
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Your Cumulative GPA trend across semesters</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="bg-[#effaf6] dark:bg-[#12B76A]/20 border border-[#d1fadf] dark:border-[#12B76A]/30 rounded-[10px] px-3 py-1.5 flex items-center gap-2 transition-colors duration-200">
                <Award className="w-4 h-4 text-[#12B76A] dark:text-[#34d399]" />
                <span className="text-[13px] font-bold text-[#027A48] dark:text-[#34d399]">Current: 3.71</span>
             </div>
          </div>
        </div>

        {/* Chart Container */}
        <div 
          ref={containerRef} 
          className="relative w-full h-[240px]"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {width > 0 && (
            <svg width={width} height={height} className="absolute inset-0 overflow-visible">
              
              {/* Defs for Gradients */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" stopOpacity="0.15" />
                  <stop offset="100%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" className="[stop-color:#003cbb] dark:[stop-color:#4d82ff]" />
                  <stop offset="100%" className="[stop-color:#0052ff] dark:[stop-color:#7aa4ff]" />
                </linearGradient>
              </defs>

              {/* Grid Lines (Horizontal) */}
              {[2.0, 3.0, 4.0, 5.0].map((gpa, i) => {
                const y = height - paddingY - ((gpa - minGpa) / (maxGpa - minGpa)) * (height - 2 * paddingY);
                return (
                  <g key={`grid-${i}`}>
                    <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} strokeWidth="1" strokeDasharray="4 4" className="stroke-[#f1f5f9] dark:stroke-gray-800" />
                    <text x={paddingX - 10} y={y + 4} textAnchor="end" className="text-[10px] font-medium fill-gray-400 dark:fill-gray-500">{gpa.toFixed(1)}</text>
                  </g>
                );
              })}

              {/* Area Fill */}
              <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-500 ease-out" />
              
              {/* Line */}
              <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500 ease-out" />

              {/* Data Points & Hover Targets */}
              {points.map((p, i) => (
                <g key={`point-${i}`} 
                   onMouseEnter={() => setHoveredIndex(i)}
                   className="cursor-pointer group"
                >
                  {/* Invisible larger circle for easier hover */}
                  <circle cx={p.x} cy={p.y} r={15} fill="transparent" />
                  
                  {/* Outer glow ring (visible on hover) */}
                  <circle 
                    cx={p.x} cy={p.y} 
                    r={hoveredIndex === i ? 7 : 0} 
                    fillOpacity="0.2"
                    className="transition-all duration-200 fill-[#003cbb] dark:fill-[#4d82ff]"
                  />
                  
                  {/* Inner Point */}
                  <circle 
                    cx={p.x} cy={p.y} 
                    r={hoveredIndex === i ? 5 : 4} 
                    strokeWidth="2.5" 
                    className={`transition-all duration-200 fill-white dark:fill-gray-900 ${hoveredIndex === i ? 'stroke-[#003cbb] dark:stroke-[#4d82ff]' : 'stroke-[#e2e8f0] dark:stroke-gray-700'}`}
                  />

                  {/* X-Axis Labels */}
                  <text 
                    x={p.x} 
                    y={height - 10} 
                    textAnchor="middle" 
                    className={`text-[11px] font-semibold transition-colors duration-200 ${hoveredIndex === i ? 'fill-[#003cbb] dark:fill-[#4d82ff]' : 'fill-gray-500 dark:fill-gray-400'}`}
                  >
                    {p.semester}
                  </text>
                </g>
              ))}
            </svg>
          )}

          {/* HTML Tooltip overlay to ensure it breaks out of SVG constraints nicely */}
          {width > 0 && points.map((p, i) => (
            <div 
              key={`tooltip-${i}`}
              className={`absolute flex flex-col items-center pointer-events-none transition-all duration-200 ease-out ${hoveredIndex === i ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
              style={{
                left: p.x,
                top: p.y - 45,
                transform: 'translateX(-50%)',
                zIndex: 10
              }}
            >
              <div className="bg-[#1e293b] dark:bg-gray-800 text-white dark:text-gray-100 text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-lg relative border dark:border-gray-700 transition-colors duration-200">
                {p.gpa.toFixed(2)} CGPA
                {/* Arrow down */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] dark:bg-gray-800 border-b border-r dark:border-gray-700 rotate-45 transition-colors duration-200"></div>
              </div>
            </div>
          ))}

        </div>
      </CardContent>
    </Card>
  );
}
