"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibleVerse {
  text: string;
  reference: string;
}

const ENCOURAGING_VERSES: BibleVerse[] = [
  {
    text: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13"
  },
  {
    text: "For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11"
  },
  {
    text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    reference: "Isaiah 40:31"
  },
  {
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9"
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6"
  },
  {
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    reference: "Romans 8:28"
  },
  {
    text: "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.",
    reference: "Psalm 23:1-3"
  },
  {
    text: "The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?",
    reference: "Psalm 27:1"
  },
  {
    text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.",
    reference: "John 14:27"
  },
  {
    text: "Cast all your anxiety on him because he cares for you.",
    reference: "1 Peter 5:7"
  }
];

export function DailyVerseCard() {
  const [verse, setVerse] = useState<BibleVerse | null>(null);

  useEffect(() => {
    // Check if there is already a verse selected for this login session
    const savedVerse = sessionStorage.getItem("session_daily_verse");
    if (savedVerse) {
      try {
        setVerse(JSON.parse(savedVerse));
        return;
      } catch (e) {
        console.error("Failed to parse saved session verse", e);
      }
    }

    // Pick a random verse and save it to sessionStorage
    const randomIndex = Math.floor(Math.random() * ENCOURAGING_VERSES.length);
    const selectedVerse = ENCOURAGING_VERSES[randomIndex];
    setVerse(selectedVerse);
    sessionStorage.setItem("session_daily_verse", JSON.stringify(selectedVerse));
  }, []);

  if (!verse) return null;

  return (
    <div className="relative w-full rounded-[24px] bg-gradient-to-br from-[#f3f6ff] via-[#e6edff] to-[#f7f9ff] dark:from-[#0d163d] dark:via-[#090e28] dark:to-[#06081a] border border-[#dce3f6] dark:border-[#1a2353]/35 shadow-[0px_4px_20px_rgba(37,62,167,0.02)] dark:shadow-none p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden mb-6 group transition-all duration-300">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-400/10 blur-[40px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#bc78ec]/10 blur-[30px] pointer-events-none" />

      {/* Quote watermark icon */}
      <Quote className="absolute right-4 bottom-4 w-28 h-28 text-blue-200/15 dark:text-blue-900/10 pointer-events-none" strokeWidth={1} />

      <div className="flex gap-4 md:gap-5 relative z-10 flex-1">
        {/* Left Side: BU Torch Icon Visual Indicator */}
        <div className="w-10 h-10 md:w-11 md:h-11 bg-white dark:bg-[#1a2353]/40 rounded-[14px] flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-blue-800/25 shadow-sm overflow-hidden p-1.5">
          <Image
            src="/images/BU Torch.png"
            alt="Babcock University Torch"
            width={32}
            height={32}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        {/* Text Container */}
        <div className="flex flex-col gap-1.5 flex-1 pr-6">
          <span className="text-[11px] font-bold text-[#868c98] dark:text-gray-400 uppercase tracking-widest leading-none">
            Daily Encounters
          </span>
          <p 
            className="text-[15px] md:text-[16px] font-serif italic text-gray-850 dark:text-gray-250 leading-relaxed font-semibold transition-all duration-300"
            style={{ fontFamily: "Georgia, serif" }}
          >
            "{verse.text}"
          </p>
          <span className="text-[13px] font-bold text-[#003cbb] dark:text-[#60a5fa] transition-all duration-300">
            — {verse.reference}
          </span>
        </div>
      </div>
    </div>
  );
}
