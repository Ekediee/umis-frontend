import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TimetableSession } from "../data/mock-data";

interface ListViewProps {
  sessions: TimetableSession[];
  onSessionClick: (session: TimetableSession) => void;
}

export function ListView({ sessions, onSessionClick }: ListViewProps) {
  // Sort sessions by day and time
  const dayOrder: Record<string, number> = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };
  
  const sortedSessions = [...sessions].sort((a, b) => {
    if (dayOrder[a.day] !== dayOrder[b.day]) {
      return dayOrder[a.day] - dayOrder[b.day];
    }
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-b-2xl  border border-t-0 border-gray-100 dark:border-gray-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-[#F8FAFC] dark:bg-gray-800/50">
          <TableRow className="hover:bg-transparent border-b-gray-100 dark:border-b-gray-800">
            <TableHead className="w-[200px] text-[12px] font-semibold text-gray-500 tracking-wider">CODE</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 tracking-wider">LECTURER</TableHead>
            <TableHead className="text-[12px] font-semibold text-gray-500 tracking-wider">VENUE</TableHead>
            <TableHead className="text-right text-[12px] font-semibold text-gray-500 tracking-wider">DAY/TIME</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSessions.map((session) => (
            <TableRow 
              key={session.id}
              onClick={() => onSessionClick(session)}
              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b-gray-100 dark:border-b-gray-800 transition-colors"
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{session.code}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{session.title}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300 font-medium">
                {session.lecturer || '-'}
              </TableCell>
              <TableCell className="text-gray-700 dark:text-gray-300">
                {session.venue || '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{session.day} {session.startTime}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{session.endTime}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedSessions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                No sessions scheduled.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

