import { Calendar, Bell, List, Star, Info } from "lucide-react";
import Image from "next/image";

export function TimetableEmptyState() {
  return (
    <div className="w-full flex justify-center py-10 px-4">
      <div className="w-full max-w-[900px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center">
        
        {/* Main Icon / Image Area */}
        <div className="mb-8 flex justify-center">
          <Image 
            src="/images/timetable-coming-soon.png" 
            alt="Timetable Coming Soon" 
            width={282} 
            height={282} 
            className="w-48 h-48 md:w-56 md:h-56 object-contain"
          />
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#000E2D] dark:text-gray-100 tracking-tight mb-4">
          Timetable Coming Soon
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mb-12 text-sm md:text-base leading-relaxed">
          We're working hard to bring you an improved timetable experience.<br className="hidden md:block"/> 
          Your class schedule will be here soon.
        </p>

        {/* Features Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mb-12">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-[#EEF3FD] dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#003cbb] dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-bold text-[#000E2D] dark:text-gray-100 text-[15px] mb-1">Easy Access</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">View your class schedule anytime, anywhere.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-[#000E2D] dark:text-gray-100 text-[15px] mb-1">Real-time Updates</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Get notified of any<br/>changes instantly.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
              <List className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-bold text-[#000E2D] dark:text-gray-100 text-[15px] mb-1">Organized View</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">See all your courses<br/>and venues in one place.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h4 className="font-bold text-[#000E2D] dark:text-gray-100 text-[15px] mb-1">Better Experience</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">A faster, smarter<br/>timetable is on the way.</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mb-8" />

        {/* Footer Alert */}
        <div className="bg-[#EEF3FD] dark:bg-blue-900/20 text-[#003cbb] dark:text-blue-300 px-6 py-3.5 rounded-2xl flex items-center justify-center gap-3">
          <Info className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">Stay tuned! We'll notify you as soon as the timetable is available.</span>
        </div>

      </div>
    </div>
  );
}

