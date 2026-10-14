import type { Metadata } from "next";
import { ScoresView } from "@/components/lecturer/grades/scores-view";

export const metadata: Metadata = { title: "Enter scores" };

export default async function ScoresPage({ params }: { params: Promise<{ courseId: string; assessmentId: string }> }) {
  const { courseId, assessmentId } = await params;
  return <ScoresView courseId={courseId} assessmentId={decodeURIComponent(assessmentId)} />;
}
