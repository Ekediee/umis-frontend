import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendanceFlow } from "@/components/lecturer/attendance/attendance-flow";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return (
    <Suspense>
      <AttendanceFlow courseId={courseId} />
    </Suspense>
  );
}
