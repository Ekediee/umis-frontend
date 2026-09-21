import { X } from "lucide-react";
import { TimetableSession } from "../data/mock-data";

export interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TimetableSession | null;
}

export function SessionDetailModal({ isOpen, onClose, session }: SessionDetailModalProps) {
  if (!isOpen || !session) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[320px] animate-in zoom-in-95 fade-in duration-200 overflow-hidden border border-gray-100 dark:border-gray-800 p-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-500 dark:text-gray-400">
              Session detail
            </span>
            <h3 className="text-lg font-bold text-[#0A0D14] dark:text-gray-100 mt-1">
              {session.code}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Lecturer</span>
            <span className="text-sm font-medium text-[#0A0D14] dark:text-gray-100">{session.lecturer || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Venue</span>
            <span className="text-sm font-medium text-[#0A0D14] dark:text-gray-100">{session.venue || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Day</span>
            <span className="text-sm font-medium text-[#0A0D14] dark:text-gray-100">{session.day}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20 -mx-5 -mb-5 px-5 py-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
          <span className="text-sm font-medium text-[#0A0D14] dark:text-gray-100">
            {session.startTime} - {session.endTime}
          </span>
        </div>
      </div>
    </div>
  );
}

