"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ProcessingOverlayProps {
  isVisible: boolean;
}

export function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-white/70 dark:bg-black/75 backdrop-blur-lg transition-colors" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6 z-10">
        {/* Flame GIF */}
        <div className="relative w-[120px] h-[120px] md:w-[160px] md:h-[160px]">
          <Image
            src="/Flame.gif"
            alt="Processing"
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        {/* Processing text */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[20px] md:text-[24px] font-bold text-[#0a0d14] dark:text-gray-100 tracking-tight transition-colors">
            Processing
          </span>
          <span className="text-[14px] text-[#525866] dark:text-gray-400 text-center max-w-[280px] transition-colors">
            Please wait while we process your payment...
          </span>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#003cbb] dark:bg-[#4d82ff] animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#003cbb] dark:bg-[#4d82ff] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-[#003cbb] dark:bg-[#4d82ff] animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
