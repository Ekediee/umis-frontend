import { Suspense } from "react";
import { CourseWorkspace } from "@/components/lecturer/course/course-workspace";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return (
    <Suspense>
      <CourseWorkspace courseId={courseId} />
    </Suspense>
  );
}
