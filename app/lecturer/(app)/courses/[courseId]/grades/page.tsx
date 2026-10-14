import type { Metadata } from "next";
import { Suspense } from "react";
import { GradeSheetView } from "@/components/lecturer/grades/grade-sheet-view";

export const metadata: Metadata = { title: "Grade sheet" };

export default async function GradeSheetPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return (
    <Suspense>
      <GradeSheetView courseId={courseId} />
    </Suspense>
  );
}
