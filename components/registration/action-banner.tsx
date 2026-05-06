import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

interface ActionBannerProps {
  title: string;
  description: string;
  buttonText: string;
  buttonVariant?: "primary" | "dark" | "outline";
  gradientClass: string;
  illustrationSrc: string;
  onClick?: () => void;
  className?: string;
}

export function ActionBanner({
  title,
  description,
  buttonText,
  buttonVariant = "primary",
  gradientClass,
  illustrationSrc,
  onClick,
  className
}: ActionBannerProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[24px] p-6 md:p-8 flex flex-col justify-between min-h-[220px] md:min-h-[260px] flex-1",
      gradientClass,
      className
    )}>
      <div className="relative z-10 max-w-[80%] md:max-w-[60%] flex flex-col gap-3">
        <h3 className="text-[20px] md:text-[24px] font-bold text-[#0a0a0a] leading-tight">
          {title}
        </h3>
        <p className="text-[14px] md:text-[16px] text-[#525866] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="relative z-10 mt-6 md:mt-8">
        <Button
          onClick={onClick}
          className={cn(
            "rounded-[12px] px-6 h-11 text-[15px] font-semibold transition-all flex items-center gap-2",
            buttonVariant === "primary" && "bg-[#003cbb] hover:bg-[#002e8f] text-white shadow-sm",
            buttonVariant === "dark" && "bg-[#0a0d14] hover:bg-[#1a1d24] text-white",
            buttonVariant === "outline" && "bg-[#eef3fd] hover:bg-[#e4ebfa] text-[#003cbb]"
          )}
        >
          {buttonText}
          {buttonVariant !== "dark" && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Illustration */}
      <div className="absolute right-[-15px] bottom-[-30px] w-[180px] h-[180px] md:w-[300px] md:h-[300px] opacity-90">
        <Image
          src={illustrationSrc}
          alt=""
          width={300}
          height={300}
          className="object-contain"
        />
      </div>
    </div>
  );
}
