import { FileText, TrendingUp, Download, CreditCard } from "lucide-react";
import Link from "next/link";

const actions = [
  { id: 1, title: "Select Courses", icon: FileText, href: "#", iconBg: "bg-[#ebf1ff] dark:bg-[#003cbb]/20", iconColor: "text-[#003cbb] dark:text-[#4d82ff]" },
  { id: 2, title: "View Results", icon: TrendingUp, href: "/academic-details/semester-results", iconBg: "bg-[#effaf6] dark:bg-[#12B76A]/20", iconColor: "text-[#12B76A] dark:text-[#34d399]" },
  { id: 3, title: "Export Transcript", icon: Download, href: "/academic-details/transcript", iconBg: "bg-[#fdebff] dark:bg-[#a855f7]/20", iconColor: "text-[#a855f7] dark:text-[#c084fc]" },
  { id: 4, title: "Make Payment", icon: CreditCard, href: "/dashboard/finance", iconBg: "bg-[#ebfaff] dark:bg-[#0ea5e9]/20", iconColor: "text-[#0ea5e9] dark:text-[#38bdf8]" },
];

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full transition-colors duration-200">
      <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 dark:text-gray-100 mb-4 md:mb-6">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
        {actions.map((action) => (
          <Link 
            href={action.href} 
            key={action.id}
            className="bg-[#f9fafb] dark:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 rounded-[20px] p-4 md:p-5 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-sm active:scale-[0.98]"
          >
            <div className={`w-10 h-10 rounded-full ${action.iconBg} flex items-center justify-center`}>
              <action.icon className={`w-5 h-5 ${action.iconColor}`} strokeWidth={2} />
            </div>
            <span className="text-[12px] md:text-[14px] font-semibold text-gray-800 dark:text-gray-200 text-center leading-tight">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
