"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Globe, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#F8FAFC] dark:bg-[#07090E] text-[#101828] dark:text-white pt-20 pb-8 z-10 relative border-t border-gray-200/80 dark:border-white/10 overflow-hidden transition-colors duration-300">
      {/* Soft Blue Ambient Glow from left to right (matching hero section #0048E0 glow) */}
      <div
        aria-hidden="true"
        className="absolute -bottom-24 sm:-bottom-32 left-1/2 -translate-x-1/2 w-[110%] max-w-[1600px] h-[220px] sm:h-[300px] rounded-[100%] bg-gradient-to-r from-[#0048E0]/5 via-[#0048E0]/15 to-[#0048E0]/5 dark:from-[#0048E0]/15 dark:via-[#0048E0]/35 dark:to-[#0048E0]/15 blur-[90px] sm:blur-[130px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Col */}
          <div className="flex flex-col items-start">
            <Link href="/" className="flex items-center mb-6">
              <div className="relative w-[160px] h-[40px] flex-shrink-0">
                <Image
                  src="/images/landing/bu_pulse_logo_new.png"
                  alt="BU Pulse Logo"
                  fill
                  className="object-contain object-left dark:brightness-0 dark:invert transition-all"
                />
              </div>
            </Link>
            <p className="text-[#4A5565] dark:text-white/70 text-sm leading-relaxed max-w-xs">
              Empowering universities with intelligent management systems for the digital age.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[#101828] dark:text-white text-base mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm text-[#4A5565] dark:text-white/70">
              <li>
                <Link href="#home" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <a href="https://support.babcock.edu.ng" target="_blank" rel="noopener noreferrer" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Support</a>
              </li>
            </ul>
          </div>
          
          {/* Portals */}
          <div>
            <h4 className="font-bold text-[#101828] dark:text-white text-base mb-6">Portals</h4>
            <ul className="space-y-3 text-sm text-[#4A5565] dark:text-white/70">
              <li>
                <Link href="#student-portal" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link href="#lecturer-portal" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Lecturer Portal</Link>
              </li>
              <li>
                <Link href="#guardian-portal" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Guardian Portal</Link>
              </li>
              <li>
                <Link href="#alumnae-portal" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">Alumnae Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-[#101828] dark:text-white text-base mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-[#4A5565] dark:text-white/70">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#003CBB] dark:text-white/70 flex-shrink-0" />
                <a href="mailto:helpdesk.ict@babcock.edu.ng" className="hover:text-[#003CBB] dark:hover:text-white transition-colors">
                  helpdesk.ict@babcock.edu.ng
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#003CBB] dark:text-white/70 flex-shrink-0" />
                <a
                  href="https://support.babcock.edu.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#003CBB] dark:hover:text-white transition-colors"
                >
                  support.babcock.edu.ng
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#003CBB] dark:text-white/70 flex-shrink-0 mt-0.5" />
                <span>Ilishan-Remo, Ogun State.</span>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Bottom Line Bar — Amini-style copyright & legal links */}
        <div className="pt-8 border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[#64748B] dark:text-white/50">
            © COPYRIGHT 2026 BU PULSE
          </p>
          <ul className="flex flex-wrap items-center gap-6 font-mono text-xs uppercase tracking-wider text-[#64748B] dark:text-white/50">
            <li>
              <Link href="#" className="hover:text-[#101828] dark:hover:text-white transition-colors">TERMS OF SERVICE</Link>
            </li>
            <li>
              <Link href="#" className="hover:text-[#101828] dark:hover:text-white transition-colors">PRIVACY POLICY</Link>
            </li>
            <li>
              <a href="https://support.babcock.edu.ng" target="_blank" rel="noopener noreferrer" className="hover:text-[#101828] dark:hover:text-white transition-colors">SUPPORT</a>
            </li>
          </ul>
        </div>

        {/* Giant Watermark Display — Styled like Amini.ai with "BU Pulse" (Pulse in inter serif) */}
        <div className="w-full overflow-visible flex justify-center items-center pt-8 sm:pt-12 pb-2 select-none pointer-events-none">
          <div 
            className="w-full text-center whitespace-nowrap text-[15vw] sm:text-[14vw] md:text-[13vw] font-black leading-none tracking-tight bg-gradient-to-b from-[#101828]/15 via-[#101828]/5 to-transparent dark:from-white/20 dark:via-white/10 dark:to-transparent bg-clip-text text-transparent [--footer-stroke:rgba(16,24,40,0.08)] dark:[--footer-stroke:rgba(255,255,255,0.08)]"
            style={{
              WebkitTextStroke: "1px var(--footer-stroke)",
            }}
          >
            <span className="font-sans font-extrabold tracking-tight">BU</span>{" "}
            <span className="font-serif italic font-normal inline-block pr-[0.18em]" style={{ fontFamily: "Georgia, serif" }}>Pulse</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
