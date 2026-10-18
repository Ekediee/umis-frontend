"use client";

/** 4.5 Course Q&A: newest unanswered first; answer, mark covered in class, or pin as FAQ. */

import { useState } from "react";
import { CheckCheck, EyeOff, MessageCircleQuestion, Pin, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Question } from "@/lib/lecturer/types";
import { Btn, CardSkeleton, Chip, ErrorState, ExplainedEmpty, Segmented, Surface, Textarea } from "../ui/primitives";

export function QaTab({ course }: { course: CourseSummary }) {
  const key = `qa:${course.id}`;
  const q = useLecturerQuery(key, () => lecturerApi.getQuestions(course.id));
  const [filter, setFilter] = useState<"open" | "answered" | "faq">("open");

  if (q.error) return <ErrorState error={q.error} screen="Q&A" onRetry={q.refetch} />;
  if (!q.data) return <CardSkeleton rows={3} />;

  const isOpen = (x: Question) => !x.answer && !x.coveredInClass;
  const list = q.data.filter((x) => (filter === "open" ? isOpen(x) : filter === "faq" ? x.pinnedFaq : !isOpen(x)));

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        ariaLabel="Question filter"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Unanswered", count: q.data.filter(isOpen).length },
          { value: "answered", label: "Answered", count: q.data.filter((x) => !isOpen(x)).length },
          { value: "faq", label: "FAQ", count: q.data.filter((x) => x.pinnedFaq).length },
        ]}
      />
      {list.length === 0 ? (
        <ExplainedEmpty
          compact
          icon={MessageCircleQuestion}
          title={filter === "open" ? "All questions answered" : "Nothing here yet"}
          reason={filter === "open" ? "Students ask here so everyone sees the answer. Answers notify the asker and anyone who upvoted." : "Pin useful answers as FAQ so they stay at the top."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((x) => (
            <QuestionCard key={x.id} q={x} invalidateKey={key} courseId={course.id} />
          ))}
        </ul>
      )}
      <p className="text-[12px] text-gray-500">Students can be anonymous to classmates, never to you. Use direct messages for private matters like illness or grade queries.</p>
    </div>
  );
}

function QuestionCard({ q, invalidateKey, courseId }: { q: Question; invalidateKey: string; courseId: string }) {
  const [answer, setAnswer] = useState("");
  const [composing, setComposing] = useState(false);
  const answerM = useMutation(lecturerApi.answerQuestion, { invalidates: [invalidateKey, `course:${courseId}`, "today:"] });
  const update = useMutation(lecturerApi.updateQuestion, { invalidates: [invalidateKey, `course:${courseId}`, "today:"] });
  const now = appNow();

  return (
    <li>
      <Surface className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex min-w-[44px] flex-col items-center rounded-xl bg-gray-50 py-1.5 text-gray-600 dark:bg-gray-800 dark:text-gray-300" aria-label={`${q.upvotes} upvotes`}>
            <ThumbsUp className="size-4" />
            <span className="text-[13px] font-bold tabular-nums">{q.upvotes}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{q.body}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
              {q.askedBy}
              {q.anonymousToClassmates && (
                <span className="inline-flex items-center gap-1">
                  <EyeOff className="size-3" /> anonymous to classmates
                </span>
              )}
              · {timeAgo(q.askedAt, now)}
              {q.pinnedFaq && (
                <Chip tone="blue" icon={Pin} className="h-5 text-[11px]">
                  FAQ
                </Chip>
              )}
              {q.coveredInClass && (
                <Chip tone="green" className="h-5 text-[11px]">
                  Covered in class
                </Chip>
              )}
            </p>
          </div>
        </div>
        {q.answer && (
          <div className="ml-[56px] rounded-2xl bg-[#f5f8fe] p-3 text-[14px] text-gray-800 dark:bg-[#003cbb]/15 dark:text-gray-200">
            {q.answer.body}
            <p className="mt-1 text-[11px] text-gray-500">You · {timeAgo(q.answer.at, now)}</p>
          </div>
        )}
        {composing && (
          <div className="ml-[56px] flex flex-col gap-2">
            <Textarea data-autofocus value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} aria-label="Your answer" placeholder="Your answer is visible to the whole class" />
            <div className="flex justify-end gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setComposing(false)}>
                Cancel
              </Btn>
              <Btn
                size="sm"
                loading={answerM.pending}
                disabled={answer.trim().length < 2}
                onClick={async () => {
                  const r = await answerM.mutate(q.id, answer.trim()).catch(() => undefined);
                  if (r) toast.success(`Answer posted · ${r.notified} students notified`);
                }}
              >
                Post answer
              </Btn>
            </div>
          </div>
        )}
        {!composing && (
          <div className="ml-[56px] flex flex-wrap gap-2">
            {!q.answer && (
              <Btn size="sm" onClick={() => setComposing(true)}>
                Answer
              </Btn>
            )}
            {!q.answer && !q.coveredInClass && (
              <Btn size="sm" variant="secondary" icon={CheckCheck} disabled={update.pending} onClick={() => update.mutate(q.id, { coveredInClass: true }).then(() => toast.success("Marked as covered in class"))}>
                Covered in class
              </Btn>
            )}
            {q.answer && (
              <Btn size="sm" variant="secondary" icon={Pin} disabled={update.pending} onClick={() => update.mutate(q.id, { pinnedFaq: !q.pinnedFaq })}>
                {q.pinnedFaq ? "Unpin FAQ" : "Pin as FAQ"}
              </Btn>
            )}
          </div>
        )}
      </Surface>
    </li>
  );
}
