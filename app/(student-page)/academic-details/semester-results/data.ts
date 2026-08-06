export const SEMESTER_DATA_MAP: Record<
  string,
  {
    gpa: number;
    courses: {
      code: string;
      units: number;
      title: string;
      score: number;
      grade: string;
      gp: number;
    }[];
  }
> = {
  "2018/2019.1": {
    gpa: 3.45,
    courses: [
      { code: "COSC 101", units: 3, title: "Introduction to Computer Science", score: 82, grade: "A", gp: 15 },
      { code: "MATH 101", units: 3, title: "General Mathematics I", score: 71, grade: "B", gp: 12 },
      { code: "PHYS 101", units: 3, title: "General Physics I", score: 62, grade: "C", gp: 9 },
      { code: "CHEM 101", units: 3, title: "General Chemistry I", score: 55, grade: "D", gp: 6 },
      { code: "GEDS 101", units: 2, title: "Philosophy of Science and Technology", score: 91, grade: "A", gp: 10 },
      { code: "MATH 103", units: 3, title: "Trigonometry & Algebra", score: 68, grade: "C", gp: 9 },
      { code: "PHYS 103", units: 2, title: "Physics Practical I", score: 85, grade: "A", gp: 10 },
      { code: "CHEM 103", units: 3, title: "Chemistry Practical I", score: 58, grade: "D", gp: 6 },
    ],
  },
  "2018/2019.2": {
    gpa: 3.77,
    courses: [
      { code: "COSC 102", units: 3, title: "Introduction to Problem Solving", score: 85, grade: "A", gp: 15 },
      { code: "MATH 102", units: 3, title: "General Mathematics II", score: 78, grade: "B", gp: 12 },
      { code: "PHYS 102", units: 3, title: "General Physics II", score: 72, grade: "B", gp: 12 },
      { code: "CHEM 102", units: 3, title: "General Chemistry II", score: 66, grade: "C", gp: 9 },
      { code: "GEDS 102", units: 2, title: "Babcock History & Heritage", score: 94, grade: "A", gp: 10 },
      { code: "COSC 104", units: 3, title: "Computer Programming I", score: 80, grade: "A", gp: 15 },
      { code: "MATH 104", units: 3, title: "Vector Analysis", score: 58, grade: "D", gp: 6 },
      { code: "PHYS 104", units: 2, title: "Experimental Physics II", score: 76, grade: "B", gp: 8 },
    ],
  },
  "2018/2019.3": {
    gpa: 4.38,
    courses: [
      { code: "COSC 191", units: 3, title: "Summer Coding Intensive", score: 92, grade: "A", gp: 15 },
      { code: "GEDS 192", units: 2, title: "Basic French Language", score: 88, grade: "A", gp: 10 },
      { code: "MATH 193", units: 3, title: "Introductory Statistics", score: 79, grade: "B", gp: 12 },
    ],
  },
  "2019/2020.1": {
    gpa: 3.35,
    courses: [
      { code: "COSC 201", units: 3, title: "Computer Programming II", score: 74, grade: "B", gp: 12 },
      { code: "COSC 211", units: 3, title: "Object Oriented Programming", score: 81, grade: "A", gp: 15 },
      { code: "MATH 201", units: 3, title: "Linear Algebra I", score: 52, grade: "D", gp: 6 },
      { code: "PHYS 201", units: 3, title: "Modern Physics", score: 63, grade: "C", gp: 9 },
      { code: "COSC 221", units: 3, title: "Digital Logic Design", score: 69, grade: "C", gp: 9 },
      { code: "GEDS 201", units: 2, title: "Communication in English II", score: 86, grade: "A", gp: 10 },
      { code: "COSC 231", units: 3, title: "Data Structures & Algorithms", score: 58, grade: "D", gp: 6 },
    ],
  },
  "2019/2020.2": {
    gpa: 4.00,
    courses: [
      { code: "COSC 202", units: 3, title: "Software Engineering Methodologies", score: 88, grade: "A", gp: 15 },
      { code: "COSC 212", units: 4, title: "Mobile Application Development (Androids)", score: 82, grade: "A", gp: 20 },
      { code: "MATH 202", units: 3, title: "Linear Algebra II", score: 73, grade: "B", gp: 12 },
      { code: "COSC 222", units: 3, title: "Computer Architecture", score: 77, grade: "B", gp: 12 },
      { code: "GEDS 202", units: 2, title: "Introduction to Sociology", score: 91, grade: "A", gp: 10 },
      { code: "COSC 242", units: 3, title: "Database Systems I", score: 68, grade: "C", gp: 9 },
      { code: "COSC 299", units: 3, title: "Student Industrial Work Experience (SIWES)", score: 95, grade: "A", gp: 15 },
    ],
  },
};
