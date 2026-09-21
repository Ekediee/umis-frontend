"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  List as ListIcon, 
  Download,
  BookOpen,
  Clock,
  Users,
  MapPin,
  CalendarClock,
  Calendar,
  Bell,
  List,
  Star,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarView } from "./components/calendar-view";
import { ListView } from "./components/list-view";
import { SessionDetailModal } from "./components/session-detail-modal";
import { TimetableEmptyState } from "./components/timetable-empty-state";
import { TIMETABLE_SESSIONS, TimetableSession } from "./data/mock-data";

export default function TimetablePage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);

  // Set to false until API is connected
  const isApiConnected = false;

  const nonBreakSessions = TIMETABLE_SESSIONS.filter(s => s.type !== 'break');

  if (!isApiConnected) {
    return (
      <div className="flex-1 w-full h-full overflow-y-auto">
        <TimetableEmptyState />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto w-full max-w-7xl mx-auto space-y-6">
      
      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800  flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">10</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Courses</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800  flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">20h</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total hours weekly</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800  flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">9</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lecturers</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800  flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Venues</p>
          </div>
        </div>
      </div>

      {/* Main Timetable Card Area */}
      <div className="flex flex-col">
        
        {/* Controls Bar */}
        <div className="bg-[#F8FAFC] dark:bg-gray-900 rounded-t-2xl p-4 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-20">
          <div className="bg-[#CBF5E5] dark:bg-emerald-900/40 text-[#176448] dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
            12 Sessions Schedule
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 ">
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'calendar' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  view === 'list' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <ListIcon className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
            
            <Button variant="outline" className="h-10 px-4 rounded-xl gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        {view === 'calendar' ? (
          <CalendarView 
            sessions={TIMETABLE_SESSIONS} 
            onSessionClick={setSelectedSession} 
          />
        ) : (
          <ListView 
            sessions={nonBreakSessions} 
            onSessionClick={setSelectedSession} 
          />
        )}
      </div>

      <SessionDetailModal 
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
      />
    </div>
  );
}

