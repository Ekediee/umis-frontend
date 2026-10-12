import { CheckCircle2, Clock, PenLine, Undo2 } from "lucide-react";
import type { Chapter, ChapterState, SupervisionProject } from "@/lib/lecturer/types";
import { Chip } from "../ui/primitives";

export const CHAPTER_STATE: Record<ChapterState, { label: string; tone: "neutral" | "amber" | "red" | "green"; icon: typeof Clock }> = {
  drafting: { label: "Drafting", tone: "neutral", icon: PenLine },
  submitted: { label: "Submitted", tone: "amber", icon: Clock },
  changes_requested: { label: "Changes requested", tone: "red", icon: Undo2 },
  approved: { label: "Approved", tone: "green", icon: CheckCircle2 },
};

export function ChapterChip({ chapter }: { chapter: Pick<Chapter, "state" | "changedAfterApproval"> }) {
  const s = CHAPTER_STATE[chapter.state];
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <Chip tone={s.tone} icon={s.icon}>
        {s.label}
      </Chip>
      {chapter.changedAfterApproval && <Chip tone="amber">Changed after approval</Chip>}
    </span>
  );
}

export function waitingOnYou(p: SupervisionProject) {
  // "Changed after approval" is shown as a badge, not counted as waiting.
  const submitted = p.chapters.filter((c) => c.state === "submitted");
  const oldest = submitted.map((c) => c.submittedAt).filter(Boolean).sort()[0];
  return { count: submitted.length, oldest };
}
