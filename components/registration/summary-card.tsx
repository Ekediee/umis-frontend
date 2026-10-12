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
      "@container rounded-[24px] px-1 md:px-3 py-3 md:py-6 overflow-hidden flex-1 min-w-0",
      isWarning ? "bg-[#fef3eb] dark:bg-[#c2540a]/10 border border-[#ffdac2] dark:border-[#c2540a]/30" : "bg-white dark:bg-gray-900 dark:border-gray-800"
    )}>
      <CardContent className=" flex flex-col gap-2 md:gap-4 h-full justify-between">
        {/* Wraps: on a narrow card the badge drops under the title instead of spilling out */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 min-w-0">
          <span className="text-[14px] font-medium text-[#525866] dark:text-gray-400">{title}</span>
          {badgeText && (
            <div className="bg-[#c2d6ff] dark:bg-[#162664]/30 px-2 py-0.5 rounded-full whitespace-nowrap max-w-full">
              <span className="text-[10px] md:text-[12px] font-bold text-[#162664] dark:text-[#c2d6ff] uppercase tracking-wider whitespace-nowrap">{badgeText}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-1 min-w-0">
          <span className={cn(
            // Scales with the card's own width so values like 2026/2027 always fit
            "text-[clamp(18px,11cqi,24px)] font-bold tracking-tight whitespace-nowrap",
            isWarning ? "text-[#c2540a] dark:text-[#ff9c5a]" : "text-[#0a0d14] dark:text-gray-100"
          )}>
            {value}
          </span>
          {subValue && (
            <span className="text-[14px] font-semibold text-[#f17b2c] dark:text-[#ff8f3d]">{subValue}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
