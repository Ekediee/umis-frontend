import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, BookOpen, History, Repeat2, FileDown } from "lucide-react";
import Link from "next/link";

const actions = [
  { 
    id: 1, 
    title: "View Semester Results", 
    icon: ClipboardCheck, 
    href: "/academic-details/semester-results", 
    bgColor: "bg-[#effaf6] dark:bg-[#2d9f75]/20", 
    iconColor: "text-[#2d9f75] dark:text-[#34d399]" 
  },
  { 
    id: 2, 
    title: "View Current Semester Courses", 
    icon: BookOpen, 
    href: "/academic-details/courses?tab=current", 
    bgColor: "bg-[#ebf1ff] dark:bg-[#003cbb]/20", 
    iconColor: "text-[#003cbb] dark:text-[#4d82ff]" 
  },
  { 
    id: 3, 
    title: "View Carry Over Courses", 
    icon: History, 
    href: "/academic-details/courses?tab=carry-over", 
    bgColor: "bg-[#eeebff] dark:bg-[#7c3aed]/20", 
    iconColor: "text-[#7c3aed] dark:text-[#a78bfa]" 
  },
  { 
    id: 4, 
    title: "View Repeated Courses", 
    icon: Repeat2, 
    href: "/academic-details/courses?tab=repeated", 
    bgColor: "bg-[#fef3eb] dark:bg-[#ea580c]/20", 
    iconColor: "text-[#ea580c] dark:text-[#fb923c]" 
  },
  { 
    id: 5, 
    title: "Export Unofficial Transcripts", 
    icon: FileDown, 
    href: "/academic-details/transcript", 
    bgColor: "bg-[#fdebff] dark:bg-[#db2777]/20", 
    iconColor: "text-[#db2777] dark:text-[#f472b6]" 
  },
];

export function QuickActionsList() {
  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#0a0a0a] dark:text-gray-100 mb-6">Quick Actions</h3>

        <div className="md:grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {actions.map((action) => (
            <Link 
              href={action.href} 
              key={action.id}
              className="bg-[#F8F9FB] dark:bg-gray-800 rounded-[20px] p-4 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-md border border-transparent hover:border-gray-100/50 dark:hover:border-gray-700 min-h-[104px] text-center"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full ${action.bgColor} transition-colors duration-200`}>
                 <action.icon className={`w-6 h-6 ${action.iconColor}`} strokeWidth={2.2} />
              </div>
              <span className="text-[14px] font-semibold text-[#0a0a0a] dark:text-gray-200 leading-tight block w-full px-1">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
