import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  badgeText?: string;
  isWarning?: boolean;
}

export function SummaryCard({ title, value, subValue, badgeText, isWarning }: SummaryCardProps) {
  return (
    <Card className={cn(
      "rounded-[24px] px-1 md:px-3 py-3 md:py-6 overflow-hidden flex-1 min-w-[160px]",
      isWarning ? "bg-[#fef3eb] border border-[#ffdac2]" : "bg-white"
    )}>
      <CardContent className=" flex flex-col gap-2 md:gap-4 h-full justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-[#525866]">{title}</span>
          {badgeText && (
            <div className="bg-[#c2d6ff] px-2 py-0.5 rounded-full">
              <span className="text-[12px] font-bold text-[#162664] uppercase tracking-wider">{badgeText}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className={cn(
            "text-[18px] md:text-[24px] font-bold tracking-tight",
            isWarning ? "text-[#c2540a]" : "text-[#0a0d14]"
          )}>
            {value}
          </span>
          {subValue && (
            <span className="text-[14px] font-semibold text-[#f17b2c]">{subValue}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
