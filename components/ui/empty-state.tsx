import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon = FolderOpen, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50 min-h-[300px]", 
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-gray-100">
        <Icon className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-[18px] font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-[14px] text-gray-500 max-w-[300px] mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
