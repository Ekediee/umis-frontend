/**
 * In-memory mock database for the lecturer app.
 *
 * Mirrors the legacy-portal audit: Dr. Amos Awoniyi (NIYI), School of Computing,
 * Software Engineering, Course Advisor for Level 100, blank email, 7 course
 * sections this semester (SEN 201 A–C, SENG203, COSC333, BU-CSC 333 ×2).
 *
 * Mutations from `handlers.ts` change this object in place, so the demo
 * behaves like a real backend for the length of a browser session.
 */

import type {
  Announcement,
  Assessment,
  Booking,
  ClassSession,
  Course,
  DepartmentInfo,
  Enrolment,
  GradeSheet,
  Lecturer,
  LecturerNotification,
  Material,
  NotificationPrefs,
  OfficeHourSlot,
  Question,
  Register,
  Registration,
  RegistrationCourse,
  RegistrationStatus,
  Semester,
  Student,
  SupervisionProject,
  SupervisionRequest,
  AdvisingWindow,
} from "../types";
import { registrationChecks } from "../rules";
import { FIRST_NAMES, LAST_NAMES, PROGRAMMES, chance, int, matric, mulberry32, pick } from "./seed";

import { DEMO_NOW } from "../clock";
export { DEMO_NOW };

const d = (y: number, m: number, day: number, h = 9, min = 0) => new Date(y, m - 1, day, h, min).toISOString();

export interface MockDb {
  lecturer: Lecturer;
  prefs: NotificationPrefs;
  onboarded: boolean;
  semesters: Semester[];
  courses: Course[];
  students: Map<string, Student>;
  enrolments: Enrolment[];
  assessments: Assessment[];
  gradeSheets: GradeSheet[];
  sessions: ClassSession[];
  registers: Register[];
  materials: Material[];
  announcements: Announcement[];
  questions: Question[];
  registrations: Registration[];
  advising: AdvisingWindow;
  projects: SupervisionProject[];
  supervisionRequests: SupervisionRequest[];
  officeHours: { slots: OfficeHourSlot[]; paused: boolean };
  bookings: Booking[];
  notifications: LecturerNotification[];
  department: DepartmentInfo;
  reports: { id: string; field: string; problem: string; shouldBe: string; at: string }[];
}

// ── Builders ─────────────────────────────────────────────────────────────────

function buildStudents(rng: ReturnType<typeof mulberry32>, count: number, level: number, prefix: string, programme?: string) {
  const list: Student[] = [];
  const entryYear = 2026 - Math.floor(level / 100) + 1;
  for (let i = 0; i < count; i++) {
    list.push({
      id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
      matric: matric(rng, entryYear),
      firstName: pick(rng, FIRST_NAMES),
      lastName: pick(rng, LAST_NAMES),
      programme: programme ?? pick(rng, PROGRAMMES),
      level,
      photoUrl: null,
      advisorName: pick(rng, ["Dr. Folasade Ogunbiyi", "Mr. Kunle Adewale", "Dr. Ifeanyi Okeke"]),
    });
  }
  return list;
}

const CURRENT = "2026/2027.1";

function buildCourses(): Course[] {
  const topics = [
    "Introduction and course overview",
    "Software process models",
    "Requirements engineering",
    "Modelling with UML",
    "Software architecture",
    "Design patterns",
    "Testing fundamentals",
    "Mid-semester test",
    "Version control and CI",
    "Agile and Scrum",
    "Software quality",
    "Maintenance and evolution",
    "Project management",
    "Ethics in software",
    "Revision",
  ];
  return [
    {
      id: "sen-201",
      code: "SEN 201",
      title: "Introduction to Software Engineering",
      credits: 2,
      level: 200,
      semesterCode: CURRENT,
      groups: [
        { id: "sen-201:A", label: "A", option: "Soft Eng Group A", enrolled: 56 },
        { id: "sen-201:B", label: "B", option: "Soft Eng Group B", enrolled: 58 },
        { id: "sen-201:C", label: "C", option: "Soft Eng Group C", enrolled: 50 },
      ],
      week: 6,
      totalWeeks: 15,
      attendanceAvg: 0,
      caWeight: 40,
      examWeight: 60,
      isGradeOwner: true,
      coLecturers: ["Mrs. Bisi Adekunle (TA)"],
      topics,
    },
    {
      id: "seng-203",
      code: "SENG203",
      title: "Software Evolution and Maintenance",
      credits: 3,
      level: 200,
      semesterCode: CURRENT,
      groups: [{ id: "seng-203:SE", label: "SOFT-ENG", option: "SOFT-ENG", enrolled: 48 }],
      week: 6,
      totalWeeks: 15,
      attendanceAvg: 0,
      caWeight: 40,
      examWeight: 60,
      isGradeOwner: true,
      coLecturers: [],
      topics: topics.map((t, i) => (i === 5 ? "Refactoring legacy code" : t)),
    },
    {
      id: "cosc-333",
      code: "COSC333",
      title: "Database System Design, Implementation and Management",
      credits: 3,
      level: 300,
      semesterCode: CURRENT,
      groups: [{ id: "cosc-333:SE", label: "SOFT-ENG", option: "SOFT-ENG", enrolled: 61 }],
      week: 6,
      totalWeeks: 15,
      attendanceAvg: 0,
      caWeight: 40,
      examWeight: 60,
      isGradeOwner: true,
      coLecturers: ["Dr. Ifeanyi Okeke"],
      topics: topics.map((t, i) => (i === 5 ? "Normalisation to BCNF" : t)),
      dataIssue: { kind: "duplicate-title", otherCode: "BU-CSC 333" },
    },
    {
      id: "bu-csc-333",
      code: "BU-CSC 333",
      title: "Database System Design, Implementation and Management",
      credits: 3,
      level: 300,
      semesterCode: CURRENT,
      groups: [
        { id: "bu-csc-333:DE", label: "DE Software", option: "DE Software", enrolled: 22 },
        { id: "bu-csc-333:E", label: "E", option: "Soft Eng Group E", enrolled: 40 },
      ],
      week: 6,
      totalWeeks: 15,
      attendanceAvg: 0,
      caWeight: 40,
      examWeight: 60,
      isGradeOwner: false,
      coLecturers: ["Dr. Ifeanyi Okeke (grade owner)"],
      topics: topics.map((t, i) => (i === 5 ? "Normalisation to BCNF" : t)),
      dataIssue: { kind: "duplicate-title", otherCode: "COSC333" },
    },
    // Earlier semesters — folded under "Earlier" on My Courses.
    ...[
      { id: "sen-299", code: "SEN 299", title: "SIWES 1", credits: 3, sem: "2024/2025.3", option: "Software Engineering", n: 34 },
      { id: "cos-102", code: "COS 102", title: "Problem Solving", credits: 3, sem: "2025/2026.2", option: "Soft Eng Group A", n: 71 },
      { id: "ins-204", code: "INS 204", title: "System Analysis and Design", credits: 3, sem: "2025/2026.2", option: "DE Software", n: 19 },
      { id: "seng-360", code: "SENG360", title: "Student Industrial Work Experience (SIWES)", credits: 6, sem: "2025/2026.2", option: "SOFT-ENG", n: 42 },
    ].map<Course>((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credits: c.credits,
      level: 300,
      semesterCode: c.sem,
      groups: [{ id: `${c.id}:1`, label: c.option, option: c.option, enrolled: c.n }],
      week: 15,
      totalWeeks: 15,
      attendanceAvg: 88,
      caWeight: 40,
      examWeight: 60,
      isGradeOwner: true,
      coLecturers: [],
      topics: [],
    })),
  ];
}

function buildAssessments(): Assessment[] {
  const list: Assessment[] = [
    { id: "sen-201:ca1", courseId: "sen-201", name: "CA 1 Test", type: "test", maxMarks: 10, dueDate: d(2026, 9, 18, 12), mode: "paper", released: true, groupIds: [] },
    { id: "sen-201:ca2", courseId: "sen-201", name: "CA 2 Assignment", type: "assignment", maxMarks: 10, dueDate: d(2026, 10, 24, 23, 59), mode: "online", released: false, groupIds: [] },
    { id: "sen-201:ca3", courseId: "sen-201", name: "CA 3 Test", type: "test", maxMarks: 20, dueDate: null, mode: "paper", released: false, groupIds: [] },
  ];
  for (const id of ["seng-203", "cosc-333", "bu-csc-333"]) {
    list.push(
      { id: `${id}:ca1`, courseId: id, name: "CA 1 Test", type: "test", maxMarks: 10, dueDate: d(2026, 9, 25, 12), mode: "paper", released: true, groupIds: [] },
      { id: `${id}:ca2`, courseId: id, name: "CA 2 Assignment", type: "assignment", maxMarks: 10, dueDate: d(2026, 11, 6, 23, 59), mode: "online", released: false, groupIds: [] },
      { id: `${id}:ca3`, courseId: id, name: "CA 3 Project", type: "project", maxMarks: 20, dueDate: d(2026, 11, 27, 23, 59), mode: "online", released: false, groupIds: [] },
    );
  }
  return list;
}

function buildEnrolments(rng: ReturnType<typeof mulberry32>, courses: Course[], assessments: Assessment[], students: Map<string, Student>) {
  const enrolments: Enrolment[] = [];
  for (const course of courses.filter((c) => c.semesterCode === CURRENT)) {
    const courseAssessments = assessments.filter((a) => a.courseId === course.id);
    for (const group of course.groups) {
      const prefix = group.id.replace(/[^a-z0-9]/gi, "").toLowerCase();
      const roster = buildStudents(rng, group.enrolled, course.level, prefix);
      roster.forEach((s, idx) => {
        students.set(s.id, s);
        const attendance = Math.min(100, Math.max(38, Math.round(92 - rng() * rng() * 60)));
        const caScores: Record<string, number | null> = {};
        for (const a of courseAssessments) {
          if (!a.released) {
            caScores[a.id] = null;
            continue;
          }
          caScores[a.id] = chance(rng, 0.05) ? null : Math.round(Math.min(a.maxMarks, Math.max(1, a.maxMarks * (0.35 + rng() * 0.7))));
        }
        let examScore: number | null = null;
        // SEN 201 Group B: "41 of 58 scores entered" (Today card + 5B.1)
        if (group.id === "sen-201:B" && idx < 41) examScore = int(rng, 18, 58);
        // COSC333 sheet was submitted then returned by the HOD (5B.6)
        if (course.id === "cosc-333") examScore = idx === 7 || idx === 19 ? 0 : int(rng, 15, 59);
        const dropped = idx === roster.length - 1 && group.id === "sen-201:A";
        enrolments.push({
          studentId: s.id,
          courseId: course.id,
          groupId: group.id,
          attendancePct: attendance,
          caScores,
          examScore,
          status: dropped ? "dropped" : "active",
          droppedOn: dropped ? d(2026, 9, 28) : undefined,
          tags: idx % 23 === 4 ? ["carry-over"] : idx % 31 === 9 ? ["other-programme"] : [],
          flaggedAtRisk: false,
        });
      });
    }
    const rows = enrolments.filter((e) => e.courseId === course.id);
    course.attendanceAvg = Math.round(rows.reduce((s, e) => s + e.attendancePct, 0) / rows.length);
  }
  return enrolments;
}

function buildSessions(): ClassSession[] {
  return [
    { id: "ses-sen201-a", courseId: "sen-201", groupIds: ["sen-201:A"], day: 3, start: "10:00", end: "12:00", venue: "Hall 2", building: "Science and Technology Complex", source: "lecturer" },
    { id: "ses-sen201-b", courseId: "sen-201", groupIds: ["sen-201:B"], day: 2, start: "10:00", end: "12:00", venue: "Hall 2", building: "Science and Technology Complex", source: "lecturer" },
    { id: "ses-sen201-c", courseId: "sen-201", groupIds: ["sen-201:C"], day: 4, start: "08:00", end: "10:00", venue: "Hall 3", building: "Science and Technology Complex", source: "lecturer" },
    { id: "ses-seng203", courseId: "seng-203", groupIds: ["seng-203:SE"], day: 2, start: "10:00", end: "13:00", venue: "Lab 1", building: "Software Engineering Building", source: "lecturer" },
    { id: "ses-cosc333", courseId: "cosc-333", groupIds: ["cosc-333:SE"], day: 4, start: "14:00", end: "16:00", venue: "Lab 3", building: "Computing Building", source: "lecturer" },
    { id: "ses-bucsc333", courseId: "bu-csc-333", groupIds: ["bu-csc-333:E", "bu-csc-333:DE"], day: 2, start: "14:00", end: "16:00", venue: "Lecture Theatre 1", building: "Computing Building", source: "lecturer" },
    { id: "ses-bucsc333-de", courseId: "bu-csc-333", groupIds: ["bu-csc-333:DE"], day: 5, start: "16:00", end: "17:30", venue: "Online", building: "—", source: "lecturer", online: { link: "https://meet.babcock.edu.ng/bucsc333-de" } },
  ];
}

function buildRegisters(sessions: ClassSession[], enrolments: Enrolment[]): Register[] {
  const registers: Register[] = [];
  // Every class since Mon 28 Sep has a register, except BU-CSC 333 on Tue 6 Oct (Today card).
  for (let offset = 0; offset < 10; offset++) {
    const date = new Date(2026, 8, 28 + offset);
    const day = date.getDay() === 0 ? 7 : date.getDay();
    for (const s of sessions.filter((x) => x.day === day)) {
      const endsAt = new Date(date);
      const [h, m] = s.end.split(":").map(Number);
      endsAt.setHours(h, m);
      if (endsAt > DEMO_NOW) continue;
      if (s.id === "ses-bucsc333" && date.getDate() === 6) continue;
      const marks: Register["marks"] = {};
      enrolments
        .filter((e) => s.groupIds.includes(e.groupId) && e.status === "active")
        .forEach((e, i) => (marks[e.studentId] = i % 17 === 3 ? "absent" : i % 11 === 5 ? "late" : "present"));
      registers.push({ id: `reg-${s.id}-${date.getDate()}`, sessionId: s.id, date: date.toISOString(), method: "code", marks, savedAt: endsAt.toISOString() });
    }
  }
  return registers;
}

function buildMaterials(): Material[] {
  const m: Material[] = [];
  const weeks = [
    ["Course outline and assessment plan.pdf", "Week 1 slides — What is software engineering.pptx"],
    ["Week 2 slides — Process models.pptx", "Waterfall vs iterative reading.pdf"],
    ["Week 3 slides — Requirements.pptx", "Requirements template.docx"],
    ["Week 4 slides — UML.pptx"],
    ["Week 5 slides — Architecture.pptx", "Architecture case studies.pdf"],
    ["Week 6 slides — Design patterns.pptx"],
  ];
  weeks.forEach((files, i) =>
    files.forEach((name, j) =>
      m.push({
        id: `mat-sen201-${i + 1}-${j}`,
        courseId: "sen-201",
        week: i + 1,
        name,
        kind: name.endsWith(".pdf") ? "pdf" : name.endsWith(".docx") ? "docx" : "pptx",
        sizeKb: 400 + ((i * 7 + j * 13) % 9) * 310,
        groupIds: [],
      }),
    ),
  );
  m.push({
    id: "mat-sen201-4-paper",
    courseId: "sen-201",
    week: 4,
    name: "Model-driven requirements in Nigerian SMEs (Babcock, 2024)",
    kind: "paper",
    doi: "10.5555/bu.2024.0417",
    groupIds: [],
  });
  m.push({ id: "mat-sen201-7", courseId: "sen-201", week: 7, name: "Week 7 slides — Testing fundamentals.pptx", kind: "pptx", sizeKb: 2100, releaseAt: d(2026, 10, 12, 8), groupIds: [] });
  m.push({ id: "mat-seng203-1", courseId: "seng-203", week: 1, name: "Course outline.pdf", kind: "pdf", sizeKb: 320, groupIds: [] });
  m.push({ id: "mat-cosc333-1", courseId: "cosc-333", week: 1, name: "Course outline.pdf", kind: "pdf", sizeKb: 290, groupIds: [] });
  return m;
}

function buildQuestions(students: Student[]): Question[] {
  const q: Question[] = [];
  const seng = [
    "Will the CA 2 assignment be individual or in pairs?",
    "Can we use Python instead of Java for the refactoring exercise?",
    "Is Lehman's laws chapter part of the mid-semester test?",
    "The link to the legacy codebase in Week 5 returns 404.",
    "What is the difference between corrective and adaptive maintenance in the exam?",
  ];
  seng.forEach((body, i) =>
    q.push({
      id: `q-seng-${i}`,
      courseId: "seng-203",
      body,
      askedBy: `${students[i].firstName} ${students[i].lastName}`,
      anonymousToClassmates: i % 2 === 0,
      upvotes: [12, 4, 9, 7, 3][i],
      askedAt: d(2026, 10, 1 + i, 18, 20),
    }),
  );
  q.push({
    id: "q-seng-answered",
    courseId: "seng-203",
    body: "When is CA 2 due?",
    askedBy: `${students[6].firstName} ${students[6].lastName}`,
    anonymousToClassmates: false,
    upvotes: 15,
    askedAt: d(2026, 9, 24, 10),
    answer: { body: "CA 2 is due Friday 6 November, 11:59 pm. Submit online.", at: d(2026, 9, 24, 14) },
    pinnedFaq: true,
  });
  q.push({
    id: "q-sen-0",
    courseId: "sen-201",
    body: "Are the Week 6 design-pattern slides examinable?",
    askedBy: `${students[8].firstName} ${students[8].lastName}`,
    anonymousToClassmates: true,
    upvotes: 6,
    askedAt: d(2026, 10, 6, 21, 5),
  });
  return q;
}

const L100_COURSES: RegistrationCourse[] = [
  { code: "GEDS 101", title: "Communication in English", units: 2 },
  { code: "COS 101", title: "Introduction to Computing Sciences", units: 3 },
  { code: "MTH 101", title: "Elementary Mathematics I", units: 3 },
  { code: "PHY 101", title: "General Physics I", units: 3 },
  { code: "PHY 107", title: "General Practical Physics I", units: 1 },
  { code: "CHM 101", title: "General Chemistry I", units: 3 },
  { code: "SEN 101", title: "Introduction to Software Engineering Practice", units: 2 },
  { code: "GEDS 105", title: "Citizenship and Leadership", units: 2 },
];

function buildRegistrations(rng: ReturnType<typeof mulberry32>): Registration[] {
  const plan: [RegistrationStatus, number][] = [
    ["to_review", 14],
    ["returned", 3],
    ["approved_advisor", 160],
    ["approved_school", 30],
    ["not_submitted", 5],
  ];
  const students = buildStudents(rng, 212, 100, "l100", "Software Engineering");
  let cursor = 0;
  const regs: Registration[] = [];
  for (const [status, count] of plan) {
    for (let i = 0; i < count; i++) {
      const student = students[cursor++];
      let courses = [...L100_COURSES];
      const carry: { code: string; title: string; failedIn: string }[] = [];
      let clashes: string[] = [];
      if (status === "to_review") {
        if (i === 1 || i === 6) carry.push({ code: "COS 102", title: "Problem Solving", failedIn: "2025/2026" });
        if (i === 3) courses = [...courses, { code: "MTH 103", title: "Elementary Mathematics III", units: 3 }, { code: "STA 111", title: "Descriptive Statistics", units: 3 }, { code: "GEDS 121", title: "Use of Library", units: 1 }];
        if (i === 9) courses = courses.slice(0, 4);
        if (i === 11) clashes = ["PHY 107 and CHM 101 both Thu 2:00 pm"];
      }
      if (status === "returned") carry.push({ code: "COS 102", title: "Problem Solving", failedIn: "2025/2026" });
      const checks = registrationChecks(courses, { outstandingCarryOvers: carry, missingPrereqs: [], clashes });
      const submitted = status === "not_submitted" ? null : d(2026, 10, int(rng, 1, 6), int(rng, 8, 20), int(rng, 0, 59));
      regs.push({
        id: `reg-${student.id}`,
        student,
        status,
        submittedAt: submitted,
        cgpa: Math.round((2.1 + rng() * 2.8) * 100) / 100,
        standing: status === "to_review" && i === 7 ? "Probation" : "Good",
        courses,
        checks,
        resubmitted: status === "to_review" && (i === 0 || i === 5) ? { changes: ["Added COS 102 Problem Solving (carry-over)", "Removed GEDS 105"] } : undefined,
        returned: status === "returned" ? { reasons: ["missing-carry-over"], note: "Add COS 102 Problem Solving — you failed it in 2025/2026.", at: d(2026, 10, 3, 11) } : undefined,
      });
    }
  }
  return regs;
}

const LIT_REVIEW = [
  "This chapter reviews the literature on automated software testing, with particular attention to how fintech firms in emerging markets adopt test automation. It is organised in four parts: definitions and taxonomies, adoption studies in Africa, barriers reported by practitioners, and the gap this dissertation addresses.",
  "Automated testing is commonly defined as the use of software tools to execute pre-scripted tests on an application before it is released into production (Garousi & Mäntylä, 2016). The literature distinguishes unit, integration, system and acceptance testing, each with different tooling and cost profiles.",
  "Studies of adoption in Nigeria remain sparse. Okonkwo and Adebayo (2021) surveyed 48 Lagos-based start-ups and found that fewer than a third ran automated tests on every commit, citing limited CI infrastructure and the cost of cloud build minutes as the main constraints.",
  "Regulatory pressure is changing this picture. Since the Central Bank of Nigeria's 2022 guidance on operational resilience, payment service providers are expected to evidence change-management controls, which several authors argue makes automated regression testing a compliance requirement rather than an engineering preference.",
  "Practitioner barriers cluster into three themes: skills (few engineers trained in test design), tooling (flaky tests on unreliable networks), and incentives (release velocity rewarded over quality). These themes recur across the studies reviewed, although most rely on self-reported survey data.",
  "Finally, the literature rarely measures outcomes. Only two of the fourteen studies reviewed link test automation to production incident rates. This dissertation addresses that gap by combining a practitioner survey with incident data from three partner firms.",
];

function buildProjects(rng: ReturnType<typeof mulberry32>): { projects: SupervisionProject[]; requests: SupervisionRequest[] } {
  const mk = (id: string, first: string, last: string): Student => ({
    id,
    matric: matric(rng, 2023),
    firstName: first,
    lastName: last,
    programme: "Software Engineering",
    level: 400,
    photoUrl: null,
    advisorName: "Dr. Folasade Ogunbiyi",
  });
  const ada = mk("sup-ada", "Ada", "Okafor");
  const tobi = mk("sup-tobi", "Tobi", "Adeyemi");
  const zainab = mk("sup-zainab", "Zainab", "Bello");

  const para = (prefix: string, texts: string[], changed: number[] = [], ai: number[] = []) =>
    texts.map((text, i) => ({ id: `${prefix}-p${i + 1}`, text, changedSinceReview: changed.includes(i) || undefined, aiAssisted: ai.includes(i) || undefined }));

  const filler = (topic: string) => [
    `This chapter sets out the ${topic} for the study and explains the choices made.`,
    "Each decision is justified with reference to the research questions stated in Chapter 1 and the gaps identified in Chapter 2.",
    "Limitations are noted at the end of the chapter and revisited in the discussion.",
  ];

  const projects: SupervisionProject[] = [
    {
      id: "proj-ada",
      student: ada,
      title: "Automated testing in Nigerian fintech: adoption, barriers and outcomes",
      type: "Dissertation",
      lastActivity: d(2026, 10, 6, 22, 40),
      chapters: [
        { id: "ada-1", number: 1, title: "Introduction", state: "approved", words: 3120, citations: 14, citationFlags: [], paragraphs: para("ada-1", filler("background and aims")), comments: [] },
        {
          id: "ada-2",
          number: 2,
          title: "Literature Review",
          state: "submitted",
          words: 6840,
          citations: 41,
          submittedAt: d(2026, 10, 1, 16, 5),
          citationFlags: [
            { source: "Okonkwo & Adebayo (2021)", issue: "missing-doi" },
            { source: "TechCabal blog post (2023)", issue: "unverified-source" },
          ],
          paragraphs: para("ada-2", LIT_REVIEW, [2, 3], [4]),
          comments: [
            { id: "c-old-1", paragraphId: "ada-2-p2", quote: "pre-scripted tests", body: "Cite the ISTQB glossary for this definition too.", author: "Dr. Amos Awoniyi", at: d(2026, 9, 20), resolved: true },
          ],
        },
        { id: "ada-3", number: 3, title: "Methodology", state: "submitted", words: 4210, citations: 18, submittedAt: d(2026, 10, 5, 9, 30), citationFlags: [], paragraphs: para("ada-3", filler("research design, sampling and data collection")), comments: [] },
        { id: "ada-4", number: 4, title: "Results", state: "drafting", words: 1980, citations: 3, citationFlags: [], paragraphs: [], comments: [] },
        { id: "ada-5", number: 5, title: "Discussion", state: "drafting", words: 640, citations: 2, citationFlags: [], paragraphs: [], comments: [] },
        { id: "ada-6", number: 6, title: "Conclusion", state: "drafting", words: 0, citations: 0, citationFlags: [], paragraphs: [], comments: [] },
      ],
      milestones: [
        { id: "m1", label: "Proposal defence", due: d(2026, 6, 12), done: true },
        { id: "m2", label: "Chapters 1 to 3", due: d(2026, 10, 16), done: false },
        { id: "m3", label: "Full draft", due: d(2027, 1, 22), done: false },
        { id: "m4", label: "Final submission", due: d(2027, 3, 26), done: false },
      ],
      meetingLog: [
        { id: "ml1", date: d(2026, 9, 22, 15), discussed: "Scope of the literature review; whether to include non-African studies.", nextSteps: "Ada to cap the review at 7,000 words and add a gap table." },
      ],
    },
    {
      id: "proj-tobi",
      student: tobi,
      title: "Offline-first mobile payments for rural markets",
      type: "Project",
      lastActivity: d(2026, 10, 6, 11, 12),
      chapters: [
        { id: "tobi-1", number: 1, title: "Introduction", state: "approved", words: 2400, citations: 9, citationFlags: [], paragraphs: para("tobi-1", filler("problem statement")), comments: [] },
        { id: "tobi-2", number: 2, title: "Literature Review", state: "approved", words: 4100, citations: 22, changedAfterApproval: true, citationFlags: [], paragraphs: para("tobi-2", filler("related work")), comments: [] },
        { id: "tobi-3", number: 3, title: "System Design", state: "submitted", words: 3550, citations: 11, submittedAt: d(2026, 10, 6, 11, 12), citationFlags: [{ source: "Mojaloop docs", issue: "unverified-source" }], paragraphs: para("tobi-3", filler("system architecture and data model")), comments: [] },
        { id: "tobi-4", number: 4, title: "Implementation", state: "drafting", words: 900, citations: 1, citationFlags: [], paragraphs: [], comments: [] },
        { id: "tobi-5", number: 5, title: "Evaluation and Conclusion", state: "drafting", words: 0, citations: 0, citationFlags: [], paragraphs: [], comments: [] },
      ],
      milestones: [
        { id: "m1", label: "Proposal defence", due: d(2026, 6, 19), done: true },
        { id: "m2", label: "Chapters 1 to 3", due: d(2026, 10, 16), done: false },
        { id: "m3", label: "Final submission", due: d(2027, 3, 26), done: false },
      ],
      meetingLog: [],
    },
    {
      id: "proj-zainab",
      student: zainab,
      title: "Energy-aware background scheduling for Android apps",
      type: "Project",
      lastActivity: d(2026, 9, 21, 14),
      chapters: [
        { id: "zb-1", number: 1, title: "Introduction", state: "approved", words: 2050, citations: 7, citationFlags: [], paragraphs: para("zb-1", filler("motivation")), comments: [] },
        { id: "zb-2", number: 2, title: "Literature Review", state: "changes_requested", words: 3800, citations: 19, citationFlags: [], paragraphs: para("zb-2", filler("related work")), comments: [] },
        { id: "zb-3", number: 3, title: "Methodology", state: "drafting", words: 300, citations: 0, citationFlags: [], paragraphs: [], comments: [] },
      ],
      milestones: [
        { id: "m1", label: "Proposal defence", due: d(2026, 6, 19), done: true },
        { id: "m2", label: "Chapters 1 to 3", due: d(2026, 10, 2), done: false },
      ],
      meetingLog: [],
    },
  ];

  const requests: SupervisionRequest[] = [
    {
      id: "sreq-chinedu",
      student: mk("sup-chinedu", "Chinedu", "Eze"),
      title: "Migrating monoliths to microservices in Nigerian banks",
      type: "Dissertation",
      assignedBy: "Prof. Olayinka Adeniran (HOD)",
      at: d(2026, 10, 6, 15, 30),
    },
  ];
  return { projects, requests };
}

function buildDepartment(): DepartmentInfo {
  const c = (code: string, title: string, units: number, level: number, possibleDuplicateOf?: string, teaching?: string) => ({
    code,
    title,
    units,
    level,
    prerequisites: level > 100 ? [] : [],
    teaching,
    possibleDuplicateOf,
  });
  return {
    schoolCode: "CES",
    schoolName: "School of Computing",
    departmentCode: "SENG",
    departmentName: "Software Engineering",
    vision: null,
    mission: null,
    hod: "Prof. Olayinka Adeniran",
    advisorsByLevel: [
      { level: 100, name: "Dr. Amos Awoniyi" },
      { level: 200, name: "Mr. Kunle Adewale" },
      { level: 300, name: "Dr. Ifeanyi Okeke" },
      { level: 400, name: "Dr. Folasade Ogunbiyi" },
    ],
    programmes: [
      { name: "B.Sc. Software Engineering", years: 4 },
      { name: "B.Sc. Software Engineering (Direct Entry)", years: 3 },
    ],
    catalogue: [
      c("BU-SEN 102", "Web Design and Development", 3, 100),
      c("SEN 201", "Introduction to Software Engineering", 2, 200, undefined, "Dr. Amos Awoniyi"),
      c("SENG203", "Software Evolution and Maintenance", 3, 200, undefined, "Dr. Amos Awoniyi"),
      c("BU-SEN 212", "Internet Technology Web Application Development", 3, 200),
      c("BU-SEN 303", "Introduction to Big Data Engineering", 2, 300),
      c("BU-SEN 313", "Mobile Application Development", 2, 300),
      c("COSC333", "Database System Design, Implementation and Management", 3, 300, "BU-CSC 333", "Dr. Amos Awoniyi"),
      c("BU-CSC 333", "Database System Design, Implementation and Management", 3, 300, "COSC333", "Dr. Amos Awoniyi"),
      c("BU-SEN 406", "Formal Methods in Software Engineering", 2, 400, "BU-SEN-406"),
      c("BU-SEN-406", "Formal Methods in Software Engineering", 2, 400, "BU-SEN 406"),
      c("BU-SEN 407", "Software Measurement and Metrics", 2, 400, "BU-SEN-407"),
      c("BU-SEN-407", "Software Measurement and Metrics", 2, 400, "BU-SEN 407"),
      c("BU-SEN 411", "Open-Source Systems Development", 2, 400, "BU-SEN-411"),
      c("BU-SEN-411", "Open-Source Systems Development", 2, 400, "BU-SEN 411"),
      c("BU-SEN 417", "Human Computer Interaction and Emerging Technologies", 3, 400),
      c("BU-COS 419", "Agile Development and Scrum", 2, 400, "BU-COS-419"),
      c("BU-COS-419", "Agile Development and Scrum", 2, 400, "BU-COS 419"),
      c("BU-GST-400", "Religion and Social Ethics", 3, 400),
    ],
  };
}

function buildNotifications(): LecturerNotification[] {
  return [
    { id: "n1", kind: "supervision", title: "Supervision request", body: "Your HOD assigned you to supervise Chinedu Eze (Dissertation).", at: d(2026, 10, 6, 15, 30), read: false, href: "/lecturer/supervision" },
    { id: "n2", kind: "grades", course: "COSC333", title: "Grade sheet returned", body: "Returned by HOD: check 2 students with exam 0 but present at the exam.", at: d(2026, 10, 7, 8, 2), read: false, href: "/lecturer/courses/cosc-333?tab=grades" },
    { id: "n3", kind: "supervision", title: "Chapter submitted", body: "Tobi Adeyemi submitted Chapter 3: System Design (3,550 words).", at: d(2026, 10, 6, 11, 12), read: false, href: "/lecturer/supervision/proj-tobi" },
    { id: "n4", kind: "registration", title: "2 students resubmitted", body: "Registrations resubmitted after your return. See what changed.", at: d(2026, 10, 6, 9), read: false, href: "/lecturer/advising" },
    { id: "n5", kind: "booking", title: "Office-hour booking", body: "Halima Musa booked Wed 2:00 pm — “CA 1 query”.", at: d(2026, 10, 6, 19, 41), read: true, href: "/lecturer/office-hours" },
    { id: "n6", kind: "qa", course: "SENG203", title: "5 unanswered questions", body: "Oldest asked 6 days ago.", at: d(2026, 10, 7, 8), read: true, href: "/lecturer/courses/seng-203?tab=qa" },
    { id: "n7", kind: "registration", title: "Registration closes soon", body: "Level 100 registration closes 18 Oct. 14 students waiting.", at: d(2026, 10, 5, 8), read: true, href: "/lecturer/advising" },
    { id: "n8", kind: "attendance", course: "SEN 201", title: "Attendance disputed", body: "A student disputed an absence on Tue 29 Sep (Group B).", at: d(2026, 9, 30, 13), read: true, href: "/lecturer/courses/sen-201?tab=students" },
    { id: "n9", kind: "system", title: "Course data synced", body: "Course data refreshed. 7 course sections, 335 students.", at: d(2026, 9, 28, 7, 40), read: true, href: "/lecturer/courses" },
  ];
}

// ── Assemble ─────────────────────────────────────────────────────────────────

function createDb(): MockDb {
  const rng = mulberry32(20261007);
  const students = new Map<string, Student>();
  const courses = buildCourses();
  const assessments = buildAssessments();
  const enrolments = buildEnrolments(rng, courses, assessments, students);
  const sessions = buildSessions();
  const studentList = [...students.values()];
  const { projects, requests } = buildProjects(rng);
  projects.forEach((p) => students.set(p.student.id, p.student));
  const registrations = buildRegistrations(rng);
  registrations.forEach((r) => students.set(r.student.id, r.student));

  const bookingStudents = studentList.slice(40, 42);

  return {
    lecturer: {
      instructorId: "NIYI",
      title: "Dr.",
      firstName: "Amos",
      lastName: "Awoniyi",
      email: null,
      phone: null,
      office: null,
      photoUrl: null,
      bio: "I teach software engineering and supervise final-year projects on testing and reliability.",
      school: "School of Computing",
      department: "Software Engineering",
      campus: "Main Campus (Undergraduate)",
      roles: ["lecturer", "course_advisor", "supervisor"],
      levelsApproving: [100],
      researchAreas: ["Software testing", "Fintech reliability"],
      orcid: null,
      publications: [
        { title: "Regression test selection for mobile money platforms", venue: "Babcock Journal of Computing", year: 2025, doi: "10.5555/bjc.2025.112" },
        { title: "Teaching agile with real clients: a Nigerian case study", venue: "ICSE-SEET", year: 2024 },
      ],
      publicFields: { photo: true, email: true, office: true, officeHours: true, courses: true, researchAreas: true, publications: true },
    },
    prefs: { email: true, push: false },
    onboarded: false,
    semesters: [
      { code: "2026/2027.M", session: "2026/2027", term: "M", start: d(2026, 8, 3), end: d(2027, 7, 30), active: true, hasMyClasses: false },
      { code: "2026/2027.1T", session: "2026/2027", term: "1T", start: d(2026, 7, 13), end: d(2026, 12, 22), active: true, hasMyClasses: false },
      { code: "2026/2027.1P", session: "2026/2027", term: "1P", start: d(2026, 8, 2), end: d(2027, 1, 29), active: true, hasMyClasses: false },
      { code: CURRENT, session: "2026/2027", term: "1", start: d(2026, 8, 31), end: d(2027, 2, 26), active: true, hasMyClasses: true },
      { code: "2025/2026.2T", session: "2025/2026", term: "2T", start: d(2026, 1, 5), end: d(2026, 12, 22), active: true, hasMyClasses: false },
      { code: "2025/2026.2", session: "2025/2026", term: "2", start: d(2026, 1, 5), end: d(2026, 7, 17), active: false, hasMyClasses: true },
      { code: "2024/2025.3", session: "2024/2025", term: "3", start: d(2025, 5, 18), end: d(2025, 7, 10), active: false, hasMyClasses: true },
    ],
    courses,
    students,
    enrolments,
    assessments,
    gradeSheets: [
      ...["sen-201:A", "sen-201:B", "sen-201:C"].map((g) => ({ id: `gs-${g}`, courseId: "sen-201", groupId: g, status: "open" as const, dueDate: d(2026, 12, 2, 17), history: [{ status: "open" as const, at: d(2026, 9, 1), by: "Registry" }] })),
      { id: "gs-seng-203", courseId: "seng-203", groupId: "seng-203:SE", status: "open", dueDate: d(2026, 12, 2, 17), history: [{ status: "open", at: d(2026, 9, 1), by: "Registry" }] },
      {
        id: "gs-cosc-333",
        courseId: "cosc-333",
        groupId: "cosc-333:SE",
        status: "returned",
        dueDate: d(2026, 12, 2, 17),
        history: [
          { status: "open", at: d(2026, 9, 1), by: "Registry" },
          { status: "with_hod", at: d(2026, 10, 5, 16), by: "Dr. Amos Awoniyi" },
          { status: "returned", at: d(2026, 10, 7, 8, 2), by: "Prof. Olayinka Adeniran", note: "Check 2 students with exam 0 but present at the exam." },
        ],
        returnNote: "Check 2 students with exam 0 but present at the exam.",
        returnedStudentIds: [],
      },
      ...["bu-csc-333:DE", "bu-csc-333:E"].map((g) => ({ id: `gs-${g}`, courseId: "bu-csc-333", groupId: g, status: "open" as const, dueDate: d(2026, 12, 2, 17), history: [{ status: "open" as const, at: d(2026, 9, 1), by: "Registry" }] })),
    ],
    sessions,
    registers: buildRegisters(sessions, enrolments),
    materials: buildMaterials(),
    announcements: [
      { id: "ann-1", courseId: "sen-201", title: "CA 2 brief is up", body: "The CA 2 assignment brief is in Week 6. Submit online by Saturday 24 October, 11:59 pm.", groupIds: [], pinned: true, alsoEmail: true, sentAt: d(2026, 10, 2, 9, 30), recipients: 163, seenBy: 131 },
    ],
    questions: buildQuestions(studentList.filter((s) => s.id.startsWith("seng203"))),
    registrations,
    advising: { level: 100, advisees: 212, closesAt: d(2026, 10, 18, 23, 59) },
    projects,
    supervisionRequests: requests,
    officeHours: {
      paused: false,
      slots: [
        { id: "oh-wed", day: 3, start: "14:00", end: "16:00", slotMinutes: 15, location: "Room 214, Software Engineering Building", audience: "my-students" },
        { id: "oh-fri", day: 5, start: "10:00", end: "11:00", slotMinutes: 15, location: "Online", online: "https://meet.babcock.edu.ng/awoniyi-oh", audience: "advisees" },
      ],
    },
    bookings: [
      { id: "bk-1", student: bookingStudents[0], date: d(2026, 10, 7), start: "14:00", end: "14:15", topic: "SEN 201", note: "CA 1 query" },
      { id: "bk-2", student: bookingStudents[1], date: d(2026, 10, 7), start: "14:45", end: "15:00", topic: "Project idea", note: "Final-year project on offline payments" },
      { id: "bk-3", student: studentList[90], date: d(2026, 10, 9), start: "10:15", end: "10:30", topic: "Advising", note: "Unsure about carry-over" },
    ],
    notifications: buildNotifications(),
    department: buildDepartment(),
    reports: [],
  };
}

let db: MockDb | null = null;

export function getDb(): MockDb {
  if (!db) {
    db = createDb();
    // Keep the booking notification consistent with the seeded booking.
    const booking = db.bookings[0];
    const n5 = db.notifications.find((n) => n.id === "n5");
    if (n5) n5.body = `${booking.student.firstName} ${booking.student.lastName} booked Wed 2:00 pm — “${booking.note}”.`;
    // COSC333: the HOD highlighted the two exam-0 rows.
    const sheet = db.gradeSheets.find((g) => g.id === "gs-cosc-333")!;
    sheet.returnedStudentIds = db.enrolments.filter((e) => e.courseId === "cosc-333" && e.examScore === 0).map((e) => e.studentId);
  }
  return db;
}

/** Test helper — rebuilds the world. */
export function resetDb() {
  db = null;
}
