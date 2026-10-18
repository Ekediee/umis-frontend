"use client";

/** 5A.4 Enter CA scores (spreadsheet-style, saves per cell) + 5A.4a import. */

import { useMemo, useState } from "react";
import { FileUp, Info } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName, plural } from "@/lib/lecturer/format";
import { invalidate, useLecturerQuery } from "@/lib/lecturer/query";
import { Page } from "../shell/page";
import { BackButton, Btn, CardSkeleton, Chip, ErrorState, Segmented, Stat, Surface } from "../ui/primitives";
import { ImportSheet } from "./import-sheet";
import { ScoreGrid } from "./score-grid";

export function ScoresView({ courseId, assessmentId }: { courseId: string; assessmentId: string }) {
  const [group, setGroup] = useState("all");
  const key = `scores:${courseId}:${assessmentId}:${group}`;
  const q = useLecturerQuery(key, () => lecturerApi.getScoreSheet(courseId, assessmentId, group));
  const [importOpen, setImportOpen] = useState(false);

  const stats = useMemo(() => {
    const scores = (q.data?.rows ?? []).map((r) => r.score).filter((s): s is number => s !== null);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { entered: scores.length, avg };
  }, [q.data]);

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Enter scores" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={8} />
      </Page>
    );

  const { course: c, assessment: a, rows } = q.data;
  const after = () => {
    invalidate(`assessments:${courseId}`);
    invalidate(`classlist:${courseId}`);
  };

  return (
    <Page>
      <BackButton href={`/lecturer/courses/${courseId}?tab=assessments`} to={`${c.code} assessments`} className="mb-4" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 md:text-[26px] dark:text-gray-50">{a.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-gray-500">
            {c.code} · out of {a.maxMarks} · {a.mode === "online" ? "submitted online" : "marked on paper"}
            {a.released && <Chip tone="green">Released to students</Chip>}
          </p>
        </div>
        <Btn variant="secondary" icon={FileUp} onClick={() => setImportOpen(true)}>
          Import from Excel
        </Btn>
      </div>

      {c.groups.length > 1 && (
        <Segmented
          ariaLabel="Group"
          size="sm"
          className="mb-4"
          value={group}
          onChange={setGroup}
          options={[{ value: "all", label: "All groups" }, ...c.groups.map((g) => ({ value: g.id, label: g.label.length <= 2 ? `Group ${g.label}` : g.label }))]}
        />
      )}

      <Surface className="mb-4 grid grid-cols-3 gap-4">
        <Stat label="Entered" value={`${stats.entered}/${rows.length}`} />
        <Stat label="Running average" value={stats.avg === null ? "–" : stats.avg.toFixed(1)} hint={`out of ${a.maxMarks}`} />
        <Stat label="Blank" value={rows.length - stats.entered} hint="stays blank, not zero" />
      </Surface>

      <ScoreGrid
        rows={rows.map((r) => ({ id: r.student.id, first: r.student.firstName, last: r.student.lastName, matric: r.student.matric, value: r.score }))}
        max={a.maxMarks}
        label={a.name.replace(/ (Test|Assignment|Project|Presentation)$/, "")}
        onSave={async (id, v) => {
          await lecturerApi.saveCaScore(courseId, a.id, id, v);
          q.refetch();
          after();
        }}
      />
      <p className="mt-3 flex items-center gap-1.5 text-[12px] text-gray-500">
        <Info className="size-3.5" /> Each score saves as you type. Press Enter to move down. Students see nothing until you release.
      </p>

      <ImportSheet
        open={importOpen}
        onClose={() => setImportOpen(false)}
        courseId={courseId}
        scoreLabel={a.name}
        template={rows.map((r) => ({ matric: r.student.matric, name: fullName(r.student) }))}
        onApply={async (imported) => {
          const byMatric = new Map(rows.map((r) => [r.student.matric, r.student.id]));
          let saved = 0;
          for (const r of imported) {
            const id = byMatric.get(r.matric);
            if (!id || (r.score !== null && (r.score > a.maxMarks || r.score < 0))) continue;
            await lecturerApi.saveCaScore(courseId, a.id, id, r.score).then(() => saved++, () => undefined);
          }
          toast.success(`Imported ${plural(saved, "score")}`);
          q.refetch();
          after();
        }}
      />
    </Page>
  );
}
