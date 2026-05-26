import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ClearanceStatus = "pending" | "approved" | "not_approved" | "no_request";

interface ClearanceRequirementProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: ClearanceStatus;
  actionText?: string;
  onAction?: () => void;
}

const statusConfig = {
  pending: {
    bg: "bg-[#fbdfb1] dark:bg-[#fbdfb1]/10",
    text: "text-[#693d11] dark:text-[#f39c12]",
    label: "Pending",
    icon: Clock
  },
  approved: {
    bg: "bg-[#cbf5e5] dark:bg-[#12B76A]/10",
    text: "text-[#176448] dark:text-[#34d399]",
    label: "Approved",
    icon: CheckCircle2
  },
  not_approved: {
    bg: "bg-[#f8c9d2] dark:bg-[#f8c9d2]/10",
    text: "text-[#710e21] dark:text-[#f87171]",
    label: "Not Approved",
    icon: XCircle
  },
  no_request: {
    bg: "bg-[#e2e4e9] dark:bg-gray-800",
    text: "text-[#525866] dark:text-gray-400",
    label: "No Request",
    icon: AlertCircle
  }
};

export function ClearanceRequirement({
  icon: Icon,
  title,
  description,
  status,
  actionText,
  onAction
}: ClearanceRequirementProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-[#F8F9FB] dark:bg-gray-900 rounded-[24px] p-5 flex flex-col items-start md:justify-between gap-4 group transition-all border border-transparent dark:border-gray-800 hover:border-gray-100 dark:hover:border-gray-700">
      <div className="flex flex-row gap-4 items-start justify-between  w-full flex-1">
        <div className="w-12 h-12 rounded-full bg-[#e2e4e9] dark:bg-gray-800 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-[#0a0d14] dark:text-gray-100" />
        </div>
        <div className={cn("px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 self-start sm:self-center", config.bg, config.text)}>
          <StatusIcon className="w-3 h-3" />
          <span className="text-[12px] font-bold uppercase tracking-tight">{config.label}</span>
        </div>
      </div>

      <div className="flex flex-col w-fit sm:max-w-[640px] items-stretch gap-1">
          <h4 className="text-[15px] font-bold text-[#0a0d14] dark:text-gray-100">{title}</h4>
          <p className="text-[13px] text-[#525866] dark:text-gray-400 leading-snug max-w-[320px] sm:max-w-[640px] pr-2">{description}</p>
          {actionText && (
            <button 
              onClick={onAction}
              className="text-[#003cbb] dark:text-[#4d82ff] text-[13px] font-semibold hover:underline mt-1 w-fit"
            >
              {actionText}
            </button>
          )}
      </div>
    </div>
  );
}
