import { Check, Info, Home } from "lucide-react";
import Link from "next/link";

const updates = [
  {
    id: 1,
    icon: Check,
    iconBg: "bg-[#cbf5e5]",
    iconColor: "text-[#12B76A]",
    title: "Financial Approval",
    description: "Your financial status for the current semester is Approved.",
    time: "2 hours ago",
  },
  {
    id: 2,
    icon: Info,
    iconBg: "bg-[#c2d6ff]",
    iconColor: "text-[#003cbb]",
    title: "Course Advisor Assigned",
    description: "Dr. Adeyemi Olumide has been assigned as your course advisor.",
    time: "1 day ago",
  },
  {
    id: 3,
    icon: Home,
    iconBg: "bg-[#f9c2ff]",
    iconColor: "text-[#a855f7]",
    title: "Off-Campus Residence",
    description: "Your off-campus residence application has been Approved.",
    time: "3 days ago",
  },
];

export function RecentUpdates() {
  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-5 md:p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900">Recent Updates</h3>
        <Link href="/notifications" className="text-[13px] md:text-[14px] font-medium text-[#3159d1] hover:text-[#003095]">View all</Link>
      </div>

      <div className="flex flex-col gap-5 md:gap-6">
        {updates.map((update) => (
          <div key={update.id} className="flex gap-3 md:gap-4 items-start">
            <div className={`w-[36px] h-[36px] md:w-[40px] md:h-[40px] rounded-full flex items-center justify-center shrink-0 ${update.iconBg}`}>
              <update.icon className={`w-[16px] h-[16px] md:w-[18px] md:h-[18px] ${update.iconColor}`} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-0.5 md:gap-1 pt-0.5 min-w-0">
              <h4 className="text-[13px] md:text-[14px] font-bold text-gray-900 leading-tight">{update.title}</h4>
              <p className="text-[12px] md:text-[14px] text-gray-500 leading-relaxed">{update.description}</p>
              <span className="text-[11px] font-medium text-gray-400 mt-0.5">{update.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
