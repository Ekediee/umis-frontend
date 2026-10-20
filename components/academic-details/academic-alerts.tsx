"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  BriefcaseBusiness,
  ChevronRight,
  X,
  Target,
  ShieldCheck,
  BadgeCheck,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentProfileAction } from "@/app/actions/user";
import { getCareerPathsAction, type CareerPathsResult } from "@/app/actions/careers";
import { useUserData } from "@/contexts/user-data-context";
import { GPAWhatIfSimulator } from "@/components/academic-details/gpa-what-if-simulator";
import { fitMessage, formatSalaryRange, type RankedCareer } from "@/lib/careers/match";
import type { UMISResponse } from "@/lib/session";
import { cn } from "@/lib/utils";

// ─── CGPA fit line ──────────────────────────────────────────────────────────

const fitStyles = {
  competitive: { icon: CheckCircle2, className: "text-emerald-700 dark:text-emerald-400" },
  meets: { icon: CheckCircle2, className: "text-emerald-700 dark:text-emerald-400" },
  licensed: { icon: BadgeCheck, className: "text-[#003cbb] dark:text-[#4d82ff]" },
  below: { icon: Info, className: "text-amber-700 dark:text-amber-400" },
  unknown: { icon: Info, className: "text-gray-500 dark:text-gray-400" },
} as const;

function FitLine({ career, cgpa, className }: { career: RankedCareer; cgpa: number | null; className?: string }) {
  const message = fitMessage(career, cgpa);
  if (!message) return null;
  const { icon: Icon, className: tone } = fitStyles[career.fit];
  return (
    <p className={cn("flex items-start gap-1.5 text-[12px] leading-snug", tone, className)}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-px" />
      <span>{message}</span>
    </p>
  );
}

function Certifications({ items, limit }: { items: string[]; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((cert) => (
        <li
          key={cert}
          className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
        >
          {cert}
        </li>
      ))}
    </ul>
  );
}

// ─── Career details pop-up ──────────────────────────────────────────────────

function CareerDetailsModal({
  career,
  isClosestMatch,
  cgpa,
  programme,
  salaryBasis,
  onClose,
  onOpenSimulator,
}: {
  career: RankedCareer;
  isClosestMatch: boolean;
  cgpa: number | null;
  programme: string;
  salaryBasis: string;
  onClose: () => void;
  onOpenSimulator: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div
        role="dialog"
        aria-label={career.title}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#eaf0ff] dark:bg-[#003cbb]/20 flex items-center justify-center shrink-0">
              <BriefcaseBusiness className="w-5 h-5 text-[#003cbb] dark:text-[#4d82ff]" />
            </div>
            <div className="min-w-0">
              {isClosestMatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#003cbb] dark:text-[#4d82ff] mb-1">
                  <Star className="w-3 h-3" fill="currentColor" />
                  Your closest match
                </span>
              )}
              <h2 className="text-[18px] font-bold text-gray-900 dark:text-gray-100 leading-snug">{career.title}</h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">For {programme} graduates</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{career.summary}</p>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-[12px] font-medium text-gray-500 dark:text-gray-400">Typical salary in Nigeria</p>
            <p className="text-[20px] font-bold text-gray-900 dark:text-gray-100 mt-0.5 tabular-nums">
              {formatSalaryRange(career.salary)}
              <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400"> / month</span>
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">From entry level to experienced, before tax.</p>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-1.5">Your CGPA</h3>
            <FitLine career={career} cgpa={cgpa} className="text-[13px]" />
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-gray-900 dark:text-gray-100 mb-2">
              <ShieldCheck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              Certifications that seal the deal
            </h3>
            <Certifications items={career.certifications} />
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">{salaryBasis}</p>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          {career.fit !== "licensed" && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                onOpenSimulator();
              }}
              className="h-10 rounded-[10px] px-4 text-[13px] font-semibold gap-1.5 border-[#ccdaf9] dark:border-blue-900/60 text-[#003cbb] dark:text-[#4d82ff] hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Target className="w-4 h-4" />
              Simulate my CGPA
            </Button>
          )}
          <Button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[10px] px-5 text-[13px] font-semibold bg-[#003cbb] hover:bg-[#002e8f] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AcademicAlerts() {
  const [profile, setProfile] = useState<UMISResponse | null>(null);
  const [careerPaths, setCareerPaths] = useState<CareerPathsResult | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<RankedCareer | null>(null);
  const [isGpaSimulatorOpen, setIsGpaSimulatorOpen] = useState(false);

  const userData = useUserData();

  useEffect(() => {
    getStudentProfileAction().then(setProfile);
  }, []);

  // null until results are published: no made-up CGPA
  const rawCgpa =
    userData?.user_data?.academic_information?.cummulative_gpa ??
    userData?.user_data?.cummulative_gpa ??
    profile?.user_data?.academic_information?.cummulative_gpa ??
    profile?.user_data?.cummulative_gpa ??
    null;
  const cgpa = rawCgpa === null || rawCgpa === undefined || isNaN(Number(rawCgpa)) ? null : Number(rawCgpa);

  const degreeName = userData?.user_data?.degree_name ?? profile?.user_data?.degree_name ?? null;
  const department = userData?.user_data?.department ?? profile?.user_data?.department ?? null;

  useEffect(() => {
    let cancelled = false;
    getCareerPathsAction(degreeName, department, cgpa)
      .then((result) => !cancelled && setCareerPaths(result))
      .catch(() => !cancelled && setCareerPaths(null));
    return () => {
      cancelled = true;
    };
  }, [degreeName, department, cgpa]);

  // The API's degree name can stop at "B.A (Hons) Bachelor of"; prefer the matched programme
  const programmeLabel =
    careerPaths?.programme ??
    (degreeName && department && !degreeName.toLowerCase().includes(department.toLowerCase())
      ? `${degreeName} ${department}`.replace(/\s+/g, " ").trim()
      : degreeName || department || "your programme");

  const status = (() => {
    if (cgpa === null) {
      return {
        title: "No CGPA yet",
        description: "Your standing will appear here once your first results are published.",
        icon: Info,
        iconColor: "text-gray-500 dark:text-gray-400",
        bgClass: "bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800",
      };
    }
    if (cgpa >= 4.5) {
      return {
        title: "First Class Standing!",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. Outstanding performance! You are on track for First Class Honours. Keep pushing!`,
        icon: CheckCircle2,
        iconColor: "text-[#2d9f75] dark:text-[#34d399]",
        bgClass: "bg-[#f0fdf4] dark:bg-[#12B76A]/10 border-[#bbf7d0]/30 dark:border-[#12B76A]/20",
      };
    }
    if (cgpa >= 3.5) {
      return {
        title: "Second Class Upper Standing!",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. Excellent progress! Focus on high-unit core courses this semester to target First Class honours.`,
        icon: CheckCircle2,
        iconColor: "text-[#003cbb] dark:text-[#4d82ff]",
        bgClass: "bg-[#f0f9ff] dark:bg-[#003cbb]/10 border-[#bae6fd]/30 dark:border-[#003cbb]/20",
      };
    }
    if (cgpa >= 2.0) {
      return {
        title: "Good Academic Standing",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. You are maintaining good standing. Use the GPA Simulator to plan your target grades.`,
        icon: Info,
        iconColor: "text-amber-500 dark:text-amber-400",
        bgClass: "bg-[#fffbeb] dark:bg-amber-500/10 border-[#fef3c7]/30 dark:border-amber-500/20",
      };
    }
    return {
      title: "Academic Warning / Under Probation",
      description: `Your current CGPA is ${cgpa.toFixed(2)}. Your academic standing requires immediate attention. Please contact your departmental advisor.`,
      icon: AlertTriangle,
      iconColor: "text-red-500 dark:text-red-400",
      bgClass: "bg-[#fef2f2] dark:bg-red-500/10 border-[#fee2e2]/30 dark:border-red-500/20",
    };
  })();
  const StatusIcon = status.icon;

  const [closest, ...others] = careerPaths?.careers ?? [];

  return (
    <>
      <Card className="@container rounded-[20px] border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
        <CardContent className="p-5 md:p-6 flex flex-col gap-5">
          {/* Card Header */}
          <div>
            <h3 className="text-[18px] font-bold text-[#111827] dark:text-gray-100 mb-1">Academic Alerts & Insight</h3>
            <p className="text-[12px] text-[#4b5563] dark:text-gray-400">
              Your standing, and the careers your programme can lead to
            </p>
          </div>

          {/* Standing */}
          <div className={`${status.bgClass} border rounded-[16px] p-4 flex gap-3 items-start transition-colors duration-200`}>
            <StatusIcon className={`w-5 h-5 ${status.iconColor} shrink-0 mt-0.5`} strokeWidth={2.5} />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[13px] font-bold text-[#111827] dark:text-gray-100">{status.title}</h4>
              <p className="text-[12px] text-[#4b5563] dark:text-gray-300 leading-relaxed">{status.description}</p>
            </div>
          </div>

          {/* What you can become */}
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2.5">
              <div className="min-w-0 flex-1 basis-[220px]">
                <p className="text-[12px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  What you can become
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed text-pretty">
                  Careers for <span className="font-semibold text-gray-800 dark:text-gray-200">{programmeLabel}</span> graduates
                  {cgpa !== null && <>, matched to your {cgpa.toFixed(2)} CGPA</>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGpaSimulatorOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap text-[#003cbb] dark:text-[#4d82ff] hover:text-[#002e8f] dark:hover:text-[#6da0ff] bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40 transition-colors shrink-0"
                title="See how your grades this semester change your CGPA"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Simulate CGPA</span>
              </button>
            </div>

            {!careerPaths ? (
              // Loading
              <div className="flex flex-col gap-2.5" aria-hidden>
                <div className="h-[168px] rounded-[16px] bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                <div className="h-14 rounded-[14px] bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                <div className="h-14 rounded-[14px] bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
              </div>
            ) : (
              <>
                {/* Closest match */}
                {closest && (
                  <button
                    type="button"
                    onClick={() => setSelectedCareer(closest)}
                    className="group text-left rounded-[16px] border border-[#ccdaf9] dark:border-[#003cbb]/40 bg-[#f5f8ff] dark:bg-[#003cbb]/10 p-4 hover:border-[#003cbb]/60 dark:hover:border-[#4d82ff]/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#003cbb] dark:text-[#4d82ff]">
                          <Star className="w-3 h-3" fill="currentColor" />
                          Your closest match
                        </span>
                        <h4 className="text-[16px] font-bold text-gray-900 dark:text-gray-100 leading-snug mt-0.5">
                          {closest.title}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                    <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed mt-1">{closest.summary}</p>

                    <p className="mt-3 text-[18px] font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                      {formatSalaryRange(closest.salary)}
                      <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400"> / month</span>
                    </p>
                    <FitLine career={closest} cgpa={cgpa} className="mt-1.5" />

                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3 mb-1.5">
                      Certifications to get
                    </p>
                    <Certifications items={closest.certifications} limit={3} />
                  </button>
                )}

                {/* Other paths */}
                {others.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">
                      Other paths
                    </p>
                    {others.map((career) => (
                      <button
                        type="button"
                        key={career.id}
                        onClick={() => setSelectedCareer(career)}
                        className="group flex items-center justify-between gap-3 rounded-[14px] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-3 text-left hover:border-[#003cbb]/40 dark:hover:border-[#4d82ff]/40 hover:bg-white dark:hover:bg-gray-800/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                            <BriefcaseBusiness className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[13px] font-semibold leading-snug text-gray-900 dark:text-gray-100 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] transition-colors">
                              {career.title}
                            </span>
                            <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 tabular-nums">
                              {formatSalaryRange(career.salary)} / month
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                  Salaries are typical monthly pay in Nigeria before tax, from entry level to experienced.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedCareer && careerPaths && (
        <CareerDetailsModal
          career={selectedCareer}
          isClosestMatch={selectedCareer.id === closest?.id}
          cgpa={cgpa}
          programme={programmeLabel}
          salaryBasis={careerPaths.salaryBasis}
          onClose={() => setSelectedCareer(null)}
          onOpenSimulator={() => setIsGpaSimulatorOpen(true)}
        />
      )}

      <GPAWhatIfSimulator isOpen={isGpaSimulatorOpen} onClose={() => setIsGpaSimulatorOpen(false)} />
    </>
  );
}
