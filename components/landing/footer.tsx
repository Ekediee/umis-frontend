"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#003CBB] dark:bg-[#090C15] text-white pt-20 pb-12 z-10 relative border-t-0 dark:border-t dark:border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        
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
                  className="object-contain object-left brightness-0 invert"
                />
              </div>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs">
              Empowering universities with intelligent management systems for the digital age.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white text-base mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <Link href="#home" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Support</Link>
              </li>
            </ul>
          </div>
          
          {/* Portals */}
          <div>
            <h4 className="font-bold text-white text-base mb-6">Portals</h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li>
                <Link href="#student-portal" className="hover:text-white transition-colors">Student Portal</Link>
              </li>
              <li>
                <Link href="#lecturer-portal" className="hover:text-white transition-colors">Lecturer Portal</Link>
              </li>
              <li>
                <Link href="#guardian-portal" className="hover:text-white transition-colors">Guardian Portal</Link>
              </li>
              <li>
                <Link href="#alumnae-portal" className="hover:text-white transition-colors">Alumnae Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-white text-base mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-white/70 flex-shrink-0" />
                <a href="mailto:helpdesk@support.babcock.edu.ng" className="hover:text-white transition-colors">
                  helpdesk@support.babcock.edu.ng
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-white/70 flex-shrink-0" />
                <a href="tel:+2348100008877" className="hover:text-white transition-colors">
                  +2348100008877
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-white/70 flex-shrink-0 mt-0.5" />
                <span>Ilishan-Remo, Ogun State.</span>
              </li>
            </ul>
          </div>

        </div>
        
        {/* Bottom Line */}
        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/60 text-xs">
            © 2026 UMIS. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
