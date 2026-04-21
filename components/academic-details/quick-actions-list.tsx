import { Card, CardContent } from "@/components/ui/card";
import { FileText, ClipboardList, RefreshCw, Repeat, Download } from "lucide-react";
import Link from "next/link";

const actions = [
  { id: 1, title: "View Semester Results", icon: FileText, href: "/academic-details/semester-results", iconColor: "text-[#4DB16B]" },
  { id: 2, title: "View Current Semester Courses", icon: FileText, href: "/academic-details/courses?tab=current", iconColor: "text-[#3B5B98]" },
  { id: 3, title: "View Carry Over Courses", icon: FileText, href: "/academic-details/courses?tab=carry-over", iconColor: "text-[#3B5B98]" },
  { id: 4, title: "View Repeated Courses", icon: FileText, href: "/academic-details/courses?tab=repeated", iconColor: "text-[#3B5B98]" },
  { id: 5, title: "Export Unofficial Transcripts", icon: Download, href: "#", iconColor: "text-[#D94F8F]" },
];

export function QuickActionsList() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white">
      <CardContent className="p-6">
        <h3 className="text-[17px] font-bold text-gray-900 mb-6">Quick Actions</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {actions.map((action) => (
            <Link 
              href={action.href} 
              key={action.id}
              className="bg-[#F8F9FB] rounded-[20px] p-4 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md border border-transparent hover:border-gray-100/50 min-h-[140px] text-center"
            >
              <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white shadow-sm mb-1">
                 <action.icon className={`w-5 h-5 ${action.iconColor}`} strokeWidth={2.5} />
              </div>
              <span className="text-[13px] font-bold text-gray-800 leading-tight block w-full px-1">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
