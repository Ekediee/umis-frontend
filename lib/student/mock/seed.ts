/**
 * Deterministic demo content for the student features. Content is generated
 * per course code, so it works with the courses the live registration API
 * returns as well as with the demo course list below.
 */

import type { Material } from "@/lib/lecturer/types";
import type { AttendanceMark, Classmate, CourseQuestion, Deadline, FeedPost } from "../types";

export interface SeedCourse {
  courseId: string;
  title: string;
  instructor: string;
  units: number;
  isCarryOver: boolean;
  classOption?: string;
}

/** Matches the timetable demo data so Today, Timetable and Courses agree. */
export const DEMO_COURSES: SeedCourse[] = [
  { courseId: "COSC 204", title: "Software Engineering Principles", instructor: "Maitanmi S.O", units: 3, isCarryOver: false },
  { courseId: "COSC 202", title: "Data Structures", instructor: "Oluwaseun S.", units: 3, isCarryOver: false },
  { courseId: "SENG 270", title: "Software Architecture", instructor: "Rodriguez T.F", units: 3, isCarryOver: false },
  { courseId: "COSC 200", title: "Introduction to Programming", instructor: "Adams P.L", units: 2, isCarryOver: false },
  { courseId: "BU-GST 205", title: "General Studies", instructor: "Adeyemi F.O", units: 2, isCarryOver: false },
];

export function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Small seeded PRNG so every reload shows the same demo data. */
export function rng(seed: string) {
  let s = hash(seed) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

const slug = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const hoursFrom = (now: number, h: number) => new Date(now + h * 3600_000).toISOString();

const TOPICS = ["Introduction and course outline", "Core concepts", "Worked examples", "Case study", "Mid-semester review", "Applied lab", "Revision guide"];
const FIRST = ["Tobi", "Amaka", "David", "Funmi", "Kelechi", "Zainab", "Samuel", "Precious", "Daniel", "Ife", "Chidera", "Bola"];
const LAST = ["Adeyemi", "Okafor", "Bello", "Eze", "Ojo", "Ibrahim", "Nwosu", "Lawal", "Ogunleye", "Musa", "Uche", "Afolabi"];

export function seedFeed(c: SeedCourse, now: number): FeedPost[] {
  const r = rng(`feed:${c.courseId}`);
  const posts: FeedPost[] = [
    {
      id: `${slug(c.courseId)}-p1`,
      courseId: c.courseId,
      kind: "announcement",
      title: "Welcome to the course",
      body: `Course outline, grading and office hours are in Resources. Bring a laptop to the first lab. Questions go in Q&A so everyone benefits from the answer.`,
      author: c.instructor,
      pinned: true,
      sentAt: hoursFrom(now, -24 * 30),
      read: true,
    },
    {
      id: `${slug(c.courseId)}-p2`,
      courseId: c.courseId,
      kind: "material",
      title: `Week ${4 + Math.floor(r() * 2)} slides are up`,
      body: `${TOPICS[Math.floor(r() * TOPICS.length)]}. Read before Thursday's class.`,
      author: c.instructor,
      pinned: false,
      sentAt: hoursFrom(now, -26),
      materialId: `${slug(c.courseId)}-m4`,
      read: false,
    },
  ];
  if (r() > 0.45) {
    posts.push({
      id: `${slug(c.courseId)}-p3`,
      courseId: c.courseId,
      kind: "venue-change",
      title: "Venue change for next class",
      body: "Next class moves to the Amphitheatre because of the departmental seminar. Same time.",
      author: c.instructor,
      pinned: false,
      sentAt: hoursFrom(now, -5),
      read: false,
    });
  }
  if (r() > 0.75) {
    posts.push({
      id: `${slug(c.courseId)}-p4`,
      courseId: c.courseId,
      kind: "cancellation",
      title: "Friday class cancelled",
      body: "I'm at a conference. A recorded lecture will be posted in Resources, and the quiz moves to next week.",
      author: c.instructor,
      pinned: false,
      sentAt: hoursFrom(now, -50),
      read: true,
    });
  }
  return posts.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.sentAt.localeCompare(a.sentAt));
}

export function seedMaterials(c: SeedCourse, now: number): Material[] {
  const s = slug(c.courseId);
  const kinds: Material["kind"][] = ["pdf", "pptx", "pptx", "pdf", "pptx", "docx"];
  return kinds.map((kind, i) => ({
    id: `${s}-m${i}`,
    courseId: c.courseId,
    week: i === 0 ? 0 : i,
    name: i === 0 ? `${c.courseId} course outline` : i === 5 ? `${c.courseId} past questions (2024/2025)` : `Week ${i}: ${TOPICS[i % TOPICS.length]}`,
    kind,
    sizeKb: 300 + ((hash(`${s}${i}`) % 4200) | 0),
    url: undefined,
    groupIds: [],
    releaseAt: hoursFrom(now, -24 * (35 - i * 6)),
  }));
}

export function seedQuestions(c: SeedCourse, now: number): CourseQuestion[] {
  const s = slug(c.courseId);
  const r = rng(`qa:${c.courseId}`);
  const name = () => `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)][0]}.`;
  return [
    {
      id: `${s}-q1`,
      courseId: c.courseId,
      body: "Will the mid-semester test cover week 5, or only weeks 1 to 4?",
      askedBy: name(),
      mine: false,
      upvotes: 14,
      myVote: false,
      askedAt: hoursFrom(now, -40),
      pinnedFaq: true,
      answers: [
        { id: `${s}-q1-a1`, body: "Weeks 1 to 4 only. Week 5 will be in the final exam.", author: c.instructor, at: hoursFrom(now, -38), upvotes: 9, myVote: false, verified: true, byLecturer: true },
        { id: `${s}-q1-a2`, body: "He also said in class that the test is 45 minutes, multiple choice and short answers.", author: name(), at: hoursFrom(now, -37), upvotes: 3, myVote: false, verified: false, byLecturer: false },
      ],
    },
    {
      id: `${s}-q2`,
      courseId: c.courseId,
      body: "Can someone explain the difference between the two approaches in the week 3 slides? Slide 14 confused me.",
      askedBy: null,
      mine: false,
      upvotes: 6,
      myVote: false,
      askedAt: hoursFrom(now, -20),
      answers: [
        { id: `${s}-q2-a1`, body: "The first keeps state in one place; the second spreads it across components. Slide 16 has a diagram that helped me.", author: name(), at: hoursFrom(now, -18), upvotes: 4, myVote: false, verified: false, byLecturer: false },
      ],
    },
    {
      id: `${s}-q3`,
      courseId: c.courseId,
      body: "Is the assignment submitted individually or in groups?",
      askedBy: name(),
      mine: false,
      upvotes: 2,
      myVote: false,
      askedAt: hoursFrom(now, -3),
      answers: [],
    },
  ];
}

export function seedClassmates(c: SeedCourse): Classmate[] {
  const r = rng(`mates:${c.courseId}`);
  return Array.from({ length: 8 + Math.floor(r() * 10) }, (_, i) => ({
    id: `${slug(c.courseId)}-st${i}`,
    name: `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`,
    department: "Computer Science",
    level: 200,
  }));
}

export function seedDeadlines(courses: SeedCourse[], now: number): Deadline[] {
  const offsets = [20, 52, 110, 160, -30];
  const titles: [Deadline["kind"], string][] = [
    ["assignment", "Assignment 2"],
    ["test", "Mid-semester test"],
    ["project", "Group project proposal"],
    ["assignment", "Lab report 3"],
    ["assignment", "Assignment 1"],
  ];
  return courses.slice(0, 5).map((c, i) => ({
    id: `${slug(c.courseId)}-d${i}`,
    courseId: c.courseId,
    kind: titles[i][0],
    title: titles[i][1],
    dueAt: hoursFrom(now, offsets[i]),
    submitted: offsets[i] < 0,
  }));
}

/** Past class history. The last course sits just under the 75% line, so warnings have something to show. */
export function seedAttendance(c: SeedCourse, index: number, total: number, now: number): { date: string; mark: AttendanceMark }[] {
  const r = rng(`att:${c.courseId}`);
  const held = 10 + Math.floor(r() * 3);
  const atRisk = index === total - 1;
  const watch = index === 1;
  return Array.from({ length: held }, (_, i) => {
    const date = new Date(now - (held - i) * 3.5 * 86400_000).toISOString().slice(0, 10);
    const roll = r();
    let mark: AttendanceMark = "present";
    if (atRisk) mark = roll < 0.3 ? "absent" : roll < 0.4 ? "late" : "present";
    else if (watch) mark = roll < 0.18 ? "absent" : roll < 0.28 ? "late" : "present";
    else mark = roll < 0.06 ? "absent" : roll < 0.14 ? "late" : roll < 0.17 ? "excused" : "present";
    return { date, mark };
  });
}
