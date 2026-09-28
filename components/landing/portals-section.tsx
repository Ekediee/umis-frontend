"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  TrendingUp,
  Calendar,
  CreditCard,
  Home,
  Upload,
  CheckCircle2,
  BarChart3,
  Monitor,
  MessageSquare,
  Bell,
  AlertCircle,
  Users,
  Briefcase,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { EduDoodles, SectionEyebrow } from "./edu-decor";

// --- Types ---
interface PortalFeature {
  name: string;
  Icon: ComponentType<{ className?: string }>;
  color: string;
}

interface Portal {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  image: string;
  cardBg: string;
  features: PortalFeature[];
  buttonText: string;
  buttonHref: string;
  disabled?: boolean;
  imageOnLeft: boolean;
}

// --- Data ---
const portals: Portal[] = [
  {
    id: "student-portal",
    tag: "Student Portal",
    tagColor: "bg-brand-student text-white",
    title: "Complete academic journey management for students",
    image: "/images/landing/portal_student.png",
    cardBg: "bg-[#F0F5FE] dark:bg-brand-student/10",
    features: [
      { name: "Course Registration", Icon: BookOpen, color: "text-brand-student" },
      { name: "Result Checking", Icon: FileText, color: "text-brand-student" },
      { name: "GPA/CGPA Monitoring", Icon: TrendingUp, color: "text-brand-student" },
      { name: "Timetable Access", Icon: Calendar, color: "text-brand-student" },
      { name: "Online Fee Payment", Icon: CreditCard, color: "text-brand-student" },
      { name: "Hostel Management", Icon: Home, color: "text-brand-student" },
    ],
    buttonText: "Access Student Portal",
    buttonHref: "/login",
    imageOnLeft: false,
  },
  {
    id: "lecturer-portal",
    tag: "Lecturer Portal",
    tagColor: "bg-brand-lecturer text-white",
    title: "Comprehensive course management tools",
    image: "/images/landing/portal_lecturer.png",
    cardBg: "bg-[#FAF5FF] dark:bg-brand-lecturer/10",
    features: [
      { name: "Course Management", Icon: BookOpen, color: "text-brand-lecturer" },
      { name: "Student Performance Tracking", Icon: TrendingUp, color: "text-brand-lecturer" },
      { name: "Upload Results", Icon: Upload, color: "text-brand-lecturer" },
      { name: "Grade Submission", Icon: CheckCircle2, color: "text-brand-lecturer" },
      { name: "Lecture Timetable", Icon: Calendar, color: "text-brand-lecturer" },
      { name: "Academic Reporting", Icon: BarChart3, color: "text-brand-lecturer" },
    ],
    buttonText: "Coming Soon",
    buttonHref: "#",
    disabled: true,
    imageOnLeft: true,
  },
  {
    id: "guardian-portal",
    tag: "Guardian Portal",
    tagColor: "bg-brand-guardian text-white",
    title: "Monitor and support your ward's academic progress",
    image: "/images/landing/portal_guardian.png",
    cardBg: "bg-[#F0FAF5] dark:bg-brand-guardian/10",
    features: [
      { name: "Monitor Ward Performance", Icon: Monitor, color: "text-brand-guardian" },
      { name: "Direct Communication", Icon: MessageSquare, color: "text-brand-guardian" },
      { name: "Fee Payment Gateways", Icon: CreditCard, color: "text-brand-guardian" },
      { name: "Events Notification", Icon: Bell, color: "text-brand-guardian" },
      { name: "Progress Report", Icon: FileText, color: "text-brand-guardian" },
      { name: "Academic Alerts", Icon: AlertCircle, color: "text-brand-guardian" },
    ],
    buttonText: "Coming Soon",
    buttonHref: "#",
    disabled: true,
    imageOnLeft: false,
  },
  {
    id: "alumnae-portal",
    tag: "Alumnae Portal",
    tagColor: "bg-brand-alumnae text-white",
    title: "Stay connected and engaged with your alma mater",
    image: "/images/landing/portal_alumnae.png",
    cardBg: "bg-[#FFF8F0] dark:bg-brand-alumnae/10",
    features: [
      { name: "Alumni Networking", Icon: Users, color: "text-brand-alumnae" },
      { name: "Career Opportunities", Icon: Briefcase, color: "text-brand-alumnae" },
      { name: "Mentorship Programs", Icon: GraduationCap, color: "text-brand-alumnae" },
      { name: "Donations & Contributions", Icon: HeartHandshake, color: "text-brand-alumnae" },
      { name: "Community Updates", Icon: Bell, color: "text-brand-alumnae" },
      { name: "Continuing Education", Icon: BookOpen, color: "text-brand-alumnae" },
    ],
    buttonText: "Coming Soon",
    buttonHref: "#",
    disabled: true,
    imageOnLeft: true,
  },
];

// --- Component ---
export function PortalsSection() {
  return (
    <section id="portals" className="relative w-full py-16 bg-white dark:bg-[#0B0F19] z-10 overflow-hidden">
      <EduDoodles set="portals" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">

        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionEyebrow icon={Users}>For everyone on campus</SectionEyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight mb-4"
          >
            Dedicated Portals
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-[#4A5565] dark:text-gray-400 leading-relaxed"
          >
            Tailored interfaces designed for the unique needs of every member of the academic community.
          </motion.p>
        </div>

        {/* Portals List */}
        <div className="flex flex-col gap-10">
          {portals.map((portal) => (
            <motion.div
              key={portal.id}
              id={portal.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className={`${portal.cardBg} rounded-[28px] px-5 py-10 sm:p-12 lg:p-14 flex flex-col ${
                portal.imageOnLeft ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center justify-between gap-12 lg:gap-14 border border-black/[0.04] dark:border-white/5 shadow-none overflow-hidden`}
            >
              {/* Content Side */}
              <div className="flex-1 w-full max-w-xl">
                <div className={`inline-flex px-4 py-1.5 rounded-full ${portal.tagColor} text-xs font-semibold mb-6 tracking-wide shadow-none`}>
                  {portal.tag}
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold text-[#101828] dark:text-white mb-8 leading-[1.25] tracking-tight">
                  {portal.title}
                </h3>

                {/* 2-Column Feature Pill Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-9">
                  {portal.features.map(({ name, Icon, color }) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 bg-white dark:bg-[#111827] rounded-[14px] px-4 py-3 border border-white/80 dark:border-white/5 shadow-none"
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      <span className="text-[13px] font-semibold text-[#344054] dark:text-gray-300 truncate">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>

                {portal.disabled ? (
                  <button
                    disabled
                    aria-label={`${portal.tag} — Coming Soon`}
                    className="inline-flex items-center justify-center bg-gray-100 dark:bg-[#111827] text-gray-400 dark:text-gray-500 rounded-[12px] px-7 h-12 text-sm font-semibold shadow-none cursor-not-allowed border border-gray-200 dark:border-white/5"
                  >
                    Coming Soon
                  </button>
                ) : (
                  <Link
                    href={portal.buttonHref}
                    className="inline-flex items-center justify-center bg-brand-blue hover:bg-brand-blue-hover text-white rounded-[12px] px-7 h-12 text-sm font-semibold shadow-none transition-all"
                  >
                    {portal.buttonText}
                  </Link>
                )}
              </div>

              {/* Image Side */}
              <div className="flex-1 w-[116%] sm:w-full flex items-center justify-center mt-2 sm:mt-0">
                <div className="relative w-full max-w-[540px] aspect-[543/472]">
                  <Image
                    src={portal.image}
                    alt={portal.title}
                    fill
                    className="object-contain scale-[1.05] sm:scale-100 dark:brightness-[0.9] dark:contrast-[1.1]"
                    sizes="(max-width: 768px) 100vw, 540px"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
