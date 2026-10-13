"use client";

import { useState } from "react";
import { BookOpen, Timer } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard, CourseCardSkeleton } from "@/components/courses/course-card";
import { openStudySheet } from "@/components/student/study-timer";
import { Btn, ErrorPanel, PageContainer } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { useStudentQuery } from "@/lib/student/query";
import { isFeatureEnabled } from "@/lib/features";

export default function CoursesPage() {
  const q = useStudentQuery("spaces", studentApi.listSpaces);
  const [now] = useState(() => Date.now());
  const spaces = q.data ?? [];
  const unread = spaces.reduce((n, s) => n + s.unreadPosts, 0);

  return (
    <PageContainer wide>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 dark:text-gray-100 tracking-tight">My courses</h2>
          <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-0.5">
            {q.data ? `${spaces.length} courses this semester${unread ? ` · ${unread} new ${unread === 1 ? "post" : "posts"}` : ""}` : "Loading your registered courses…"}
          </p>
        </div>
        {isFeatureEnabled("insights") && (
          <Btn variant="soft" icon={Timer} onClick={() => openStudySheet()} className="self-start sm:self-auto">
            Start studying
          </Btn>
        )}
      </div>

      {q.error && !q.data ? (
        <ErrorPanel error={q.error} onRetry={q.refetch} />
      ) : q.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {Array.from({ length: 6 }, (_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses yet" description="Your course spaces appear here once your course registration for this semester is approved." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {spaces.map((s) => (
            <CourseCard key={s.courseId} space={s} now={now} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
