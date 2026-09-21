export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface TimetableSession {
  id: string;
  code: string;
  title: string;
  lecturer: string;
  venue: string;
  day: DayOfWeek;
  startTime: string; // Format: "HH:mm" (24-hour)
  endTime: string;
  type: 'lecture' | 'lab' | 'break';
}

export const TIMETABLE_SESSIONS: TimetableSession[] = [
  {
    id: '1',
    code: 'COSC 204',
    title: 'Software Engineering Principles',
    lecturer: 'Maitanmi S.O',
    venue: 'Lab 3 — Software',
    day: 'Mon',
    startTime: '07:00',
    endTime: '09:00',
    type: 'lab',
  },
  {
    id: '2',
    code: 'COSC 872',
    title: 'Advanced Computing',
    lecturer: 'Adebayo T.A',
    venue: 'CST Hall B',
    day: 'Tue',
    startTime: '08:00',
    endTime: '10:00',
    type: 'lecture',
  },
  {
    id: '3',
    code: 'COSC 200',
    title: 'Introduction to Programming',
    lecturer: 'Adams P.L',
    venue: 'CST Hall A',
    day: 'Wed',
    startTime: '09:00',
    endTime: '11:00',
    type: 'lecture',
  },
  {
    id: '4',
    code: 'BU-GST 205',
    title: 'General Studies',
    lecturer: 'Adeyemi F.O',
    venue: 'LT 12',
    day: 'Thu',
    startTime: '09:30',
    endTime: '11:30',
    type: 'lecture',
  },
  {
    id: '5',
    code: 'SENG 270',
    title: 'Software Architecture',
    lecturer: 'Rodriguez T.F',
    venue: 'CST Hall A',
    day: 'Fri',
    startTime: '10:00',
    endTime: '12:00',
    type: 'lecture',
  },
  {
    id: '6',
    code: 'COSC 202',
    title: 'Data Structures',
    lecturer: 'Oluwaseun S.',
    venue: 'LT 12',
    day: 'Tue',
    startTime: '11:00',
    endTime: '13:00',
    type: 'lecture',
  },
  {
    id: 'break-1',
    code: 'BREAK',
    title: 'Lunch Break',
    lecturer: '',
    venue: '',
    day: 'Mon',
    startTime: '13:00',
    endTime: '14:00',
    type: 'break',
  },
  {
    id: '7',
    code: 'COSC 270',
    title: 'Networks Lab',
    lecturer: 'Maitanmi S.O',
    venue: 'Lab 5 — Networks',
    day: 'Wed',
    startTime: '14:00',
    endTime: '16:00',
    type: 'lab',
  },
  {
    id: '8',
    code: 'COSC 268',
    title: 'Operating Systems',
    lecturer: 'Adeyemi F.O',
    venue: 'Lab 3 — Software',
    day: 'Thu',
    startTime: '15:00',
    endTime: '16:30',
    type: 'lecture',
  },
  {
    id: '9',
    code: 'ITGY 271',
    title: 'Information Technology',
    lecturer: 'Maitanmi S.O',
    venue: 'Lab 3 — Software',
    day: 'Fri',
    startTime: '16:30',
    endTime: '18:00',
    type: 'lecture',
  },
];

