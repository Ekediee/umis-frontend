"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Laptop, 
  CheckCircle2, 
  Circle, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const REGISTRATION_STEPS = [
  {
    id: 1,
    title: "Step 1: Course Selection",
    description: "Select and verify your required and elective courses for the current semester.",
    href: "/registration/courses",
    btnText: "Go to Course Selection",
  },
  {
    id: 2,
    title: "Step 2: Commence Registration",
    description: "Follow on-screen passing (Meal, Residence, Worship Center, and Courses). Do not jump the processes.",
    href: "/registration",
    btnText: "Start Registration Flow",
  },
  {
    id: 3,
    title: "Step 3: Finance Statement",
    description: "Review your detailed financial statement and fee breakdown.",
    href: "/dashboard/finance",
    btnText: "View Finance Statement",
  },
  {
    id: 4,
    title: "Step 4: Select Payments",
    description: "Choose your preferred payment structure and approved payment gateway.",
    href: "/dashboard/finance/fees/payment",
    btnText: "Proceed to Payments",
  },
  {
    id: 5,
    title: "Step 5: Print Receipt",
    description: "Generate and print your official registration receipt.",
    href: "/dashboard/finance/receipt",
    btnText: "Print Receipt",
  },
];

interface OnboardingGuideCardProps {
  className?: string;
  isSheet?: boolean;
}

export function OnboardingGuideCard({ className, isSheet = false }: OnboardingGuideCardProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (id: number) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const progressPercent = Math.round((completedSteps.length / REGISTRATION_STEPS.length) * 100);

  return (
    <Card className={cn("rounded-[24px] border-blue-100 dark:border-gray-800 shadow-[0_4px_20px_rgba(0,60,187,0.06)] bg-gradient-to-br from-white via-[#fcfdff] to-[#f4f7ff] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/80 transition-all overflow-hidden", className)}>
      <CardContent className="p-5 md:p-7 flex flex-col gap-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-50 dark:border-gray-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#003cbb] dark:text-[#4d82ff] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Official Fresher Guide
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Welcome to your Pulse page!
            </h2>
          </div>
        </div>

        {/* Instructions Intro */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              To complete your registration, you must complete the following steps:
            </h3>
            <span className="text-xs font-bold text-[#003cbb] dark:text-[#4d82ff]">
              {completedSteps.length} of 5 completed ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#003cbb] to-[#2563eb] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Checklist */}
        <div className="flex flex-col gap-3">
          {REGISTRATION_STEPS.map((step) => {
            const isDone = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                  isDone
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40"
                    : "bg-white dark:bg-gray-900/60 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/40"
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleStep(step.id)}
                    aria-label={`Mark ${step.title} as ${isDone ? "incomplete" : "complete"}`}
                    className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex flex-col gap-1">
                    <h4 className={cn("text-sm font-bold leading-tight", isDone ? "text-emerald-900 dark:text-emerald-300 line-through" : "text-gray-900 dark:text-gray-100")}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                <Link
                  href={step.href}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#eef3fd] hover:bg-[#e2ebfd] dark:bg-[#003cbb]/20 dark:hover:bg-[#003cbb]/30 text-[#003cbb] dark:text-[#4d82ff] text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>{step.btnText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Security Alert & Official Signature */}
        <div className="mt-2 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-900 dark:text-red-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="font-bold">
              DO NOT be a victim of fraud while paying your school fees. Always use approved university channels.
            </span>
          </div>

          <span className="font-semibold text-gray-500 dark:text-gray-400 shrink-0 italic self-end sm:self-auto">
            -- from BU ICT Office
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
