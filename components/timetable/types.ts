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
