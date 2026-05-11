export interface Course {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  level: string;
  units: number;
  type: "Core" | "Elective";
  isCompulsory: boolean;
  isCarryOver?: boolean;
}

export const MOCK_COURSES: Course[] = [
  { id: "co1", code: "COSC 101", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2, type: "Core", isCompulsory: true, isCarryOver: true },
  { id: "co2", code: "COSC 105", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2, type: "Core", isCompulsory: true, isCarryOver: true },
  { id: "1", code: "COSC 204", title: "Designing and Development of Object Oriented Software", lecturer: "Maitanmi S.O", level: "200L", units: 2, type: "Core", isCompulsory: true },
  { id: "2", code: "COSC 202", title: "Advanced Database Management Systems", lecturer: "Johnson R.T", level: "200L", units: 3, type: "Core", isCompulsory: false },
  { id: "3", code: "COSC 200", title: "Web Application Development", lecturer: "Adams P.L", level: "200L", units: 3, type: "Core", isCompulsory: false },
  { id: "4", code: "BU-GST 201", title: "Artificial Intelligence Principles", lecturer: "Nguyen A.K", level: "200L", units: 4, type: "Core", isCompulsory: false },
  { id: "5", code: "COSC 268", title: "Mobile Application Development", lecturer: "Peterson J.E", level: "200L", units: 3, type: "Core", isCompulsory: false },
  { id: "6", code: "BU-GST 205", title: "Software Engineering", lecturer: "Williams H.J", level: "200L", units: 4, type: "Core", isCompulsory: true },
  { id: "7", code: "SENG 270", title: "Computer Networks", lecturer: "Rodriguez T.F", level: "200L", units: 3, type: "Elective", isCompulsory: false },
  { id: "8", code: "ITGY 271", title: "Human-Computer Interaction", lecturer: "Lee M.N", level: "200L", units: 3, type: "Elective", isCompulsory: false },
  { id: "9", code: "COSC 872", title: "Data Structures and Algorithms", lecturer: "Singh R.V", level: "200L", units: 2, type: "Elective", isCompulsory: false },
];
