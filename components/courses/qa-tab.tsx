"use client";

import { useMemo, useState } from "react";
import { ArrowBigUp, BadgeCheck, ChevronDown, EyeOff, MessageCircleQuestion, MessageSquare, Pin, Send } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { Btn, FilterChip, Pill, timeAgo, Toggle } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import { ApiError } from "@/lib/student/api/http";
import { invalidateStudent } from "@/lib/student/query";
import type { CourseQuestion } from "@/lib/student/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "unanswered" | "mine" | "faq";
type Update = (fn: (qs: CourseQuestion[]) => CourseQuestion[]) => void;

function VoteButton({ count, active, onClick, label }: { count: number; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}, ${count} ${count === 1 ? "vote" : "votes"}`}
      className={cn(
        "inline-flex flex-col items-center justify-center w-11 h-12 rounded-[12px] border text-[12px] font-bold shrink-0 transition-all active:scale-95",
        active ? "border-[#003cbb]/30 bg-[#eef3fd] text-[#003cbb] dark:border-[#4d82ff]/40 dark:bg-[#003cbb]/20 dark:text-[#4d82ff]" : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
      )}
    >
      <ArrowBigUp className={cn("w-5 h-5", active && "fill-current")} />
      <span className="leading-none -mt-0.5 tabular-nums">{count}</span>
    </button>
  );
}

function Composer({ courseId, onPosted }: { courseId: string; onPosted: (q: CourseQuestion) => void }) {
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const q = await studentApi.askQuestion(courseId, body, anon);
      onPosted(q);
      setBody("");
      setFocused(false);
      toast.success("Question posted", { description: "Classmates and your lecturer can answer it now." });
      invalidateStudent("spaces");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't post your question.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-200 dark:border-gray-800 p-4 md:p-5">
      <label htmlFor="ask" className="sr-only">
        Ask a question
      </label>
      <textarea
        id="ask"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        rows={focused || body ? 3 : 1}
        maxLength={1000}
        placeholder={`Ask about ${courseId}…`}
        className="w-full resize-none bg-transparent text-[14px] md:text-[15px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none leading-relaxed transition-[height]"
      />
      {(focused || body) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-200">
          <label className="flex items-center gap-2.5 text-[13px] font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
            <Toggle checked={anon} onChange={setAnon} label="Hide my name from classmates" />
            <EyeOff className="w-4 h-4 text-gray-400" />
            Hide my name from classmates
          </label>
          <Btn icon={Send} loading={busy} disabled={body.trim().length < 10} onClick={submit} className="h-10 sm:h-10">
            Post question
          </Btn>
        </div>
      )}
      {(focused || body) && <p className="text-[11px] text-gray-400 mt-2">Your lecturer always sees who asked. Be kind; posts can be reported.</p>}
    </div>
  );
}

function QuestionCard({ q, courseId, update }: { q: CourseQuestion; courseId: string; update: Update }) {
  const [open, setOpen] = useState(q.answers.length > 0 && q.answers.length <= 2);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const verified = q.answers.find((a) => a.verified);
  const answers = [...q.answers].sort((a, b) => Number(b.verified) - Number(a.verified) || b.upvotes - a.upvotes);

  const vote = () => {
    update((qs) => qs.map((x) => (x.id === q.id ? { ...x, myVote: !x.myVote, upvotes: x.upvotes + (x.myVote ? -1 : 1) } : x)));
    studentApi.voteQuestion(courseId, q.id).catch(() => toast.error("Couldn't save your vote."));
  };
  const voteAnswer = (answerId: string) => {
    update((qs) => qs.map((x) => (x.id === q.id ? { ...x, answers: x.answers.map((a) => (a.id === answerId ? { ...a, myVote: !a.myVote, upvotes: a.upvotes + (a.myVote ? -1 : 1) } : a)) } : x)));
    studentApi.voteAnswer(courseId, q.id, answerId).catch(() => toast.error("Couldn't save your vote."));
  };
  const send = async () => {
    setBusy(true);
    try {
      const a = await studentApi.answerQuestion(courseId, q.id, reply);
      update((qs) => qs.map((x) => (x.id === q.id ? { ...x, answers: [...x.answers, a] } : x)));
      setReply("");
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn't post your answer.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="bg-white dark:bg-gray-900 rounded-[20px] border border-gray-100 dark:border-gray-800 p-4 md:p-5">
      <div className="flex gap-3 md:gap-4">
        <VoteButton count={q.upvotes} active={q.myVote} onClick={vote} label="Upvote question" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {q.pinnedFaq && (
              <Pill tone="purple" icon={Pin}>
                FAQ
              </Pill>
            )}
            {verified ? (
              <Pill tone="green" icon={BadgeCheck}>
                Answered by lecturer
              </Pill>
            ) : q.answers.length === 0 ? (
              <Pill tone="amber">Unanswered</Pill>
            ) : null}
            {q.mine && <Pill tone="blue">You asked</Pill>}
          </div>
          <p className="text-[14px] md:text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug">{q.body}</p>
          <p className="text-[12px] text-gray-400 mt-1.5">
            {q.askedBy ?? "A classmate"} · {timeAgo(q.askedAt)}
          </p>

          <button type="button" onClick={() => setOpen((v) => !v)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#003cbb] dark:text-[#4d82ff]" aria-expanded={open}>
            <MessageSquare className="w-4 h-4" />
            {q.answers.length === 0 ? "Answer" : `${q.answers.length} ${q.answers.length === 1 ? "answer" : "answers"}`}
            <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} />
          </button>

          {open && (
            <div className="mt-3 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {answers.map((a) => (
                <div key={a.id} className={cn("flex gap-3 p-3 md:p-4 rounded-[16px]", a.verified ? "bg-[#effaf6] dark:bg-emerald-500/10 border border-[#cbf5e5] dark:border-emerald-500/20" : "bg-[#f9fafb] dark:bg-gray-800/60")}>
                  <VoteButton count={a.upvotes} active={a.myVote} onClick={() => voteAnswer(a.id)} label="Upvote answer" />
                  <div className="min-w-0 flex-1">
                    {a.verified && (
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#176448] dark:text-emerald-300 mb-1">
                        <BadgeCheck className="w-4 h-4" />
                        Verified by {a.byLecturer ? "your lecturer" : "a TA"}
                      </p>
                    )}
                    <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed">{a.body}</p>
                    <p className="text-[12px] text-gray-400 mt-1.5">
                      {a.author} · {timeAgo(a.at)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex items-end gap-2">
                <label htmlFor={`reply-${q.id}`} className="sr-only">
                  Write an answer
                </label>
                <textarea
                  id={`reply-${q.id}`}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={1}
                  maxLength={1000}
                  placeholder="Write an answer…"
                  className="flex-1 min-h-11 max-h-32 resize-y rounded-[12px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2.5 text-[14px] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none focus:border-[#003cbb] dark:focus:border-[#4d82ff] focus:ring-3 focus:ring-[#003cbb]/10"
                />
                <Btn icon={Send} loading={busy} disabled={reply.trim().length < 2} onClick={send} className="h-11 px-4" aria-label="Post answer">
                  <span className="hidden sm:inline">Reply</span>
                </Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function QaTab({ courseId, questions, update }: { courseId: string; questions: CourseQuestion[]; update: Update }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(
    () => ({ unanswered: questions.filter((q) => q.answers.length === 0).length, mine: questions.filter((q) => q.mine).length, faq: questions.filter((q) => q.pinnedFaq).length }),
    [questions],
  );
  const shown = questions.filter((q) => (filter === "unanswered" ? q.answers.length === 0 : filter === "mine" ? q.mine : filter === "faq" ? q.pinnedFaq : true));

  return (
    <div className="flex flex-col gap-4">
      <Composer courseId={courseId} onPosted={(q) => update((qs) => [q, ...qs])} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} count={questions.length}>
          All
        </FilterChip>
        <FilterChip active={filter === "unanswered"} onClick={() => setFilter("unanswered")} count={counts.unanswered}>
          Unanswered
        </FilterChip>
        <FilterChip active={filter === "faq"} onClick={() => setFilter("faq")} count={counts.faq}>
          FAQ
        </FilterChip>
        <FilterChip active={filter === "mine"} onClick={() => setFilter("mine")} count={counts.mine}>
          My questions
        </FilterChip>
      </div>
      {shown.length === 0 ? (
        <EmptyState icon={MessageCircleQuestion} title={filter === "mine" ? "You haven't asked anything yet" : "Nothing here"} description="Questions asked here help the whole class. Your lecturer can mark the best answer as verified." className="min-h-[220px]" />
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((q) => (
            <QuestionCard key={q.id} q={q} courseId={courseId} update={update} />
          ))}
        </div>
      )}
    </div>
  );
}
