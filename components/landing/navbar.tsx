"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  // Resolve the current actual visual theme
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-full text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md z-50 border-b border-gray-100/80 dark:border-white/10"
    >
      <div className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link href="/" className="flex items-center group z-10">
          <div className="relative flex items-center">
            <Image
              src="/images/babcock_navbar_logo.png"
              alt="Babcock University Logo"
              width={65}
              height={70}
              className="object-contain"
              priority
            />
          </div>
        </Link>
        
        {/* Navigation Links - Desktop Only */}
        <div className="hidden lg:flex items-center gap-8 text-[15px]">
          <Link href="#home" className="font-semibold text-[#003CBB] dark:text-blue-400 relative py-1">
            Home
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#003CBB] dark:bg-blue-400 rounded-full" />
          </Link>
          <Link href="#student-portal" className="text-gray-600 dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 transition-colors py-1">
            Students
          </Link>
          <Link href="#lecturer-portal" className="text-gray-600 dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 transition-colors py-1">
            Lecturers
          </Link>
          <Link href="#guardian-portal" className="text-gray-600 dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 transition-colors py-1">
            Guardians
          </Link>
          <Link href="#alumnae-portal" className="text-gray-600 dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 transition-colors py-1">
            Alumnae
          </Link>
        </div>

        {/* Desktop Login & Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <ThemeToggle />
          <a href="/login" className="inline-flex items-center justify-center bg-[#003CBB] hover:bg-[#003199] text-white rounded-[12px] px-7 h-10 font-bold text-sm transition-all shadow-none cursor-pointer">
            Login as a student
          </a>
        </div>

        {/* Mobile Actions */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <a href="/login" className="inline-flex items-center justify-center bg-[#003CBB] hover:bg-[#003199] text-white rounded-[10px] px-4 sm:px-5 h-9 font-bold text-[13px] sm:text-sm transition-all shadow-none cursor-pointer">
            Login
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-white/10 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#0B0F19] overflow-hidden shadow-xl"
          >
            <div className="flex flex-col px-6 py-6 gap-6">
              <Link href="#home" onClick={() => setIsOpen(false)} className="font-semibold text-[16px] text-[#003CBB] dark:text-blue-400">
                Home
              </Link>
              <Link href="#student-portal" onClick={() => setIsOpen(false)} className="text-[16px] text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 font-medium">
                Students
              </Link>
              <Link href="#lecturer-portal" onClick={() => setIsOpen(false)} className="text-[16px] text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 font-medium">
                Lecturers
              </Link>
              <Link href="#guardian-portal" onClick={() => setIsOpen(false)} className="text-[16px] text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 font-medium">
                Guardians
              </Link>
              <Link href="#alumnae-portal" onClick={() => setIsOpen(false)} className="text-[16px] text-[#4A5565] dark:text-gray-300 hover:text-[#003CBB] dark:hover:text-blue-400 font-medium">
                Alumnae
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
