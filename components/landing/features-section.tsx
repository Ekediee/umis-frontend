"use client";

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Wallet, 
  Bell, 
  Database, 
  ShieldCheck, 
  Headphones,
  Users,
  GraduationCap,
  Sparkles,
  Activity,
  Lightbulb,
  BarChart3
} from "lucide-react";
import { EduDoodles, NotebookBackdrop, SectionEyebrow } from "./edu-decor";

const excellenceFeatures = [
  {
    title: "Academic Management",
    description: "Course registration, results, transcripts, timetables and academic records.",
    icon: <BookOpen className="w-5 h-5 text-[#155DFC]" />,
    iconBg: "bg-[#EEF3FF] dark:bg-[#155DFC]/20",
  },
  {
    title: "Financial Services",
    description: "Online payments, Invoices, receipts and financial history tracking.",
    icon: <Wallet className="w-5 h-5 text-[#F97316]" />,
    iconBg: "bg-[#FFEDD4] dark:bg-[#F97316]/20",
  },
  {
    title: "Multichannel Notifications",
    description: "Stay informed with important updates, alerts and system announcements.",
    icon: <Bell className="w-5 h-5 text-[#EF4444]" />,
    iconBg: "bg-[#FFE2E2] dark:bg-[#EF4444]/20",
  },
  {
    title: "Accurate Data",
    description: "Real-time synchronization ensures all information is correct and accurate.",
    icon: <Database className="w-5 h-5 text-[#10B981]" />,
    iconBg: "bg-[#DCFCE7] dark:bg-[#10B981]/20",
  },
  {
    title: "Seamless Release",
    description: "Automated workflows for result approvals, clearance, and graduation lists.",
    icon: <ShieldCheck className="w-5 h-5 text-[#0284C7]" />,
    iconBg: "bg-[#DBEAFE] dark:bg-[#0284C7]/20",
  },
  {
    title: "Support Services",
    description: "Dedicated technical support to assist you whenever you need help.",
    icon: <Headphones className="w-5 h-5 text-[#8B5CF6]" />,
    iconBg: "bg-[#E1D4F4] dark:bg-[#8B5CF6]/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative w-full py-20 bg-white dark:bg-[#0B0F19] z-10 overflow-hidden">
      <NotebookBackdrop />
      <EduDoodles set="features" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">

        {/* Built for Excellence Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionEyebrow icon={Lightbulb}>Why BU Pulse</SectionEyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight mb-4"
          >
            Built for Excellence
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-[#4A5565] dark:text-gray-400 leading-relaxed"
          >
            A secure and intelligent platform that brings together all aspects of university management, from academic excellence to administrative efficiency.
          </motion.p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-28">
          {excellenceFeatures.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              className="bg-white dark:bg-[#111827] rounded-[20px] p-8 border border-[#E5E7EB]/80 dark:border-white/5 shadow-none hover:border-[#155DFC]/30 dark:hover:border-[#155DFC]/50 transition-all duration-300 flex flex-col items-start"
            >
              <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center mb-6 ${feat.iconBg}`}>
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-[#101828] dark:text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-[#4A5565] dark:text-gray-400 leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

export function ImpactSection() {
  return (
    <section id="impact" className="relative w-full py-20 bg-white dark:bg-[#0B0F19] z-10 overflow-hidden">
      <EduDoodles set="impact" />
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">

        {/* Impact by the Numbers Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <SectionEyebrow icon={BarChart3}>Our community</SectionEyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight mb-4"
          >
            Impact by the Numbers
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-[#4A5565] dark:text-gray-400 leading-relaxed"
          >
            Trusted by thousands across the institution, making university engagement simpler and more connected than ever
          </motion.p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 - Active Students */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="bg-[#EEF4FF] dark:bg-[#155DFC]/10 rounded-[20px] p-7 flex flex-col justify-between min-h-[220px] border border-blue-100/50 dark:border-[#155DFC]/20"
          >
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#DBEAFE] dark:bg-[#155DFC]/20 text-[#155DFC] flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-[#101828] dark:text-white mb-1">13,000</p>
              <p className="font-bold text-[#101828] dark:text-white text-sm mb-1">Active Students</p>
              <p className="text-[#4A5565] dark:text-gray-400 text-xs">Enrolled across all programs</p>
            </div>
          </motion.div>
          
          {/* Card 2 - Faculty Members */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.08 }}
            className="bg-[#F6EEFF] dark:bg-[#9333EA]/10 rounded-[20px] p-7 flex flex-col justify-between min-h-[220px] border border-purple-100/50 dark:border-[#9333EA]/20"
          >
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#E9D5FF] dark:bg-[#9333EA]/20 text-[#9333EA] flex items-center justify-center mb-5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-[#101828] dark:text-white mb-1">500+</p>
              <p className="font-bold text-[#101828] dark:text-white text-sm mb-1">Faculty Members</p>
              <p className="text-[#4A5565] dark:text-gray-400 text-xs">Dedicated educators and researchers</p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200/40 dark:border-purple-500/20">
              <span className="text-xs font-semibold text-[#059669] dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 98% satisfaction rate
              </span>
            </div>
          </motion.div>

          {/* Card 3 - Alumni Network */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.16 }}
            className="bg-[#FFF4E8] dark:bg-[#EA580C]/10 rounded-[20px] p-7 flex flex-col justify-between min-h-[220px] border border-orange-100/50 dark:border-[#EA580C]/20"
          >
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#FED7AA] dark:bg-[#EA580C]/20 text-[#EA580C] flex items-center justify-center mb-5">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-[#101828] dark:text-white mb-1">21,000+</p>
              <p className="font-bold text-[#101828] dark:text-white text-sm mb-1">Alumni Network</p>
              <p className="text-[#4A5565] dark:text-gray-400 text-xs">Graduates worldwide</p>
            </div>
            <div className="mt-4 pt-3 border-t border-orange-200/40 dark:border-orange-500/20">
              <span className="text-xs font-semibold text-[#059669] dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Growing community
              </span>
            </div>
          </motion.div>

          {/* Card 4 - System Uptime */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: 0.24 }}
            className="bg-[#EAFBF2] dark:bg-[#059669]/10 rounded-[20px] p-7 flex flex-col justify-between min-h-[220px] border border-emerald-100/50 dark:border-[#059669]/20"
          >
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#BBF7D0] dark:bg-[#059669]/20 text-[#059669] flex items-center justify-center mb-5">
                <Activity className="w-5 h-5" />
              </div>
              <p className="text-3xl lg:text-4xl font-extrabold text-[#101828] dark:text-white mb-1">99.9%</p>
              <p className="font-bold text-[#101828] dark:text-white text-sm mb-1">System Uptime</p>
              <p className="text-[#4A5565] dark:text-gray-400 text-xs">Reliable access year-round</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
