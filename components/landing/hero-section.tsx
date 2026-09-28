"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Activity } from "lucide-react";
import { TypewriterHeading, type TypewriterSegment } from "./typewriter-heading";

// Module-level so the array identity is stable across renders.
const HEADLINE: TypewriterSegment[] = [
  { text: "A " },
  {
    text: "new heartbeat",
    className: "text-transparent bg-clip-text bg-gradient-to-r from-[#33FFC2] via-[#382AF7] to-[#F514B1] font-semibold",
  },
  { text: " for" },
  { break: true },
  { text: "your Academic" },
  { break: true },
  { text: "Ecosystem" },
];

export function HeroSection() {
  return (
    <section id="home" className="relative w-full overflow-hidden bg-gradient-to-b from-[#f0f6ff]/70 via-[#f8fbff] to-white dark:from-[#0B0F19] dark:via-[#0F172A] dark:to-[#0B0F19] lg:min-h-[760px] flex flex-col justify-center pt-32 pb-16 md:pt-40 md:pb-24 lg:pt-0 lg:pb-0">

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 lg:gap-20">

        {/* Left Column: Heading and Call to Action */}
        <div className="w-full md:w-[45%] lg:w-[42%] max-w-[620px] md:max-w-none flex-shrink-0 text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="mb-8 relative w-[240px] md:w-[220px] lg:w-[272px] h-[58px] md:h-[50px] lg:h-[65px]">
              <Image
                src="/images/landing/bu_pulse_logo_new.png"
                alt="BU Pulse Logo"
                fill
                className="object-contain object-left"
                sizes="(max-width: 768px) 240px, (max-width: 1024px) 220px, 272px"
                priority
              />
            </div>

            <TypewriterHeading
              segments={HEADLINE}
              startDelay={650}
              className="text-[36px] sm:text-5xl md:text-[38px] lg:text-[48px] xl:text-[56px] font-semibold text-[#202124] dark:text-white tracking-tight leading-[1.15] mb-6"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="text-[17px] sm:text-[18px] md:text-[15px] lg:text-[18px] xl:text-[20px] text-[#4A5565] dark:text-gray-300 leading-relaxed mb-10 max-w-[568px] lg:max-w-full"
          >
            Designed to manage academic, administrative, and financial activities seamlessly. A unified digital platform connecting students, faculty, and administration.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="flex items-center relative z-20"
          >
            <Link
              href="/login"
              className="inline-flex justify-center relative bg-brand-blue hover:bg-brand-blue-hover text-white rounded-[12px] px-8 h-[54px] text-base font-semibold shadow-none transition-all hover:scale-[1.02] items-center gap-2 overflow-hidden group"
            >
              {/* Double chevron shimmer sweep */}
              <span className="absolute inset-0 animate-[shimmer_2.8s_ease-in-out_infinite] skew-x-[-20deg]">
                <span className="block w-[30%] h-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />
              </span>
              <span className="absolute inset-0 animate-[shimmer_2.8s_ease-in-out_0.3s_infinite] skew-x-[-20deg]">
                <span className="block w-[30%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </span>
              <span className="relative z-10 flex items-center gap-2">
                Login to feel the pulse
                <Activity className="w-5 h-5" />
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Hero Mockup (Laptop + Phone on desktop, Phone only on tablet/mobile) */}
        {/* flex-1 takes all remaining width after the gap. */}
        <div className="w-full md:flex-1 relative h-[380px] sm:h-[450px] md:h-[500px] lg:h-[650px] xl:h-[750px] pointer-events-none flex items-center justify-center md:justify-start mt-8 md:mt-0">

          {/* Mobile/Tablet Phone Only (< lg) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:hidden relative w-full h-full max-h-[450px] md:max-h-[500px] flex justify-center md:justify-start"
          >
            {/* Ambient Blue Background Glow */}
            <div className="absolute left-1/2 md:left-[120px] top-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] md:w-[300px] h-[400px] rounded-full bg-[#0048E0]/15 dark:bg-[#0048E0]/30 blur-[80px]" />

            <div className="relative w-[75%] sm:w-[65%] md:w-[85%] max-w-[280px] md:max-w-[340px] h-full z-10">
              <Image
                src="/images/landing/hero_iphone.png"
                alt="BU Pulse Mobile App on iPhone"
                fill
                className="object-contain object-center md:object-left-bottom"
                sizes="(max-width: 640px) 75vw, (max-width: 768px) 65vw, 340px"
                priority
              />
            </div>
          </motion.div>

          {/* Aspect Ratio Container for Devices - Desktop >= lg */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 lg:w-[1300px] xl:w-[1500px] aspect-[1.5]"
          >
            {/* Ambient Blue Background Glow */}
            <div className="absolute left-[15%] top-[45%] -translate-y-1/2 w-[60%] h-[70%] rounded-full bg-[#0048E0]/15 dark:bg-[#0048E0]/30 blur-[100px] lg:blur-[120px]" />

            {/* MacBook Pro */}
            <div className="absolute bottom-[-10%] xl:bottom-[-4.6%] left-[calc(18%-300px)] w-[85%] h-[95%]">
              <Image
                src="/images/landing/hero_macbook.png"
                alt="BU Pulse Web Dashboard on MacBook"
                fill
                className="object-contain object-left-bottom"
                sizes="(max-width: 1280px) 85vw, 1275px"
                priority
              />
            </div>

            {/* iPhone 16 Pro */}
            <div className="absolute bottom-0 xl:bottom-[12%] left-0 w-[18.5%] h-[63%] z-10">
              <Image
                src="/images/landing/hero_iphone.png"
                alt="BU Pulse Mobile App on iPhone"
                fill
                className="object-contain object-left-bottom"
                sizes="(max-width: 1280px) 18vw, 240px"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
