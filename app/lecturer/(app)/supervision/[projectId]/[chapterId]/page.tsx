"use client";

/**
 * 7.4 Chapter review: highlight text → comment (with optional proposed wording),
 * "Changes since last review" from version history, citation audit panel,
 * AI-assisted tags (information, not a penalty). 7.4a request changes · 7.4b approve.
 * Supervisors never edit the student's text.
 */

import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, GitCompare, MessageSquarePlus, Quote, Sparkles, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { daysBetween, fullName, plural, timeAgo } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Paragraph, ReviewComment } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { ChapterChip } from "@/components/lecturer/supervision/chapter-state";
import { BackButton, Btn, CardSkeleton, ErrorState, Field, Input, Surface, Textarea, Toggle } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

interface Draft {
  paragraphId: string;
  quote: string;
}

export default function ChapterReviewPage() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const router = useRouter();
  const key = `supervision:project:${projectId}`;
  const q = useLecturerQuery(key, () => lecturerApi.getProject(projectId));
  const [showChanges, setShowChanges] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [floating, setFloating] = useState<{ x: number; y: number; draft: Draft } | null>(null);
  const [decision, setDecision] = useState<"changes" | "approve" | null>(null);
  const [focusPid, setFocusPid] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);
  const del = useMutation((id: string) => lecturerApi.deleteReviewComment(projectId, chapterId, id), { invalidates: [key] });
  const now = appNow();

  const project = q.data;
  const chapter = project?.chapters.find((c) => c.id === chapterId);

  const onSelect = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !articleRef.current) return setFloating(null);
    const text = sel.toString().trim();
    const range = sel.getRangeAt(0);
    const startP = (range.startContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-pid]");
    const endP = (range.endContainer.parentElement as HTMLElement | null)?.closest<HTMLElement>("[data-pid]");
    if (!text || !startP || startP !== endP) return setFloating(null);
    const rect = range.getBoundingClientRect();
    const box = articleRef.current.getBoundingClientRect();
    setFloating({ x: rect.left - box.left + rect.width / 2, y: rect.top - box.top - 8, draft: { paragraphId: startP.dataset.pid!, quote: text.slice(0, 240) } });
  }, []);

  const open = useMemo(() => chapter?.comments.filter((c) => !c.resolved) ?? [], [chapter]);
  const newThisReview = useMemo(() => open.filter((c) => !chapter?.submittedAt || c.at >= chapter.submittedAt), [open, chapter]);

  if (q.error)
    return (
      <div className="p-6">
        <ErrorState error={q.error} screen="Chapter review" onRetry={q.refetch} />
      </div>
    );
  if (!project || !chapter)
    return (
      <div className="p-6">
        <CardSkeleton rows={6} />
      </div>
    );

  const reviewing = chapter.state === "submitted" || chapter.changedAfterApproval;
  const order = new Map(chapter.paragraphs.map((p, i) => [p.id, i]));
  const sortedComments = [...chapter.comments].sort((a, b) => (order.get(a.paragraphId) ?? 0) - (order.get(b.paragraphId) ?? 0));

  return (
    <div className="flex min-h-full flex-col">
      {/* Sticky review header */}
      <div className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="min-w-0">
            <BackButton href={`/lecturer/supervision/${project.id}`} to={`${fullName(project.student)}'s ${project.type.toLowerCase()}`} className="mb-2" />
            <p className="text-[12px] font-medium text-gray-500">
              {fullName(project.student)} · {project.type}
            </p>
            <h1 className="truncate text-[18px] font-bold tracking-tight text-gray-900 md:text-[20px] dark:text-gray-50">
              Chapter {chapter.number}: {chapter.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChapterChip chapter={chapter} />
            <span className="text-[12px] text-gray-500">
              {chapter.words.toLocaleString()} words
              {chapter.submittedAt && ` · submitted ${daysBetween(chapter.submittedAt, now)} d ago`}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1280px] flex-1 gap-6 px-4 py-6 pb-40 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl bg-white px-4 py-1 ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800">
            <div className="min-w-[240px] flex-1">
              <Toggle id="changes" checked={showChanges} onChange={setShowChanges} label="Changes since last review" description="From the chapter's version history" />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-500">
              <Sparkles className="size-3.5 text-purple-500" /> AI tag = rewritten with Improve with AI in Pulse
            </span>
          </div>
          {!reviewing && (
            <p className="mb-4 rounded-2xl bg-gray-100 px-4 py-3 text-[13px] text-gray-700 dark:bg-gray-800 dark:text-gray-300">This chapter isn&apos;t waiting for review. You can still read it and leave comments.</p>
          )}

          <article ref={articleRef} onMouseUp={onSelect} onTouchEnd={() => setTimeout(onSelect, 50)} className="relative rounded-[20px] bg-white px-5 py-6 font-serif text-[17px] leading-[1.75] text-gray-900 ring-1 ring-gray-200 md:px-10 md:py-10 dark:bg-gray-900 dark:text-gray-100 dark:ring-gray-800">
            {chapter.paragraphs.map((p, i) => (
              <ParagraphView key={p.id} p={p} index={i} comments={chapter.comments.filter((c) => c.paragraphId === p.id)} showChanges={showChanges} focused={focusPid === p.id} onComment={() => setDraft({ paragraphId: p.id, quote: "" })} />
            ))}
            {floating && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setDraft(floating.draft);
                  setFloating(null);
                  window.getSelection()?.removeAllRanges();
                }}
                className="absolute z-20 inline-flex -translate-x-1/2 -translate-y-full items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 font-sans text-[13px] font-semibold text-white shadow-xl dark:bg-white dark:text-gray-900"
                style={{ left: floating.x, top: floating.y }}
              >
                <MessageSquarePlus className="size-4" /> Comment
              </button>
            )}
          </article>
          <p className="mt-3 font-sans text-[12px] text-gray-500">Select any text to comment on it, or use the comment button beside a paragraph. Comments thread per highlight; the student resolves them.</p>
        </div>

        <aside className="flex flex-col gap-4 font-sans lg:sticky lg:top-24 lg:self-start">
          <Surface>
            <h2 className="mb-3 flex items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-gray-100">
              Comments <span className="rounded-full bg-gray-100 px-2 text-[12px] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{open.length} open</span>
            </h2>
            {sortedComments.length === 0 ? (
              <p className="text-[13px] text-gray-500">No comments yet. Highlight a passage to start.</p>
            ) : (
              <ul className="flex max-h-[44vh] flex-col gap-3 overflow-y-auto pr-1">
                {sortedComments.map((c) => (
                  <CommentCard key={c.id} c={c} now={now} onFocus={() => setFocusPid(c.paragraphId)} onDelete={c.resolved ? undefined : () => del.mutate(c.id)} />
                ))}
              </ul>
            )}
          </Surface>
          <Surface>
            <h2 className="mb-1 flex items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-gray-100">
              <Quote className="size-4" /> Citations
            </h2>
            <p className="mb-3 text-[13px] text-gray-500">{chapter.citations} citations · last audit {chapter.citationFlags.length ? `${chapter.citationFlags.length} flags` : "clean"}</p>
            <ul className="flex flex-col gap-2">
              {chapter.citationFlags.map((f) => (
                <li key={f.source} className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    <strong className="font-semibold">{f.source}</strong> · {f.issue === "missing-doi" ? "missing DOI" : "unverified source"}
                  </span>
                </li>
              ))}
              {chapter.citationFlags.length === 0 && (
                <li className="flex items-center gap-2 text-[13px] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" /> Citation audit clean
                </li>
              )}
            </ul>
          </Surface>
        </aside>
      </div>

      {/* Decision bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur md:pl-[calc(16rem+2rem)] dark:border-gray-800 dark:bg-gray-900/95">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 md:px-4">
          <p className="hidden flex-1 text-[13px] text-gray-500 md:block">{plural(newThisReview.length, "new comment")} in this review</p>
          <Btn size="lg" variant="secondary" icon={Undo2} className="flex-1 md:flex-none" onClick={() => setDecision("changes")}>
            Request changes
          </Btn>
          <Btn size="lg" variant="success" icon={Check} className="flex-1 md:flex-none" disabled={chapter.state === "approved" && !chapter.changedAfterApproval} onClick={() => setDecision("approve")}>
            Approve chapter
          </Btn>
        </div>
      </div>

      <CommentSheet draft={draft} paragraph={chapter.paragraphs.find((p) => p.id === draft?.paragraphId)} onClose={() => setDraft(null)} projectId={projectId} chapterId={chapterId} invalidateKey={key} />
      <DecisionSheet kind={decision} onClose={() => setDecision(null)} projectId={projectId} chapterId={chapterId} chapterLabel={`Chapter ${chapter.number}: ${chapter.title}`} commentCount={newThisReview.length} invalidateKey={key} onDone={() => router.push(`/lecturer/supervision/${projectId}`)} />
    </div>
  );
}

function ParagraphView({ p, index, comments, showChanges, focused, onComment }: { p: Paragraph; index: number; comments: ReviewComment[]; showChanges: boolean; focused: boolean; onComment: () => void }) {
  // Wrap each commented quote in a <mark>.
  const parts = useMemo(() => {
    const quotes = comments.map((c) => c.quote).filter(Boolean);
    if (!quotes.length) return [{ text: p.text, mark: false, resolved: false }];
    const out: { text: string; mark: boolean; resolved: boolean }[] = [];
    let rest = p.text;
    const sorted = comments.filter((c) => c.quote && p.text.includes(c.quote)).sort((a, b) => p.text.indexOf(a.quote) - p.text.indexOf(b.quote));
    let cursor = 0;
    for (const c of sorted) {
      const at = p.text.indexOf(c.quote, cursor);
      if (at < 0) continue;
      out.push({ text: p.text.slice(cursor, at), mark: false, resolved: false });
      out.push({ text: c.quote, mark: true, resolved: c.resolved });
      cursor = at + c.quote.length;
    }
    rest = p.text.slice(cursor);
    out.push({ text: rest, mark: false, resolved: false });
    return out;
  }, [p.text, comments]);

  return (
    <div className={cn("group relative -mx-3 mb-5 rounded-xl px-3 transition-colors md:-mx-4 md:px-4", showChanges && p.changedSinceReview && "mt-6 pt-3 pb-1 bg-emerald-50/80 ring-1 ring-emerald-100 dark:bg-emerald-950/25 dark:ring-emerald-900/40", focused && "ring-2 ring-[#003cbb]/40")}>
      {showChanges && p.changedSinceReview && (
        <span className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 font-sans text-[10px] font-bold text-white">
          <GitCompare className="size-3" /> Changed
        </span>
      )}
      <p data-pid={p.id} className="pt-1">
        {parts.map((part, i) =>
          part.mark ? (
            <mark key={i} className={cn("rounded px-0.5", part.resolved ? "bg-gray-200/60 text-inherit dark:bg-gray-700/60" : "bg-amber-200/70 text-inherit dark:bg-amber-500/30")}>
              {part.text}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          ),
        )}
        {p.aiAssisted && (
          <span className="ml-2 inline-flex translate-y-[-2px] items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 align-middle font-sans text-[11px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
            <Sparkles className="size-3" /> AI-assisted
          </span>
        )}
      </p>
      <button type="button" onClick={onComment} aria-label={`Comment on paragraph ${index + 1}`} className="absolute top-1 -right-1 inline-flex size-9 items-center justify-center rounded-full text-gray-300 opacity-100 hover:bg-gray-100 hover:text-gray-700 md:-right-12 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-gray-800">
        <MessageSquarePlus className="size-4" />
      </button>
    </div>
  );
}

function CommentCard({ c, now, onFocus, onDelete }: { c: ReviewComment; now: Date; onFocus: () => void; onDelete?: () => void }) {
  return (
    <li className={cn("rounded-2xl border p-3", c.resolved ? "border-gray-100 opacity-60 dark:border-gray-800" : "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20")}>
      <button type="button" onClick={onFocus} className="w-full text-left">
        {c.quote && <p className="mb-1 line-clamp-2 border-l-2 border-amber-400 pl-2 font-serif text-[13px] text-gray-600 italic dark:text-gray-400">“{c.quote}”</p>}
        <p className="text-[14px] text-gray-900 dark:text-gray-100">{c.body}</p>
        {c.suggestion && (
          <p className="mt-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[13px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            <strong className="font-semibold">Suggest:</strong> {c.suggestion}
          </p>
        )}
      </button>
      <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
        <span>
          {c.author} · {timeAgo(c.at, now)} {c.resolved && "· resolved"}
        </span>
        {onDelete && (
          <button type="button" onClick={onDelete} aria-label="Delete comment" className="inline-flex size-8 items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

function CommentSheet({ draft, paragraph, onClose, projectId, chapterId, invalidateKey }: { draft: Draft | null; paragraph?: Paragraph; onClose: () => void; projectId: string; chapterId: string; invalidateKey: string }) {
  const [body, setBody] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const add = useMutation((d: Draft) => lecturerApi.addReviewComment(projectId, chapterId, { paragraphId: d.paragraphId, quote: d.quote, body: body.trim(), suggestion: suggestion.trim() || undefined }), { invalidates: [invalidateKey] });
  return (
    <Sheet
      open={!!draft}
      onClose={onClose}
      size="sm"
      title="Add a comment"
      description="The student sees it when you send your review."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            loading={add.pending}
            disabled={body.trim().length < 2}
            onClick={async () => {
              await add.mutate(draft!).catch(() => undefined);
              setBody("");
              setSuggestion("");
              onClose();
            }}
          >
            Add comment
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <blockquote className="border-l-2 border-amber-400 pl-3 font-serif text-[14px] text-gray-600 italic dark:text-gray-400">“{draft?.quote || paragraph?.text.slice(0, 160) + "…"}”</blockquote>
        <Field label="Comment" htmlFor="cm-body">
          <Textarea id="cm-body" data-autofocus value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="e.g. Which study is this? Add the citation." />
        </Field>
        <Field label="Proposed wording" htmlFor="cm-sug" optional hint="The student can accept it in one tap. You never edit their text.">
          <Input id="cm-sug" value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}

function DecisionSheet({ kind, onClose, projectId, chapterId, chapterLabel, commentCount, invalidateKey, onDone }: { kind: "changes" | "approve" | null; onClose: () => void; projectId: string; chapterId: string; chapterLabel: string; commentCount: number; invalidateKey: string; onDone: () => void }) {
  const [summary, setSummary] = useState("");
  const decide = useMutation((k: "changes" | "approve") => lecturerApi.decideChapter(projectId, chapterId, k === "approve" ? "approve" : "changes", summary), { invalidates: [invalidateKey, "supervision", "today:"] });
  const changes = kind === "changes";
  return (
    <Sheet
      open={!!kind}
      onClose={onClose}
      dismissible={!decide.pending}
      title={changes ? `Send ${plural(commentCount, "comment")} and request changes?` : `Approve ${chapterLabel}?`}
      description={changes ? "The chapter unlocks for the student with your summary and comments." : "The student can still edit, but any change will show as “Changed after approval” to you."}
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant={changes ? "dark" : "success"}
            icon={changes ? Undo2 : Check}
            loading={decide.pending}
            disabled={changes && summary.trim().length < 10}
            onClick={async () => {
              const r = await decide.mutate(kind!).catch(() => undefined);
              if (r) {
                toast.success(changes ? "Changes requested" : "Chapter approved", { description: "The student gets a push and an email." });
                onDone();
              }
            }}
          >
            {changes ? "Request changes" : "Approve"}
          </Btn>
        </>
      }
    >
      {changes ? (
        <Field label="Summary for the student" htmlFor="dec-sum" hint="Required. What matters most to fix first?">
          <Textarea id="dec-sum" data-autofocus value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="e.g. Strong structure. Tighten section 2.3 and fix the two citation flags before Chapter 3." />
        </Field>
      ) : (
        <Field label="Note to the student" htmlFor="dec-sum" optional>
          <Textarea id="dec-sum" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </Field>
      )}
    </Sheet>
  );
}
