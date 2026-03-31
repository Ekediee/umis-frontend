import { Card, CardContent } from "@/components/ui/card";
import { FileText, TrendingUp, Download, CreditCard } from "lucide-react";
import Link from "next/link";

const actions = [
  { id: 1, title: "Select Courses", icon: FileText, href: "#", iconColor: "text-[#3B5B98]" },
  { id: 2, title: "View Results", icon: TrendingUp, href: "#", iconColor: "text-[#34A853]" },
  { id: 3, title: "Export Transcript", icon: Download, href: "#", iconColor: "text-[#D94F8F]" },
  { id: 4, title: "Make Payment", icon: CreditCard, href: "/dashboard/finance", iconColor: "text-[#00B4D8]" },
];

export function QuickActions() {
  return (
    <Card className="rounded-[24px] border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden h-full flex flex-col bg-white">
      <CardContent className="p-6 h-full flex flex-col">
        <h3 className="text-[17px] font-bold text-gray-900 mb-6">Quick Actions</h3>

        <div className="grid grid-cols-2 gap-4 flex-1">
          {actions.map((action) => (
            <Link 
              href={action.href} 
              key={action.id}
              className="bg-[#F8F9FB] rounded-[20px] p-5 flex flex-col items-center justify-center gap-3.5 transition-all hover:shadow-md border border-transparent hover:border-gray-100/50"
            >
              <action.icon className={`w-7 h-7 ${action.iconColor}`} strokeWidth={2} />
              <span className="text-[13px] font-bold text-gray-800 text-center leading-tight max-w-[80%]">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
