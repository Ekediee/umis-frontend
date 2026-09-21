"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  BriefcaseBusiness, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  X, 
  Target, 
  Award, 
  BookOpen, 
  ShieldCheck 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentProfileAction } from "@/app/actions/user";
import { useUserData } from "@/contexts/user-data-context";
import { GPAWhatIfSimulator } from "@/components/academic-details/gpa-what-if-simulator";
import type { UMISResponse } from "@/lib/session";
import { cn } from "@/lib/utils";

// ─── Career Path Engine ──────────────────────────────────────────────────────

export interface CareerPath {
  id: string;
  title: string;
  avgSalary: string;
  growth: string;
  match: "Excellent" | "Strong" | "Good" | "Opportunity";
  matchScore: number;
  badgeLabel: string;
  skills: string[];
  certifications: string[];
  aiRationale: string;
  cgpaBenchmark: string;
  cgpaStatus: "cleared" | "target" | "skills-first";
  actionSteps: string[];
  color: string;
}

export function deriveCareerPaths(programme: string, cgpa: number): CareerPath[] {
  const prog = (programme || "").toLowerCase();
  const gpa = Number(cgpa) || 3.5;
  const isFirstClass = gpa >= 4.5;
  const isSecondClassUpper = gpa >= 3.5 && gpa < 4.5;
  const isSecondClassLower = gpa >= 2.5 && gpa < 3.5;
  const gpaStr = gpa.toFixed(2);

  // 1. Computing, Software & IT
  if (
    prog.includes("computer") ||
    prog.includes("information technology") ||
    prog.includes("software") ||
    prog.includes("computing") ||
    prog.includes("cyber") ||
    prog.includes("data") ||
    prog.includes("cis")
  ) {
    if (isFirstClass) {
      return [
        {
          id: "cs-ai-research",
          title: "AI Research Scientist / ML Architect",
          avgSalary: "$145k – $240k",
          growth: "+40% by 2030",
          match: "Excellent",
          matchScore: 98,
          badgeLabel: "First Class Advantage",
          skills: ["PyTorch / JAX", "LLM Fine-Tuning", "Distributed Training", "Algorithmic Complexity"],
          certifications: ["AWS Certified ML Specialist", "TensorFlow Developer", "NVIDIA Deep Learning Institute"],
          aiRationale: `Your outstanding ${gpaStr} CGPA places you in the top 5% of your cohort, unlocking direct admission to funded international Master's/Ph.D. research fellowships and frontier AI labs (Google DeepMind, OpenAI, Microsoft Research).`,
          cgpaBenchmark: "Top 5% Cutoff: ≥ 4.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Co-author an academic research paper or workshop submission with departmental faculty.",
            "Contribute to high-impact open-source machine learning repositories (HuggingFace, vLLM).",
            "Prepare applications for competitive postgraduate fellowships (Rhodes, Chevening, Fulbright)."
          ],
          color: "from-violet-600 to-indigo-700",
        },
        {
          id: "cs-fullstack-arch",
          title: "Senior Software Systems Architect",
          avgSalary: "$130k – $210k",
          growth: "+28% by 2030",
          match: "Excellent",
          matchScore: 95,
          badgeLabel: "Tier-1 Tech Trainee",
          skills: ["Distributed Systems", "Kubernetes", "Event-Driven Microservices", "Go / Rust"],
          certifications: ["AWS Solutions Architect Pro", "CSPA / TOGAF", "Kubernetes Administrator (CKA)"],
          aiRationale: `With a ${gpaStr} First Class standing, you bypass preliminary hiring filters at top-tier global multinationals and high-frequency fintech firms.`,
          cgpaBenchmark: "Global Cutoff: ≥ 4.00 (Exceeded)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Build a production-grade distributed key-value store or Raft consensus protocol implementation.",
            "Complete 150+ LeetCode Hard/Medium system algorithms.",
            "Apply for elite Global Engineering Fellowships."
          ],
          color: "from-blue-600 to-cyan-600",
        },
        {
          id: "cs-quant-dev",
          title: "Quantitative Systems Developer",
          avgSalary: "$160k – $320k+",
          growth: "+22% by 2030",
          match: "Strong",
          matchScore: 91,
          badgeLabel: "High Quantitative Rigour",
          skills: ["C++20", "Low-Latency Networks", "Statistical Modeling", "Market Microstructure"],
          certifications: ["CQF (Certificate in Quantitative Finance)", "C++ Certified Professional"],
          aiRationale: `Proprietary trading firms heavily screen by university GPA. Your ${gpaStr} record meets the highest standards for algorithmic execution desks.`,
          cgpaBenchmark: "Hedge Fund Cutoff: ≥ 4.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Master advanced multivariate statistics and stochastic calculus.",
            "Backtest trading strategies on historical tick datasets using C++ and Python.",
            "Participate in international algorithmic coding contests (ICPC, Codeforces)."
          ],
          color: "from-amber-600 to-emerald-700",
        },
      ];
    }

    if (isSecondClassUpper) {
      return [
        {
          id: "cs-cloud-fullstack",
          title: "Full-Stack Software Engineer",
          avgSalary: "$105k – $175k",
          growth: "+25% by 2030",
          match: "Excellent",
          matchScore: 94,
          badgeLabel: "2:1 Optimal Benchmark",
          skills: ["Next.js / TypeScript", "GraphQL / REST APIs", "PostgreSQL", "Cloud Native (AWS/GCP)"],
          certifications: ["AWS Certified Developer", "Meta Professional Full-Stack", "Docker Certified Associate"],
          aiRationale: `Your ${gpaStr} CGPA firmly positions you in the competitive 2:1 upper-tier, fully meeting graduate recruitment criteria for tier-1 tech firms (Microsoft, Amazon, Paystack, Flutterwave).`,
          cgpaBenchmark: "Graduate Screening: ≥ 3.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Deploy two full-stack SaaS capstones with authentication, stripe/paystack billing, and CI/CD.",
            "Maintain core software course grades at A/B levels in your upcoming semester.",
            "Engage in tech community open-source sprints."
          ],
          color: "from-blue-500 to-indigo-600",
        },
        {
          id: "cs-cloud-devops",
          title: "Cloud DevOps & Platform Engineer",
          avgSalary: "$115k – $180k",
          growth: "+32% by 2030",
          match: "Strong",
          matchScore: 90,
          badgeLabel: "High Growth Track",
          skills: ["Terraform / IaC", "CI/CD Pipelines", "Docker / K8s", "Linux Systems"],
          certifications: ["AWS Certified Solutions Architect", "HashiCorp Certified Terraform", "CKA"],
          aiRationale: `Your strong academic standing combined with analytical coursework makes cloud infrastructure and automation a natural, highly lucrative specialization.`,
          cgpaBenchmark: "Corporate Cutoff: ≥ 3.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Build automated deployment infrastructure using Terraform and GitHub Actions.",
            "Set up observability dashboards with Prometheus and Grafana for simulated traffic.",
            "Target cloud engineering internships."
          ],
          color: "from-cyan-500 to-blue-700",
        },
        {
          id: "cs-cyber-analyst",
          title: "Cybersecurity & Security Engineer",
          avgSalary: "$100k – $165k",
          growth: "+33% by 2030",
          match: "Strong",
          matchScore: 88,
          badgeLabel: "High Demand Sector",
          skills: ["Penetration Testing", "SIEM & SOC", "Zero Trust Architecture", "Cloud Security"],
          certifications: ["CompTIA Security+", "Certified Ethical Hacker (CEH)", "AWS Security Specialty"],
          aiRationale: `Financial institutions and defense contractors prioritize candidates with solid academic standing and verifiable security competencies.`,
          cgpaBenchmark: "Fintech Cutoff: ≥ 3.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Practice vulnerability assessments on Hack The Box and TryHackMe platforms.",
            "Obtain CompTIA Security+ certification before graduation.",
            "Conduct departmental security audit case studies."
          ],
          color: "from-rose-500 to-purple-600",
        },
      ];
    }

    if (isSecondClassLower) {
      return [
        {
          id: "cs-practical-web",
          title: "Full-Stack Web & Mobile Developer",
          avgSalary: "$90k – $145k",
          growth: "+22% by 2030",
          match: "Strong",
          matchScore: 87,
          badgeLabel: "Skills-First Pathway",
          skills: ["React / React Native", "Node.js", "REST APIs", "Tailwind CSS"],
          certifications: ["Meta Frontend / Backend Certificate", "AWS Certified Cloud Practitioner"],
          aiRationale: `In modern software engineering, industry hiring for developers heavily weights verifiable GitHub commits, shipped applications, and live portfolio demonstrations over transcript grades.`,
          cgpaBenchmark: "Industry Focus: Portfolio & Shipped Apps",
          cgpaStatus: "skills-first",
          actionSteps: [
            "Publish 3 polished production applications to Vercel/Play Store with real active users.",
            "Contribute consistently to open-source software on GitHub.",
            "Pair with your academic advisor to push high-unit courses to 3.50+ standing."
          ],
          color: "from-blue-500 to-indigo-600",
        },
        {
          id: "cs-devops-ops",
          title: "DevOps & Site Reliability Specialist",
          avgSalary: "$95k – $150k",
          growth: "+28% by 2030",
          match: "Strong",
          matchScore: 84,
          badgeLabel: "Hands-On Certification Track",
          skills: ["Linux Admin", "Docker", "Shell Scripting", "GitHub Actions"],
          certifications: ["RHCSA (Red Hat System Administrator)", "AWS Cloud Practitioner"],
          aiRationale: `Infrastructure roles prioritize hands-on certification credentials and practical troubleshooting ability. Obtaining CKA or AWS certificates offsets academic GPA variance.`,
          cgpaBenchmark: "Benchmark: Technical Certifications",
          cgpaStatus: "skills-first",
          actionSteps: [
            "Build and maintain a personal homelab or cloud server cluster.",
            "Acquire the AWS Cloud Practitioner and Red Hat Linux certifications.",
            "Focus on grade recovery in upcoming semester core units."
          ],
          color: "from-teal-500 to-emerald-600",
        },
        {
          id: "cs-qa-automation",
          title: "QA Automation & Test Engineer",
          avgSalary: "$85k – $135k",
          growth: "+18% by 2030",
          match: "Good",
          matchScore: 82,
          badgeLabel: "High Industry Entry",
          skills: ["Playwright / Cypress", "Selenium", "API Testing (Postman)", "Python"],
          certifications: ["ISTQB Certified Tester", "Playwright Automation Certificate"],
          aiRationale: `QA Engineering serves as an exceptional on-ramp into high-paying tech companies with lower initial academic GPA barriers.`,
          cgpaBenchmark: "Benchmark: Hands-on Test Suites",
          cgpaStatus: "skills-first",
          actionSteps: [
            "Write end-to-end regression test suites for popular web applications.",
            "Complete the ISTQB Foundation Level certification.",
            "Target Quality Assurance graduate internships."
          ],
          color: "from-amber-500 to-orange-600",
        },
      ];
    }

    // CGPA < 2.50
    return [
      {
        id: "cs-portfolio-dev",
        title: "Frontend & UI/UX Developer",
        avgSalary: "$75k – $125k",
        growth: "+16% by 2030",
        match: "Opportunity",
        matchScore: 78,
        badgeLabel: "Portfolio-Driven Track",
        skills: ["HTML5/CSS3", "JavaScript", "React", "Figma to Code"],
        certifications: ["freeCodeCamp Full Stack", "Google UX Design Professional"],
        aiRationale: `Client and product agencies judge frontend developers entirely on visual portfolio and functional code. Focus heavily on demonstrable web assets while executing an academic rebound.`,
        cgpaBenchmark: `Target: Academic Rebound to ≥ 2.50 (Current: ${gpaStr})`,
        cgpaStatus: "target",
        actionSteps: [
          "Meet with your academic advisor to map retakes for deficient courses.",
          "Build an interactive personal portfolio showing 3 polished client clones.",
          "Engage in freelancing (Upwork, Fiverr) to build verifiable client testimonials."
        ],
        color: "from-amber-500 to-rose-600",
      },
      {
        id: "cs-it-support",
        title: "IT Systems & Helpdesk Specialist",
        avgSalary: "$60k – $95k",
        growth: "+10% by 2030",
        match: "Opportunity",
        matchScore: 75,
        badgeLabel: "Vocational Foundation",
        skills: ["Hardware Diagnostics", "Windows/Mac Admin", "Networking (TCP/IP)", "Active Directory"],
        certifications: ["CompTIA A+", "CompTIA Network+", "Google IT Support"],
        aiRationale: `Enterprise IT support offers immediate employment based on industry certifications, providing financial stability while strengthening your academic footing.`,
        cgpaBenchmark: `Target: Rebound to ≥ 2.50 (Current: ${gpaStr})`,
        cgpaStatus: "target",
        actionSteps: [
          "Complete the Google IT Support or CompTIA A+ certification.",
          "Prioritize attendance and continuous assessments in all remaining registered courses.",
          "Apply for on-campus student technician roles."
        ],
        color: "from-blue-600 to-slate-700",
      },
    ];
  }

  // 2. Engineering (Mechanical, Electrical, Civil, Mechatronics, Chemical, etc.)
  if (
    prog.includes("engineering") ||
    prog.includes("civil") ||
    prog.includes("mechanical") ||
    prog.includes("electrical") ||
    prog.includes("mechatronic") ||
    prog.includes("chemical")
  ) {
    if (isFirstClass) {
      return [
        {
          id: "eng-renewable-systems",
          title: "Energy & Renewable Systems Consultant",
          avgSalary: "$125k – $210k",
          growth: "+26% by 2030",
          match: "Excellent",
          matchScore: 97,
          badgeLabel: "First Class Merit",
          skills: ["Thermodynamic Modeling", "Smart Grid Tech", "MATLAB / Simulink", "AutoCAD / SolidWorks"],
          certifications: ["CEM (Certified Energy Manager)", "LEED Green Associate", "PE Exam (FE Stage)"],
          aiRationale: `Your ${gpaStr} First Class standing qualifies you for premier global energy engineering graduate training schemes (Shell, TotalEnergies, Siemens Energy) and international research fellowships.`,
          cgpaBenchmark: "Multinational Cutoff: ≥ 4.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Sit for the FE (Fundamentals of Engineering) international exam before graduation.",
            "Publish an undergraduate thesis on renewable grid optimization.",
            "Apply to international Energy Engineering Master's scholarships."
          ],
          color: "from-emerald-600 to-teal-700",
        },
        {
          id: "eng-robotics",
          title: "Robotics & Autonomous Systems Engineer",
          avgSalary: "$130k – $200k",
          growth: "+35% by 2030",
          match: "Excellent",
          matchScore: 94,
          badgeLabel: "High R&D Alignment",
          skills: ["ROS / ROS2", "Embedded C++", "Control Theory", "Computer Vision"],
          certifications: ["NVIDIA Robotics Certificate", "ARM Embedded Systems"],
          aiRationale: `Autonomous robotics requires deep mathematical and analytical foundations. Your stellar academic transcript validates your theoretical readiness.`,
          cgpaBenchmark: "Research Cutoff: ≥ 4.20 (Exceeded)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Build an autonomous robot prototype incorporating ROS and sensor fusion.",
            "Collaborate on robotics competitions (RoboCup, IEEE hardware challenges).",
            "Target graduate assistantships in leading Mechatronics labs."
          ],
          color: "from-blue-600 to-indigo-700",
        },
      ];
    }

    return [
      {
        id: "eng-mfg-engineer",
        title: "Industrial & Systems Operations Engineer",
        avgSalary: "$95k – $160k",
        growth: "+14% by 2030",
        match: isSecondClassUpper ? "Excellent" : "Strong",
        matchScore: isSecondClassUpper ? 92 : 86,
        badgeLabel: isSecondClassUpper ? "2:1 Benchmark Met" : "Skills-First",
        skills: ["SolidWorks / AutoCAD", "Six Sigma / Lean", "PLC Programming", "Project Management"],
        certifications: ["Six Sigma Green Belt", "AutoCAD Certified Professional", "PMP / CAPM"],
        aiRationale: `Your ${gpaStr} CGPA in Engineering qualifies you for competitive industrial operations roles where manufacturing efficiency and CAD mastery drive high salaries.`,
        cgpaBenchmark: isSecondClassUpper ? "Cutoff: ≥ 3.50 (Cleared)" : "Benchmark: CAD & Lean Certs",
        cgpaStatus: isSecondClassUpper ? "cleared" : "skills-first",
        actionSteps: [
          "Complete Six Sigma Green Belt certification.",
          "Build a portfolio of 3D CAD mechanical simulations.",
          "Target internships at major FMCG and industrial manufacturing plants."
        ],
        color: "from-amber-600 to-orange-700",
      },
      {
        id: "eng-tech-consultant",
        title: "Technical Infrastructure Consultant",
        avgSalary: "$90k – $155k",
        growth: "+18% by 2030",
        match: "Strong",
        matchScore: 89,
        badgeLabel: "Consulting Track",
        skills: ["Feasibility Analysis", "BIM (Revit)", "Cost Estimation", "Client Management"],
        certifications: ["BIM Certified Professional", "Prince2 / Agile PM"],
        aiRationale: `Infrastructure consulting firms look for engineers who can translate technical designs into financial and regulatory feasibility.`,
        cgpaBenchmark: "Cutoff: ≥ 3.50",
        cgpaStatus: isSecondClassUpper ? "cleared" : "skills-first",
        actionSteps: [
          "Master Autodesk Revit and building information modeling standards.",
          "Participate in student engineering management case competitions.",
          "Complete project management credentials."
        ],
        color: "from-blue-500 to-teal-600",
      },
    ];
  }

  // 3. Business, Finance & Economics
  if (
    prog.includes("business") ||
    prog.includes("economics") ||
    prog.includes("finance") ||
    prog.includes("accounting") ||
    prog.includes("banking") ||
    prog.includes("management") ||
    prog.includes("marketing")
  ) {
    if (isFirstClass) {
      return [
        {
          id: "biz-ib-pe",
          title: "Investment Banking & Private Equity Analyst",
          avgSalary: "$140k – $280k+",
          growth: "+14% by 2030",
          match: "Excellent",
          matchScore: 98,
          badgeLabel: "Wall Street / Tier-1 Bank Ready",
          skills: ["LBO & DCF Valuation", "Financial Modeling", "M&A Due Diligence", "Capital Markets"],
          certifications: ["CFA Level 1 Candidate", "Financial Modeling & Valuation Analyst (FMVA)"],
          aiRationale: `Investment banking and private equity firms use university GPA as an unforgiving primary filter. Your ${gpaStr} First Class standing clears top-bracket criteria (Goldman Sachs, J.P. Morgan, Chapel Hill Denham).`,
          cgpaBenchmark: "Top Tier Cutoff: ≥ 4.50 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Complete a 3-statement dynamic financial model with sensitivity tables.",
            "Register for the CFA Level 1 exam in your final year.",
            "Network with alumni in bulge-bracket investment banks."
          ],
          color: "from-emerald-600 to-teal-700",
        },
        {
          id: "biz-strategy-consultant",
          title: "Management & Strategy Consultant (MBB)",
          avgSalary: "$130k – $220k",
          growth: "+16% by 2030",
          match: "Excellent",
          matchScore: 95,
          badgeLabel: "MBB Screening Cutoff",
          skills: ["Case Cracking", "Market Sizing", "Executive Presentations", "Strategic Analytics"],
          certifications: ["Case Interview Preparation", "Excel Advanced Analytics"],
          aiRationale: `Leading management consultancies (McKinsey, BCG, Bain) prioritize top academic deciles. Your ${gpaStr} record puts your resume directly into the interview round.`,
          cgpaBenchmark: "Consulting Cutoff: ≥ 4.20 (Cleared)",
          cgpaStatus: "cleared",
          actionSteps: [
            "Practice 40+ case interview frameworks with consulting club peers.",
            "Compete in international university business case competitions.",
            "Prepare your leadership CV for early recruitment cycles."
          ],
          color: "from-blue-600 to-indigo-800",
        },
      ];
    }

    return [
      {
        id: "biz-fintech-analyst",
        title: "FinTech Product & Financial Analyst",
        avgSalary: "$95k – $165k",
        growth: "+24% by 2030",
        match: isSecondClassUpper ? "Excellent" : "Strong",
        matchScore: isSecondClassUpper ? 93 : 86,
        badgeLabel: isSecondClassUpper ? "2:1 Trainee Ready" : "Skills-First",
        skills: ["SQL / Power BI", "Financial Modeling", "Unit Economics", "Regulatory Compliance"],
        certifications: ["FMVA (CFI)", "Microsoft Power BI Data Analyst", "ACCA Foundation"],
        aiRationale: `Your ${gpaStr} CGPA provides strong credibility for corporate financial analyst roles and high-growth fintech startups evaluating business intelligence and unit economics.`,
        cgpaBenchmark: isSecondClassUpper ? "Corporate Cutoff: ≥ 3.50 (Cleared)" : "Benchmark: SQL & FMVA Certs",
        cgpaStatus: isSecondClassUpper ? "cleared" : "skills-first",
        actionSteps: [
          "Build an interactive Power BI financial dashboard analyzing publicly traded equities.",
          "Complete the Financial Modeling and Valuation Analyst (FMVA) program.",
          "Target summer finance trainee programs."
        ],
        color: "from-green-600 to-emerald-700",
      },
      {
        id: "biz-product-lead",
        title: "Product Manager (Commercial & Growth)",
        avgSalary: "$105k – $170k",
        growth: "+20% by 2030",
        match: "Strong",
        matchScore: 90,
        badgeLabel: "High Cross-Functional Demand",
        skills: ["Go-To-Market (GTM)", "User Discovery", "A/B Testing", "Agile / Scrum"],
        certifications: ["Product School PMC", "Scrum Product Owner (CSPO)"],
        aiRationale: `Your business foundation equips you to bridge customer pain points with commercial viability, a core requirement in high-growth digital product teams.`,
        cgpaBenchmark: "Cutoff: ≥ 3.50 (Cleared)",
        cgpaStatus: isSecondClassUpper ? "cleared" : "skills-first",
        actionSteps: [
          "Author a teardown document of a consumer mobile app identifying conversion bottlenecks.",
          "Obtain an Agile Scrum Product Owner certification.",
          "Participate in hackathons as the business & product lead."
        ],
        color: "from-blue-500 to-indigo-600",
      },
    ];
  }

  // 4. Medicine, Nursing & Health Sciences
  if (
    prog.includes("medicine") ||
    prog.includes("pharmacy") ||
    prog.includes("nursing") ||
    prog.includes("health") ||
    prog.includes("medical") ||
    prog.includes("anatomy") ||
    prog.includes("physiology")
  ) {
    return [
      {
        id: "med-clinical-specialist",
        title: "Clinical Specialist & Medical Fellow",
        avgSalary: "$160k – $320k+",
        growth: "+14% by 2030",
        match: isFirstClass || isSecondClassUpper ? "Excellent" : "Strong",
        matchScore: isFirstClass ? 98 : 92,
        badgeLabel: isFirstClass ? "Residency Distinction" : "Clinical Track",
        skills: ["Diagnostic Acumen", "Evidence-Based Medicine", "Clinical Trials", "Patient Care"],
        certifications: ["BLS / ACLS", "USMLE / PLAB Step Prep", "Good Clinical Practice (GCP)"],
        aiRationale: `Your academic profile (${gpaStr}) provides the high standard required for competitive residency match programs and clinical research fellowships.`,
        cgpaBenchmark: "Residency Benchmark: ≥ 3.50+",
        cgpaStatus: "cleared",
        actionSteps: [
          "Complete BLS and Advanced Cardiac Life Support credentials.",
          "Engage in hospital clinical rotations and audit case studies.",
          "Prepare for international medical licensure exams."
        ],
        color: "from-red-500 to-rose-600",
      },
      {
        id: "med-healthtech",
        title: "HealthTech & Digital Health Innovator",
        avgSalary: "$110k – $190k",
        growth: "+32% by 2030",
        match: "Strong",
        matchScore: 89,
        badgeLabel: "High Growth Frontier",
        skills: ["Health Informatics (HL7/FHIR)", "Telemedicine Operations", "Clinical Validation", "Bio-Ethics"],
        certifications: ["Health Informatics Specialist", "Certified Health Data Analyst"],
        aiRationale: `Bridging clinical domain knowledge with digital healthcare platforms is among the fastest growing, highest-funded sectors in tech globally.`,
        cgpaBenchmark: "Benchmark: Clinical + Tech Portfolio",
        cgpaStatus: "skills-first",
        actionSteps: [
          "Explore electronic health record systems and FHIR data standards.",
          "Conduct research on AI-assisted triage models in low-resource settings.",
          "Network with healthcare incubator accelerators."
        ],
        color: "from-teal-600 to-cyan-700",
      },
    ];
  }

  // 5. Law & Legal Studies
  if (prog.includes("law") || prog.includes("legal") || prog.includes("juris")) {
    return [
      {
        id: "law-corporate-ma",
        title: "Corporate M&A & Securities Lawyer",
        avgSalary: "$140k – $280k+",
        growth: "+12% by 2030",
        match: isFirstClass ? "Excellent" : "Strong",
        matchScore: isFirstClass ? 98 : 92,
        badgeLabel: isFirstClass ? "First Class Law Distinction" : "Top Law Firm Cutoff",
        skills: ["Due Diligence", "Cross-Border M&A", "Contract Negotiation", "Securities Law"],
        certifications: ["Bar Licensure Track", "Corporate Finance for Lawyers"],
        aiRationale: `Top-tier commercial law firms (Aluko & Oyebode, Banwo & Ighodalo, Clifford Chance) strictly screen by university class of degree. Your ${gpaStr} record meets elite requirements.`,
        cgpaBenchmark: "Top Tier Cutoff: ≥ 3.50+ (Met)",
        cgpaStatus: "cleared",
        actionSteps: [
          "Participate in national and international moot court competitions.",
          "Publish articles in peer-reviewed legal journals.",
          "Secure internships with commercial law practices."
        ],
        color: "from-slate-700 to-gray-900",
      },
      {
        id: "law-fintech-compliance",
        title: "FinTech & Data Privacy Compliance Officer",
        avgSalary: "$105k – $180k",
        growth: "+26% by 2030",
        match: "Strong",
        matchScore: 89,
        badgeLabel: "High Regulatory Demand",
        skills: ["AML/CFT Regulations", "GDPR / NDPR", "Smart Contracts Law", "Risk Management"],
        certifications: ["CAMS (Certified Anti-Money Laundering Specialist)", "CIPP/E Data Privacy"],
        aiRationale: `With surging global fintech regulations, tech companies hire specialized legal minds with strong analytical rigor to manage compliance.`,
        cgpaBenchmark: "Regulatory Cutoff: ≥ 3.50",
        cgpaStatus: "cleared",
        actionSteps: [
          "Obtain CAMS or certified data protection officer credentials.",
          "Draft sample compliance policies for cross-border payment rails.",
          "Target legal compliance roles at licensed payment processors."
        ],
        color: "from-amber-600 to-yellow-700",
      },
    ];
  }

  // 6. Social Sciences, Media & Humanities (Mass Comm, International Relations, etc.)
  if (
    prog.includes("mass") ||
    prog.includes("communication") ||
    prog.includes("media") ||
    prog.includes("journalism") ||
    prog.includes("international") ||
    prog.includes("political") ||
    prog.includes("psychology") ||
    prog.includes("english")
  ) {
    return [
      {
        id: "media-brand-strategy",
        title: "Global Brand Strategist & Communications Director",
        avgSalary: "$95k – $165k",
        growth: "+18% by 2030",
        match: isSecondClassUpper || isFirstClass ? "Excellent" : "Strong",
        matchScore: isFirstClass ? 96 : 91,
        badgeLabel: "Strategic Communications",
        skills: ["Crisis Management", "Public Relations", "Brand Architecture", "Media Production"],
        certifications: ["CIPR Professional PR Diploma", "Digital Marketing Institute (DMI)"],
        aiRationale: `Your ${gpaStr} academic standing demonstrates disciplined research and articulation skills, prime assets for multinational communications agencies and corporate PR.`,
        cgpaBenchmark: "Corporate Cutoff: ≥ 3.50 (Cleared)",
        cgpaStatus: "cleared",
        actionSteps: [
          "Manage digital media campaigns and measure ROI with analytics.",
          "Write and publish thought leadership op-eds on industry trends.",
          "Complete professional PR certifications."
        ],
        color: "from-pink-600 to-rose-700",
      },
      {
        id: "media-growth-lead",
        title: "Digital Growth & Content Operations Lead",
        avgSalary: "$90k – $150k",
        growth: "+22% by 2030",
        match: "Strong",
        matchScore: 88,
        badgeLabel: "Skills-First Tech Media",
        skills: ["Performance Marketing", "SEO / Content Ops", "Customer Acquisition", "Analytics"],
        certifications: ["Google Analytics (GA4)", "HubSpot Inbound Marketing"],
        aiRationale: `Tech ventures look for skilled communicators who can drive viral acquisition and manage scalable brand messaging.`,
        cgpaBenchmark: "Industry Focus: Audience Metrics",
        cgpaStatus: "skills-first",
        actionSteps: [
          "Grow an active digital publication or newsletter with measurable subscriber retention.",
          "Acquire Google Analytics and HubSpot certifications.",
          "Target growth marketing internships."
        ],
        color: "from-violet-500 to-purple-600",
      },
    ];
  }

  // 7. Natural, Biological & Life Sciences (Biochemistry, Microbiology, Chemistry, etc.)
  if (
    prog.includes("bio") ||
    prog.includes("micro") ||
    prog.includes("chem") ||
    prog.includes("physic") ||
    prog.includes("math") ||
    prog.includes("science")
  ) {
    return [
      {
        id: "sci-biotech-analyst",
        title: "Bioinformatics & Computational Biologist",
        avgSalary: "$110k – $185k",
        growth: "+28% by 2030",
        match: isFirstClass || isSecondClassUpper ? "Excellent" : "Strong",
        matchScore: isFirstClass ? 97 : 91,
        badgeLabel: isFirstClass ? "R&D Scholarship Ready" : "Computational Focus",
        skills: ["Python (Biopython)", "Genomic Sequencing", "R / Statistics", "Molecular Modeling"],
        certifications: ["Bioinformatics Specialization", "NIH Research Ethics"],
        aiRationale: `Combining scientific wet-lab fundamentals with computational data analysis puts your ${gpaStr} profile in high demand for pharmaceutical genomics research.`,
        cgpaBenchmark: "Research Fellowship Cutoff: ≥ 3.50+ (Met)",
        cgpaStatus: "cleared",
        actionSteps: [
          "Analyze genomic datasets using Python and R tools.",
          "Pursue an undergraduate project focusing on molecular dynamics or biomarker analysis.",
          "Apply for international life sciences graduate research internships."
        ],
        color: "from-emerald-600 to-teal-700",
      },
      {
        id: "sci-pharma-qc",
        title: "Pharmaceutical Quality & Regulatory Lead",
        avgSalary: "$85k – $145k",
        growth: "+15% by 2030",
        match: "Strong",
        matchScore: 87,
        badgeLabel: "Regulated Industry",
        skills: ["HPLC / GC-MS", "GLP / GMP Standards", "Batch Testing", "Regulatory Filings"],
        certifications: ["ISO 9001 Lead Auditor", "Six Sigma Quality"],
        aiRationale: `Pharmaceutical and consumer chemical manufacturers place a high premium on precise analytical lab discipline.`,
        cgpaBenchmark: "Industry Cutoff: ≥ 3.00",
        cgpaStatus: "cleared",
        actionSteps: [
          "Master laboratory chromatography and instrumentation techniques.",
          "Complete ISO quality and good manufacturing practice courses.",
          "Target industrial training with certified pharmaceutical manufacturers."
        ],
        color: "from-cyan-600 to-blue-700",
      },
    ];
  }

  // 8. General / Cross-Disciplinary Fallback with Active CGPA Adaptation
  return [
    {
      id: "gen-product-mgmt",
      title: "Digital Product Manager",
      avgSalary: "$105k – $175k",
      growth: "+20% by 2030",
      match: isSecondClassUpper || isFirstClass ? "Excellent" : "Strong",
      matchScore: isFirstClass ? 95 : isSecondClassUpper ? 92 : 85,
      badgeLabel: isFirstClass ? "Associate PM Fast-Track" : isSecondClassUpper ? "2:1 Benchmark Met" : "Skills-First",
      skills: ["Product Strategy", "User Research", "Agile / Scrum", "Data Analytics"],
      certifications: ["Google Project Management", "Certified Scrum Product Owner (CSPO)"],
      aiRationale: `Your ${gpaStr} standing in ${programme} provides strong analytical discipline. Product management rewards candidates who can organize teams, analyze user behavior, and execute roadmaps.`,
      cgpaBenchmark: isSecondClassUpper || isFirstClass ? "APM Program Cutoff: ≥ 3.50 (Cleared)" : "Benchmark: Shipped Product Case Studies",
      cgpaStatus: isSecondClassUpper || isFirstClass ? "cleared" : "skills-first",
      actionSteps: [
        "Create an in-depth product requirement document (PRD) for a problem in your university community.",
        "Obtain the Google Project Management or Agile Scrum certification.",
        "Participate in product teardown events."
      ],
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: "gen-biz-ops",
      title: "Business & Strategy Operations Lead",
      avgSalary: "$95k – $155k",
      growth: "+16% by 2030",
      match: "Strong",
      matchScore: 89,
      badgeLabel: "Corporate Trainee Track",
      skills: ["Process Optimization", "Excel Modeling", "Cross-Functional Leadership", "KPI Dashboards"],
      certifications: ["Six Sigma Lean", "Advanced Financial Modeling"],
      aiRationale: `Operations teams at multinational corporations actively recruit graduates with solid academic consistency (${gpaStr}) to streamline scalable business functions.`,
      cgpaBenchmark: "Trainee Cutoff: ≥ 3.50 (Cleared)",
      cgpaStatus: isSecondClassUpper || isFirstClass ? "cleared" : "skills-first",
      actionSteps: [
        "Design standard operating procedure (SOP) blueprints for student associations.",
        "Build automated KPI reporting spreadsheets with advanced formulas.",
        "Apply for corporate management trainee intake programs."
      ],
      color: "from-violet-500 to-purple-600",
    },
    {
      id: "gen-growth-mkt",
      title: "Growth Marketing & Tech Venture Lead",
      avgSalary: "$85k – $145k",
      growth: "+22% by 2030",
      match: "Good",
      matchScore: 86,
      badgeLabel: "High Growth Industry",
      skills: ["Customer Acquisition", "Funnel Optimization", "Marketing Automation", "Paid Channels"],
      certifications: ["Meta Certified Digital Marketing", "Google Ads & Analytics"],
      aiRationale: `High-growth startups evaluate growth leaders by demonstrated revenue metrics and marketing experimentation.`,
      cgpaBenchmark: "Focus: Track Record & Campaigns",
      cgpaStatus: "skills-first",
      actionSteps: [
        "Run an experimentation campaign with quantifiable lead generation.",
        "Master marketing automation platforms and funnel analytics.",
        "Launch an indie tech newsletter or digital brand."
      ],
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
  Opportunity:
    "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
};

// ─── Modal: Career Dossier ──────────────────────────────────────────────────

function CareerDossierModal({
  career,
  cgpa,
  programme,
  onClose,
  onOpenSimulator,
}: {
  career: CareerPath;
  cgpa: number;
  programme: string;
  onClose: () => void;
  onOpenSimulator: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto transition-all animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/30">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${career.color} flex items-center justify-center shrink-0 shadow-md`}>
              <BriefcaseBusiness className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0",
                  matchColors[career.match]
                )}>
                  {career.matchScore}% AI Match
                </span>
                <span className="text-[11px] font-semibold text-[#003cbb] dark:text-[#4d82ff] bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/40">
                  {career.badgeLabel}
                </span>
              </div>
              <h2 className="text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-gray-100 leading-snug">
                {career.title}
              </h2>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                Tailored for {programme} • Current CGPA: <span className="font-bold text-gray-800 dark:text-gray-200">{cgpa.toFixed(2)}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Compensation & Growth Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Average Salary</span>
              <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">{career.avgSalary}</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">2030 Growth Outlook</span>
              <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">{career.growth}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col gap-0.5">
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Academic Benchmark</span>
              <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 truncate">{career.cgpaBenchmark}</span>
            </div>
          </div>

          {/* AI Tailored Rationale */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#003cbb] dark:text-[#4d82ff]" />
              <span className="text-[12px] font-bold text-[#003cbb] dark:text-[#4d82ff] uppercase tracking-wider">
                AI Match Analysis
              </span>
            </div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
              {career.aiRationale}
            </p>
          </div>

          {/* Skills Required */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Award className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                Core Competencies & Stack
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {career.skills.map((skill, i) => (
                <span
                  key={i}
                  className="text-[12px] font-medium px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Industry Certifications */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                Recommended Professional Certifications
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {career.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="text-[12px] font-semibold px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* 3-Step Action Plan */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-[13px] font-bold text-gray-900 dark:text-gray-100">
                Tailored Academic Action Plan
              </h4>
            </div>
            <div className="space-y-2">
              {career.actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[13px] text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-[#003cbb]/10 dark:bg-[#4d82ff]/20 text-[#003cbb] dark:text-[#4d82ff] flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-snug">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[12px] text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Aiming to increase your career match score?
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                onOpenSimulator();
              }}
              className="flex-1 sm:flex-none rounded-xl h-10 px-4 text-xs font-semibold gap-1.5 border-[#ccdaf9] dark:border-blue-900/60 text-[#003cbb] dark:text-[#4d82ff] hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Simulate Target CGPA
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl h-10 px-5 text-xs font-semibold bg-[#003cbb] hover:bg-[#002e8f] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8] text-white"
            >
              Close Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AcademicAlerts() {
  const [profile, setProfile] = useState<UMISResponse | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "tailored" | "growth">("tailored");
  const [isGpaSimulatorOpen, setIsGpaSimulatorOpen] = useState(false);

  const userData = useUserData();

  useEffect(() => {
    getStudentProfileAction().then(setProfile);
  }, []);

  // CGPA derived reliably from live session or profile, defaulting to 3.67
  const cgpa =
    userData?.user_data?.academic_information?.cummulative_gpa ??
    userData?.user_data?.cummulative_gpa ??
    profile?.user_data?.academic_information?.cummulative_gpa ??
    profile?.user_data?.cummulative_gpa ??
    3.67;

  const rawDegree = 
    userData?.user_data?.degree_name ?? 
    profile?.user_data?.degree_name ?? 
    "";
  const department = 
    userData?.user_data?.department ?? 
    profile?.user_data?.department ?? 
    "Software Engineering";
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
  
  // Derive Tailored Career Paths using live CGPA & Programme
  const rawCareerPaths = useMemo(() => {
    return deriveCareerPaths(programme, cgpa);
  }, [programme, cgpa]);

  // Filter paths actively
  const careerPaths = useMemo(() => {
    if (activeFilter === "tailored") {
      return rawCareerPaths.filter((p) => p.matchScore >= 88);
    }
    if (activeFilter === "growth") {
      return [...rawCareerPaths].sort((a, b) => {
        const valA = parseInt(a.growth.replace(/[^0-9]/g, "") || "0", 10);
        const valB = parseInt(b.growth.replace(/[^0-9]/g, "") || "0", 10);
        return valB - valA;
      });
    }
    return rawCareerPaths;
  }, [rawCareerPaths, activeFilter]);

  return (
    <>
      <Card className="rounded-[20px] border-gray-100 dark:border-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
        <CardContent className="p-5 md:p-6 flex flex-col gap-5">
          {/* Card Header */}
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

          {/* AI Recommended Career Paths Section */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Header with AI indicator & Simulator trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Recommended Career Paths
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eaf0ff] dark:bg-[#003cbb]/20 text-[#003cbb] dark:text-[#4d82ff] border border-[#ccdaf9] dark:border-[#ccdaf9]/25">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI-Matched
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Tailored to your <span className="font-semibold text-gray-800 dark:text-gray-200">{cgpa.toFixed(2)} CGPA</span> &amp; {programme}
                </p>
              </div>

              {/* Action Button: What-If GPA Simulator */}
              <button
                type="button"
                onClick={() => setIsGpaSimulatorOpen(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#003cbb] dark:text-[#4d82ff] hover:text-[#002e8f] dark:hover:text-[#6da0ff] bg-blue-50/80 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40 transition-colors self-start sm:self-auto shrink-0"
                title="Simulate how raising your CGPA affects career matches"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Simulate CGPA</span>
              </button>
            </div>

            {/* Perspective Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-100/70 dark:bg-gray-800/60 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveFilter("tailored")}
                className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  activeFilter === "tailored"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                CGPA Tailored
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  activeFilter === "all"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                All Paths
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("growth")}
                className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-semibold transition-all",
                  activeFilter === "growth"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                )}
              >
                Highest Growth
              </button>
            </div>

            {/* Active Career Path Cards */}
            <div className="flex flex-col gap-2.5">
              {careerPaths.map((path) => (
                <div
                  key={path.id}
                  onClick={() => setSelectedCareer(path)}
                  className="group flex items-center justify-between gap-3 rounded-[14px] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 p-3 hover:border-[#003cbb]/40 dark:hover:border-[#4d82ff]/40 hover:bg-white dark:hover:bg-gray-800/80 hover:shadow-xs transition-all cursor-pointer select-none"
                  title="Click to view AI career dossier and roadmap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${path.color} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                      <BriefcaseBusiness className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] transition-colors">
                          {path.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                        <span>{path.avgSalary}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{path.growth}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 transition-colors",
                      matchColors[path.match]
                    )}>
                      {path.matchScore}% Match
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Dossier Modal */}
      {selectedCareer && (
        <CareerDossierModal
          career={selectedCareer}
          cgpa={cgpa}
          programme={programme}
          onClose={() => setSelectedCareer(null)}
          onOpenSimulator={() => setIsGpaSimulatorOpen(true)}
        />
      )}

      {/* What-If GPA Simulator Modal */}
      <GPAWhatIfSimulator
        isOpen={isGpaSimulatorOpen}
        onClose={() => setIsGpaSimulatorOpen(false)}
      />
    </>
  );
}
