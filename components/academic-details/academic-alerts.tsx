"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Info, AlertTriangle, BriefcaseBusiness } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getStudentProfileAction } from "@/app/actions/user";
import type { UMISResponse } from "@/lib/session";
import { cn } from "@/lib/utils";

// ─── Career Path Engine ──────────────────────────────────────────────────────

interface CareerPath {
  title: string;
  avgSalary: string;
  growth: string;
  match: "Excellent" | "Strong" | "Good";
  skills: string[];
  color: string;
}

function deriveCareerPaths(programme: string, cgpa: number): CareerPath[] {
  const prog = programme.toLowerCase();
  const gpa = cgpa;

  if (
    prog.includes("computer") ||
    prog.includes("information technology") ||
    prog.includes("software") ||
    prog.includes("computing")
  ) {
    return [
      {
        title: "Software Engineering / Full-Stack",
        avgSalary: "$110k – $185k",
        growth: "+25% by 2030",
        match: gpa >= 4.0 ? "Excellent" : "Strong",
        skills: ["React", "System Design", "Cloud", "APIs"],
        color: "from-blue-500 to-indigo-600",
      },
      {
        title: "Machine Learning / AI Engineer",
        avgSalary: "$130k – $220k",
        growth: "+40% by 2030",
        match: gpa >= 4.2 ? "Excellent" : gpa >= 3.5 ? "Strong" : "Good",
        skills: ["Python", "LLMs", "MLOps", "Statistics"],
        color: "from-violet-500 to-purple-600",
      },
      {
        title: "Cybersecurity Engineer",
        avgSalary: "$100k – $160k",
        growth: "+33% by 2030",
        match: "Strong",
        skills: ["Pen Testing", "SIEM", "Cloud Security", "Zero Trust"],
        color: "from-rose-500 to-pink-600",
      },
    ];
  }

  if (
    prog.includes("engineering") ||
    prog.includes("civil") ||
    prog.includes("mechanical") ||
    prog.includes("electrical")
  ) {
    return [
      {
        title: "Petroleum / Energy Engineer",
        avgSalary: "$115k – $190k",
        growth: "+8% by 2030",
        match: gpa >= 4.0 ? "Excellent" : "Strong",
        skills: ["Reservoir Sim", "AutoCAD", "Project Mgmt", "HSSE"],
        color: "from-amber-500 to-orange-600",
      },
      {
        title: "Data / Systems Engineer",
        avgSalary: "$105k – $170k",
        growth: "+22% by 2030",
        match: gpa >= 3.8 ? "Excellent" : "Strong",
        skills: ["Python", "SQL", "PLC/SCADA", "ETL"],
        color: "from-blue-500 to-cyan-600",
      },
      {
        title: "Infrastructure Consultant",
        avgSalary: "$90k – $145k",
        growth: "+11% by 2030",
        match: "Strong",
        skills: ["Structural Analysis", "BIM/Revit", "Project Finance", "AutoCAD"],
        color: "from-emerald-500 to-teal-600",
      },
    ];
  }

  if (
    prog.includes("medicine") ||
    prog.includes("pharmacy") ||
    prog.includes("nursing") ||
    prog.includes("health") ||
    prog.includes("medical")
  ) {
    return [
      {
        title: "Specialist Physician / Surgeon",
        avgSalary: "$200k – $400k",
        growth: "+13% by 2030",
        match: gpa >= 4.2 ? "Excellent" : gpa >= 3.5 ? "Strong" : "Good",
        skills: ["Clinical Skills", "Diagnostics", "Surgery", "Research"],
        color: "from-red-500 to-rose-600",
      },
      {
        title: "Clinical / Pharma Research",
        avgSalary: "$95k – $160k",
        growth: "+17% by 2030",
        match: "Strong",
        skills: ["Pharmacokinetics", "GCP/GMP", "Data Analysis", "Regulatory"],
        color: "from-green-500 to-emerald-600",
      },
      {
        title: "Health-Tech Entrepreneur",
        avgSalary: "$120k – $250k+",
        growth: "+30% by 2030",
        match: gpa >= 3.8 ? "Strong" : "Good",
        skills: ["Product Mgmt", "HL7/FHIR", "AI/ML", "Strategy"],
        color: "from-violet-500 to-indigo-600",
      },
    ];
  }

  if (prog.includes("law")) {
    return [
      {
        title: "Corporate / M&A Lawyer",
        avgSalary: "$150k – $300k",
        growth: "+10% by 2030",
        match: gpa >= 4.2 ? "Excellent" : gpa >= 3.5 ? "Strong" : "Good",
        skills: ["Contract Drafting", "M&A Due Diligence", "Capital Markets", "Arbitration"],
        color: "from-slate-600 to-gray-700",
      },
      {
        title: "IP / Technology Lawyer",
        avgSalary: "$120k – $220k",
        growth: "+18% by 2030",
        match: "Strong",
        skills: ["Patent Law", "Tech Licensing", "Litigation", "Negotiation"],
        color: "from-blue-600 to-indigo-700",
      },
      {
        title: "FinTech Compliance Officer",
        avgSalary: "$100k – $175k",
        growth: "+23% by 2030",
        match: "Good",
        skills: ["AML/KYC", "Reg Frameworks", "Risk Mgmt", "FinTech Law"],
        color: "from-amber-500 to-yellow-600",
      },
    ];
  }

  if (
    prog.includes("business") ||
    prog.includes("economics") ||
    prog.includes("finance") ||
    prog.includes("accounting") ||
    prog.includes("management")
  ) {
    return [
      {
        title: "Investment Banking / Private Equity",
        avgSalary: "$150k – $350k+",
        growth: "+12% by 2030",
        match: gpa >= 4.2 ? "Excellent" : gpa >= 3.8 ? "Strong" : "Good",
        skills: ["Financial Modelling", "Valuation", "LBO Analysis", "Deal Execution"],
        color: "from-green-500 to-emerald-600",
      },
      {
        title: "Data / Business Intelligence Lead",
        avgSalary: "$95k – $155k",
        growth: "+28% by 2030",
        match: "Strong",
        skills: ["SQL/Python", "Power BI", "Statistics", "Strategy"],
        color: "from-blue-500 to-cyan-600",
      },
      {
        title: "Strategy Consultant (Big 3 / Big 4)",
        avgSalary: "$120k – $250k",
        growth: "+14% by 2030",
        match: gpa >= 4.0 ? "Excellent" : "Strong",
        skills: ["Problem Solving", "Slide Decks", "Client Mgmt", "Research"],
        color: "from-violet-500 to-purple-600",
      },
    ];
  }

  // Fallback
  return [
    {
      title: "Product Management",
      avgSalary: "$110k – $180k",
      growth: "+19% by 2030",
      match: gpa >= 3.8 ? "Strong" : "Good",
      skills: ["Roadmapping", "User Research", "Agile", "Analytics"],
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Startup Founder / Entrepreneurship",
      avgSalary: "Equity-based",
      growth: "Unlimited",
      match: "Good",
      skills: ["Leadership", "Sales", "Finance", "Product"],
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Digital Marketing / Growth Lead",
      avgSalary: "$80k – $140k",
      growth: "+15% by 2030",
      match: "Good",
      skills: ["SEO/SEM", "Analytics", "Content", "Performance Mkt."],
      color: "from-pink-500 to-rose-600",
    },
  ];
}

const matchColors = {
  Excellent:
    "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
  Strong:
    "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-[#4d82ff] border-blue-200 dark:border-blue-900/40",
  Good: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AcademicAlerts() {
  const [profile, setProfile] = useState<UMISResponse | null>(null);

  useEffect(() => {
    getStudentProfileAction().then(setProfile);
  }, []);

  const cgpa =
    profile?.user_data?.cummulative_gpa ??
    profile?.user_data?.academic_information?.cummulative_gpa ??
    3.67;

  const rawDegree = profile?.user_data?.degree_name ?? "";
  const department = profile?.user_data?.department ?? "Software Engineering";
  const programme = rawDegree || department;

  const getCgpaStatus = () => {
    if (cgpa >= 4.5) {
      return {
        title: "First Class Standing!",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. Outstanding performance! You are on track for First Class Honours. Keep pushing!`,
        icon: CheckCircle2,
        iconColor: "text-[#2d9f75] dark:text-[#34d399]",
        bgClass:
          "bg-[#f0fdf4] dark:bg-[#12B76A]/10 border-[#bbf7d0]/30 dark:border-[#12B76A]/20",
      };
    }
    if (cgpa >= 3.5) {
      return {
        title: "Second Class Upper Standing!",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. Excellent progress! Focus on high-unit core courses this semester to target First Class honours.`,
        icon: CheckCircle2,
        iconColor: "text-[#003cbb] dark:text-[#4d82ff]",
        bgClass:
          "bg-[#f0f9ff] dark:bg-[#003cbb]/10 border-[#bae6fd]/30 dark:border-[#003cbb]/20",
      };
    }
    if (cgpa >= 2.0) {
      return {
        title: "Good Academic Standing",
        description: `Your current CGPA is ${cgpa.toFixed(2)}. You are maintaining good standing. Use the GPA Simulator to plan your target grades.`,
        icon: Info,
        iconColor: "text-amber-500 dark:text-amber-400",
        bgClass:
          "bg-[#fffbeb] dark:bg-amber-500/10 border-[#fef3c7]/30 dark:border-amber-500/20",
      };
    }
    return {
      title: "Academic Warning / Under Probation",
      description: `Your current CGPA is ${cgpa.toFixed(2)}. Your academic standing requires immediate attention. Please contact your departmental advisor.`,
      icon: AlertTriangle,
      iconColor: "text-red-500 dark:text-red-400",
      bgClass:
        "bg-[#fef2f2] dark:bg-red-500/10 border-[#fee2e2]/30 dark:border-red-500/20",
    };
  };

  const status = getCgpaStatus();
  const StatusIcon = status.icon;
  const careerPaths = deriveCareerPaths(programme, cgpa);

  return (
    <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
      <CardContent className="p-5 md:p-6 flex flex-col gap-5">
        <div>
          <h3 className="text-[18px] font-bold text-[#111827] dark:text-gray-100 mb-1">
            Academic Alerts & Insight
          </h3>
          <p className="text-[12px] text-[#4b5563] dark:text-gray-400">
            Standing alert and recommended high-income career paths for your programme
          </p>
        </div>

        {/* Dynamic Status Alert */}
        <div
          className={`${status.bgClass} border rounded-[16px] p-4 flex gap-3 items-start transition-colors duration-200`}
        >
          <StatusIcon
            className={`w-5 h-5 ${status.iconColor} shrink-0 mt-0.5`}
            strokeWidth={2.5}
          />
          <div className="flex flex-col gap-0.5">
            <h4 className="text-[13px] font-bold text-[#111827] dark:text-gray-100">
              {status.title}
            </h4>
            <p className="text-[12px] text-[#4b5563] dark:text-gray-300 leading-relaxed">
              {status.description}
            </p>
          </div>
        </div>

        {/* Career Paths */}
        <div>
          <p className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Recommended Career Paths
          </p>
          <div className="flex flex-col gap-2">
            {careerPaths.map((path, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 px-3.5 py-3 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center shrink-0`}>
                    <BriefcaseBusiness className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100">
                    {path.title}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0",
                  matchColors[path.match]
                )}>
                  {path.match}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
