import { TimetableSession } from "../data/mock-data";
import { cn } from "@/lib/utils";
import React from "react";

interface CalendarViewProps {
  sessions: TimetableSession[];
  onSessionClick: (session: TimetableSession) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;
const START_HOUR = 7;
const END_HOUR = 18;

// Helper to convert time "HH:mm" to grid row
// Header is row 1. 07:00 is row 2. Each 30 mins is 1 row.
function timeToGridRow(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours - START_HOUR) * 2 + (minutes >= 30 ? 1 : 0) + 2;
}

function getGridRowSpan(startTime: string, endTime: string): number {
  const startRow = timeToGridRow(startTime);
  const endRow = timeToGridRow(endTime);
  return endRow - startRow;
}

export function CalendarView({ sessions, onSessionClick }: CalendarViewProps) {
  // Generate time slots for the left column (hourly)
  const timeSlots = [];
  for (let i = START_HOUR; i <= END_HOUR; i++) {
    timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
  }

  // Calculate total rows for the grid
  const totalRows = (END_HOUR - START_HOUR + 1) * 2 + 1; // +1 for header

  return (
    <div className="bg-white dark:bg-gray-900 rounded-b-2xl  border border-t-0 border-gray-100 dark:border-gray-800 overflow-x-auto p-4 min-h-[600px]">
      <div 
        className="min-w-[800px] grid gap-x-2 gap-y-1"
        style={{ 
          gridTemplateColumns: '60px repeat(5, 1fr)',
          gridTemplateRows: `40px repeat(${totalRows - 1}, 30px)`
        }}
      >
        {/* Top-left empty cell */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10" />

        {/* Days Header */}
        {DAYS.map((day, i) => (
          <div 
            key={day} 
            className="sticky top-0 z-10 bg-[#F5F6F8]/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">{day}</span>
          </div>
        ))}

        {/* Time Slots (Left Column) */}
        {timeSlots.map((time) => {
          const row = timeToGridRow(time);
          // Only show hourly labels to avoid clutter
          return (
            <div 
              key={time} 
              className="flex items-start justify-end pr-3 pt-1 border-t border-gray-100 dark:border-gray-800/50 -mt-[1px]"
              style={{ gridColumn: 1, gridRow: `${row} / span 2` }}
            >
              <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">{time}</span>
            </div>
          );
        })}

        {/* Background Grid Lines */}
        {Array.from({ length: totalRows - 1 }).map((_, i) => (
          <div 
            key={`grid-line-${i}`}
            className="border-t border-gray-100 dark:border-gray-800/50 -mt-[1px] pointer-events-none"
            style={{ gridColumn: '2 / -1', gridRow: i + 2 }}
          />
        ))}

        {/* Sessions */}
        {sessions.map((session) => {
          const startRow = timeToGridRow(session.startTime);
          const rowSpan = getGridRowSpan(session.startTime, session.endTime);
          const isBreak = session.type === 'break';
          const col = isBreak ? '2 / span 5' : DAYS.indexOf(session.day as any) + 2;

          // Different styling based on session type
          const bgClass = isBreak 
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
            : session.type === 'lab' 
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-300 dark:hover:border-emerald-700';

          const textClass = isBreak
            ? 'text-amber-800 dark:text-amber-300'
            : session.type === 'lab'
              ? 'text-[#003cbb] dark:text-blue-300'
              : 'text-[#176448] dark:text-emerald-300';

          return (
            <div
              key={session.id}
              onClick={() => !isBreak && onSessionClick(session)}
              className={cn(
                "rounded-xl border p-2 flex flex-col relative overflow-hidden transition-all duration-200",
                bgClass,
                !isBreak && "cursor-pointer hover:bg-opacity-80"
              )}
              style={{
                gridColumn: col,
                gridRow: `${startRow} / span ${rowSpan}`,
                zIndex: 5,
                margin: '2px 4px'
              }}
            >
              {isBreak ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className={cn("text-[11px] font-bold tracking-widest uppercase text-center", textClass)}>
                    {session.title}<br/>{session.startTime} - {session.endTime}
                  </span>
                </div>
              ) : (
                <>
                  <span className={cn("text-[13px] font-bold leading-tight", textClass)}>
                    {session.code}
                  </span>
                  <span className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                    {session.venue}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500 mt-auto flex items-center gap-1">
                    {session.startTime} - {session.endTime}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

