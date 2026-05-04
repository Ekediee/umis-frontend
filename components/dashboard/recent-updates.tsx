import { Card, CardContent } from "@/components/ui/card";
import { Check, Info, Home } from "lucide-react";
import Link from "next/link";

const updates = [
  {
    id: 1,
    icon: Check,
    iconBg: "bg-[#ECFDF3]",
    iconColor: "text-[#12B76A]",
    title: "Financial Approval",
    description: "Your financial status for the current semester is Approved.",
    time: "2 hours ago",
  },
  {
    id: 2,
    icon: Info,
    iconBg: "bg-[#f5f8fe]",
    iconColor: "text-[#003cbb]",
    title: "Course Advisor Assigned",
    description: "Dr. Adeyemi Olumide has been assigned as your course advisor.",
    time: "1 day ago",
  },
  {
    id: 3,
    icon: Home,
    iconBg: "bg-[#FFF7ED]",
    iconColor: "text-[#F97316]",
    title: "Off-Campus Residence",
    description: "Your off-campus residence application has been Approved.",
    time: "3 days ago",
  },
];

export function RecentUpdates() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[17px] font-bold text-gray-900">Recent Updates</h3>
          <Link href="#" className="text-[13px] font-semibold text-[#003cbb] hover:text-[#003095]">View all</Link>
        </div>

        <div className="flex flex-col gap-6">
          {updates.map((update) => (
            <div key={update.id} className="flex gap-4 items-start">
              <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${update.iconBg}`}>
                <update.icon className={`w-[18px] h-[18px] ${update.iconColor}`} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col gap-1.5 pt-0.5">
                <h4 className="text-[14px] font-bold text-gray-900 leading-none">{update.title}</h4>
                <p className="text-[13px] text-gray-500 leading-relaxed pr-2">{update.description}</p>
                <span className="text-[11px] font-semibold text-gray-400 mt-0.5">{update.time}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
