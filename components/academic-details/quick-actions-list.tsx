import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, BookOpen, History, Repeat2, FileDown } from "lucide-react";
import Link from "next/link";

const actions = [
  { 
    id: 1, 
    title: "View Semester Results", 
    icon: ClipboardCheck, 
    href: "/academic-details/semester-results", 
    bgColor: "bg-[#effaf6]", 
    iconColor: "text-[#2d9f75]" 
  },
  { 
    id: 2, 
    title: "View Current Semester Courses", 
    icon: BookOpen, 
    href: "/academic-details/courses?tab=current", 
    bgColor: "bg-[#ebf1ff]", 
    iconColor: "text-[#003cbb]" 
  },
  { 
    id: 3, 
    title: "View Carry Over Courses", 
    icon: History, 
    href: "/academic-details/courses?tab=carry-over", 
    bgColor: "bg-[#eeebff]", 
    iconColor: "text-[#7c3aed]" 
  },
  { 
    id: 4, 
    title: "View Repeated Courses", 
    icon: Repeat2, 
    href: "/academic-details/courses?tab=repeated", 
    bgColor: "bg-[#fef3eb]", 
    iconColor: "text-[#ea580c]" 
  },
  { 
    id: 5, 
    title: "Export Unofficial Transcripts", 
    icon: FileDown, 
    href: "#", 
    bgColor: "bg-[#fdebff]", 
    iconColor: "text-[#db2777]" 
  },
];

export function QuickActionsList() {
  return (
    <Card className="rounded-[24px] border-gray-100 overflow-hidden bg-white">
      <CardContent className="p-5 md:p-6">
        <h3 className="text-[18px] font-bold text-[#0a0a0a] mb-6">Quick Actions</h3>

        <div className="md:grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {actions.map((action) => (
            <Link 
              href={action.href} 
              key={action.id}
              className="bg-[#F8F9FB] rounded-[24px] p-4 flex flex-col items-center justify-center gap-4 transition-all hover:shadow-md border border-transparent hover:border-gray-100/50 min-h-[104px] text-center"
            >
              <div className={`w-12 h-12 flex items-center justify-center rounded-full ${action.bgColor}`}>
                 <action.icon className={`w-6 h-6 ${action.iconColor}`} strokeWidth={2.2} />
              </div>
              <span className="text-[14px] font-semibold text-[#0a0a0a] leading-tight block w-full px-1">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
