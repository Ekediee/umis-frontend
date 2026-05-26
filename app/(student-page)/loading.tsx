import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Banner Skeleton */}
      <Skeleton className="w-full h-[180px] rounded-[24px]" />
      
      {/* Grid Layout Skeletons */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6">
        <Skeleton className="w-full h-[320px] rounded-[24px]" />
        <Skeleton className="w-full h-[320px] rounded-[24px]" />
        <Skeleton className="w-full h-[340px] rounded-[24px]" />
        <Skeleton className="w-full h-[340px] rounded-[24px]" />
      </div>
    </div>
  );
}
