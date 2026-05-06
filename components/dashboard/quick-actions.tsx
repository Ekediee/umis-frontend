import { FileText, TrendingUp, Download, CreditCard } from "lucide-react";
import Link from "next/link";

const actions = [
  { id: 1, title: "Select Courses", icon: FileText, href: "#", iconBg: "bg-[#ebf1ff]", iconColor: "text-[#003cbb]" },
  { id: 2, title: "View Results", icon: TrendingUp, href: "/academic-details/semester-results", iconBg: "bg-[#effaf6]", iconColor: "text-[#12B76A]" },
  { id: 3, title: "Export Transcript", icon: Download, href: "#", iconBg: "bg-[#fdebff]", iconColor: "text-[#a855f7]" },
  { id: 4, title: "Make Payment", icon: CreditCard, href: "/dashboard/finance", iconBg: "bg-[#ebfaff]", iconColor: "text-[#0ea5e9]" },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full">
      <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-4 md:mb-6">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
        {actions.map((action) => (
          <Link 
            href={action.href} 
            key={action.id}
            className="bg-[#f9fafb] border border-transparent hover:border-gray-100 rounded-[16px] p-4 md:p-5 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-sm active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-full ${action.iconBg} flex items-center justify-center`}>
              <action.icon className={`w-5 h-5 ${action.iconColor}`} strokeWidth={2} />
            </div>
            <span className="text-[12px] md:text-[14px] font-semibold text-gray-800 text-center leading-tight">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
