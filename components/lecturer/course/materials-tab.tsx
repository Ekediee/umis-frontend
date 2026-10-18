"use client";

/**
 * 4.1 Materials by week · 4.1a upload progress (resumable in live mode) ·
 * 4.2 release settings · 4.3 reading list from Campus Corpus.
 */

import { useMemo, useRef, useState } from "react";
import { BookMarked, ChevronDown, Clock, ExternalLink, File, FileImage, FileSpreadsheet, FileText, Link2, Plus, Presentation, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi, type CourseSummary } from "@/lib/lecturer/api";
import { appNow } from "@/lib/lecturer/clock";
import { dayDate } from "@/lib/lecturer/format";
import { useLecturerQuery, useMutation } from "@/lib/lecturer/query";
import type { Material } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Btn, CardSkeleton, Chip, ErrorState, Field, Input, ProgressBar, Select, Surface } from "../ui/primitives";
import { Sheet } from "../ui/sheet";

const MAX_MB = 50;
const KIND_ICON: Record<Material["kind"], typeof File> = { pdf: FileText, pptx: Presentation, docx: FileSpreadsheet, image: FileImage, link: Link2, paper: BookMarked };

interface UploadItem {
  id: string;
  name: string;
  sizeKb: number;
  progress: number;
  status: "uploading" | "done" | "failed";
  error?: string;
}

export function MaterialsTab({ course }: { course: CourseSummary }) {
  const key = `materials:${course.id}`;
  const q = useLecturerQuery(key, () => lecturerApi.getMaterials(course.id));
  const [open, setOpen] = useState<Set<number>>(new Set([course.week, course.week + 1]));
  const [pending, setPending] = useState<File[] | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [readingOpen, setReadingOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const del = useMutation(lecturerApi.deleteMaterial, { invalidates: [key] });

  const byWeek = useMemo(() => {
    const map = new Map<number, Material[]>();
    for (let w = 1; w <= course.totalWeeks; w++) map.set(w, []);
    (q.data ?? []).forEach((m) => map.get(m.week)?.push(m));
    return map;
  }, [q.data, course.totalWeeks]);

  const totalKb = (q.data ?? []).reduce((s, m) => s + (m.sizeKb ?? 0), 0);

  const startUpload = (files: File[], settings: { week: number; releaseAt?: string; groupIds: string[] }) => {
    files.forEach((f) => {
      const id = `${f.name}-${Date.now()}-${Math.random()}`;
      const sizeKb = Math.round(f.size / 1024);
      if (f.size > MAX_MB * 1024 * 1024) {
        setUploads((u) => [...u, { id, name: f.name, sizeKb, progress: 0, status: "failed", error: `Over ${MAX_MB} MB. Share a link instead, or compress it.` }]);
        return;
      }
      setUploads((u) => [...u, { id, name: f.name, sizeKb, progress: 0, status: "uploading" }]);
      // TODO(api): chunked, resumable upload (tus or S3 multipart); progress comes from the upload client.
      let p = 0;
      const tick = setInterval(() => {
        p = Math.min(100, p + 12 + Math.random() * 18);
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x)));
        if (p >= 100) {
          clearInterval(tick);
          lecturerApi
            .uploadMaterial({ courseId: course.id, week: settings.week, name: f.name, sizeKb, releaseAt: settings.releaseAt, groupIds: settings.groupIds })
            .then(() => {
              setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "done" } : x)));
              q.refetch();
            })
            .catch(() => setUploads((u) => u.map((x) => (x.id === id ? { ...x, status: "failed", error: "Upload interrupted." } : x))));
        }
      }, 220);
    });
    setOpen((o) => new Set(o).add(settings.week));
  };

  const doneCount = uploads.filter((u) => u.status === "done").length;

  if (q.error) return <ErrorState error={q.error} screen="Materials" onRetry={q.refetch} />;
  if (!q.data) return <CardSkeleton rows={4} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-gray-500">
          {q.data.length} items · {(totalKb / 1024).toFixed(1)} MB used · PDF, PPTX, DOCX, images, video links · max {MAX_MB} MB per file
        </p>
        <div className="flex gap-2">
          <Btn variant="secondary" icon={BookMarked} onClick={() => setReadingOpen(true)}>
            Add reading
          </Btn>
          <Btn icon={Upload} onClick={() => fileRef.current?.click()}>
            Upload
          </Btn>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const files = [...(e.target.files ?? [])];
              e.target.value = "";
              if (files.length) setPending(files);
            }}
          />
        </div>
      </div>

      {uploads.length > 0 && (
        <Surface className="flex flex-col gap-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">
              Uploaded, {doneCount} of {uploads.length}
            </p>
            {uploads.every((u) => u.status !== "uploading") ? (
              <Btn size="sm" variant="ghost" onClick={() => setUploads([])}>
                Clear
              </Btn>
            ) : (
              <span className="text-[12px] text-gray-500">Keep this tab open on slow connections</span>
            )}
          </div>
          {uploads.map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                {u.status === "failed" ? <p className="text-[12px] text-red-600">{u.error}</p> : <ProgressBar value={u.progress} tone={u.status === "done" ? "green" : "blue"} className="mt-1.5 h-1.5" label={`${u.name} upload`} />}
              </div>
              {u.status === "failed" && u.sizeKb < MAX_MB * 1024 && (
                <Btn size="sm" variant="secondary" icon={RotateCcw}>
                  Retry
                </Btn>
              )}
            </div>
          ))}
        </Surface>
      )}

      <ul className="flex flex-col gap-2">
        {[...byWeek.entries()].map(([week, items]) => {
          const isOpen = open.has(week);
          const isCurrent = week === course.week;
          return (
            <li key={week} className={cn("overflow-hidden rounded-[18px] border bg-white dark:bg-gray-900", isCurrent ? "border-[#003cbb]/30 dark:border-[#4d82ff]/40" : "border-gray-200 dark:border-gray-800")}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  setOpen((o) => {
                    // Copy first: state updaters must not mutate (Strict Mode runs them twice).
                    const next = new Set(o);
                    if (next.has(week)) next.delete(week);
                    else next.add(week);
                    return next;
                  })
                }
                className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left md:px-5"
              >
                <ChevronDown className={cn("size-4 text-gray-400 transition-transform", !isOpen && "-rotate-90")} />
                <span className="flex-1">
                  <span className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Week {week}</span>
                  <span className="ml-2 text-[13px] text-gray-500">{course.topics[week - 1]}</span>
                </span>
                {isCurrent && <Chip tone="blue">This week</Chip>}
                <span className="text-[12px] text-gray-400 tabular-nums">{items.length || ""}</span>
              </button>
              {isOpen && (
                <div className="border-t border-gray-100 px-2 py-2 dark:border-gray-800">
                  {items.length === 0 ? (
                    <p className="px-3 py-3 text-[13px] text-gray-500">Nothing here yet. Drop slides here so students can find them by week.</p>
                  ) : (
                    <ul>
                      {items.map((m) => {
                        const Icon = KIND_ICON[m.kind];
                        return (
                          <li key={m.id} className="group flex min-h-[52px] items-center gap-3 rounded-xl px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <Icon className={cn("size-5 shrink-0", m.kind === "paper" ? "text-purple-500" : "text-gray-400")} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14px] font-medium text-gray-900 dark:text-gray-100">{m.name}</span>
                              <span className="flex items-center gap-2 text-[12px] text-gray-500">
                                {m.kind === "paper" ? `Campus Corpus · DOI ${m.doi}` : m.sizeKb ? `${(m.sizeKb / 1024).toFixed(1)} MB` : "Link"}
                                {m.releaseAt && new Date(m.releaseAt) > appNow() && (
                                  <span className="inline-flex items-center gap-1 text-amber-600" title="Only you see the schedule">
                                    <Clock className="size-3" /> Releases {dayDate(m.releaseAt)}
                                  </span>
                                )}
                              </span>
                            </span>
                            {m.kind === "paper" && <ExternalLink className="size-4 text-gray-300" />}
                            <button
                              type="button"
                              aria-label={`Delete ${m.name}`}
                              onClick={async () => {
                                await del.mutate(m.id).catch(() => undefined);
                                toast.success("Moved to the bin", { description: "You can restore it for 30 days." });
                              }}
                              className="inline-flex size-10 items-center justify-center rounded-full text-gray-300 opacity-100 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-red-950/40"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ReleaseSheet files={pending} course={course} onClose={() => setPending(null)} onConfirm={(s) => (startUpload(pending!, s), setPending(null))} />
      <ReadingSheet open={readingOpen} onClose={() => setReadingOpen(false)} course={course} onAdded={q.refetch} />
    </div>
  );
}

function ReleaseSheet({ files, course, onClose, onConfirm }: { files: File[] | null; course: CourseSummary; onClose: () => void; onConfirm: (s: { week: number; releaseAt?: string; groupIds: string[] }) => void }) {
  const [week, setWeek] = useState(course.week);
  const [mode, setMode] = useState<"now" | "later">("now");
  const [at, setAt] = useState("");
  const [group, setGroup] = useState("all");
  return (
    <Sheet
      open={!!files}
      onClose={onClose}
      title={`Upload ${files?.length ?? 0} file${files?.length === 1 ? "" : "s"}`}
      description="Only share what you have the right to share. Prefer Campus Corpus links over PDF copies of journal papers."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn icon={Upload} disabled={mode === "later" && !at} onClick={() => onConfirm({ week, releaseAt: mode === "later" ? new Date(at).toISOString() : undefined, groupIds: group === "all" ? [] : [group] })}>
            Upload
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ul className="rounded-xl bg-gray-50 p-3 text-[13px] text-gray-700 dark:bg-gray-800/60 dark:text-gray-300">
          {files?.map((f) => (
            <li key={f.name} className="truncate">
              {f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB
            </li>
          ))}
        </ul>
        <Field label="Week" htmlFor="rel-week">
          <Select id="rel-week" value={week} onChange={(e) => setWeek(Number(e.target.value))}>
            {Array.from({ length: course.totalWeeks }, (_, i) => (
              <option key={i} value={i + 1}>
                Week {i + 1}: {course.topics[i]}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Visible to students</legend>
          {(["now", "later"] as const).map((m) => (
            <label key={m} className="flex min-h-[44px] items-center gap-3 text-[14px] text-gray-800 dark:text-gray-200">
              <input type="radio" name="release" checked={mode === m} onChange={() => setMode(m)} className="size-4 accent-[#003cbb]" />
              {m === "now" ? "Now" : "Schedule for a date and time"}
            </label>
          ))}
          {mode === "later" && <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} aria-label="Release date and time" />}
        </fieldset>
        {course.groups.length > 1 && (
          <Field label="Groups" htmlFor="rel-group">
            <Select id="rel-group" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="all">All groups</option>
              {course.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.option}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
    </Sheet>
  );
}

function ReadingSheet({ open, onClose, course, onAdded }: { open: boolean; onClose: () => void; course: CourseSummary; onAdded: () => void }) {
  const [term, setTerm] = useState("");
  const [week, setWeek] = useState(course.week);
  const results = useLecturerQuery(open ? `corpus:${term}` : null, () => lecturerApi.searchCorpus(term));
  const add = useMutation((p: { title: string; doi: string }) => lecturerApi.addReading(course.id, week, p));
  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Reading list from Campus Corpus" description="The university's own published work. Each paper keeps its DOI, and students can cite it in their Pulse projects in one tap.">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
            <Input data-autofocus value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search title or author" className="pl-10" aria-label="Search Campus Corpus" />
          </div>
          <Select value={week} onChange={(e) => setWeek(Number(e.target.value))} className="w-[120px]" aria-label="Add to week">
            {Array.from({ length: course.totalWeeks }, (_, i) => (
              <option key={i} value={i + 1}>
                Week {i + 1}
              </option>
            ))}
          </Select>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {(results.data ?? []).map((p) => (
            <li key={p.doi} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-gray-900 dark:text-gray-100">{p.title}</p>
                <p className="text-[12px] text-gray-500">
                  {p.authors} · {p.year} · DOI {p.doi} {p.openAccess && <span className="text-emerald-600">· Open access</span>}
                </p>
              </div>
              <Btn
                size="sm"
                variant="secondary"
                icon={Plus}
                disabled={add.pending}
                onClick={async () => {
                  await add.mutate(p).catch(() => undefined);
                  toast.success(`Added to Week ${week}`);
                  onAdded();
                }}
              >
                Week {week}
              </Btn>
            </li>
          ))}
          {results.data?.length === 0 && <li className="py-6 text-center text-[14px] text-gray-500">No Campus Corpus papers match “{term}”.</li>}
        </ul>
      </div>
    </Sheet>
  );
}
