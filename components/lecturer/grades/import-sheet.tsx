"use client";

/**
 * 5A.4a Import from Excel: template → upload → column matcher → preview.
 * Nothing saves until the lecturer confirms.
 *
 * CSV is parsed in the browser. TODO(api): accept .xlsx too — parse server-side
 * (POST /lecturer/courses/:id/imports) or add SheetJS on the client.
 */

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { Btn, Field, Select } from "../ui/primitives";
import { Sheet } from "../ui/sheet";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some((c) => c)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c)) rows.push(row);
  return rows;
}

export function ImportSheet({
  open,
  onClose,
  courseId,
  scoreLabel,
  template,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  scoreLabel: string;
  template: { matric: string; name: string }[];
  onApply: (rows: { matric: string; score: number | null }[]) => Promise<void>;
}) {
  const [table, setTable] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [matricCol, setMatricCol] = useState(0);
  const [scoreCol, setScoreCol] = useState(1);
  const [preview, setPreview] = useState<{ matched: number; unknown: string[]; duplicates: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setTable(null);
    setPreview(null);
    setFileName("");
  };

  const downloadTemplate = () => {
    const csv = ["Matric number,Name," + scoreLabel, ...template.map((t) => `${t.matric},"${t.name}",`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scoreLabel.replace(/\s/g, "-")}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const headers = table?.[0] ?? [];
  const body = table?.slice(1) ?? [];

  const runPreview = async () => {
    setBusy(true);
    try {
      setPreview(await lecturerApi.previewImport(courseId, body.map((r) => ({ matric: r[matricCol] ?? "", score: r[scoreCol] ?? "" }))));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const seen = new Set<string>();
      const rows = body
        .map((r) => ({ matric: r[matricCol], score: r[scoreCol] === "" || r[scoreCol] === undefined ? null : Number(r[scoreCol]) }))
        .filter((r) => r.matric && !seen.has(r.matric) && (seen.add(r.matric), true));
      await onApply(rows);
      reset();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => (reset(), onClose())}
      size="lg"
      title={`Import ${scoreLabel} from Excel`}
      description="Save your sheet as CSV, upload it, and tell us which columns hold the matric number and the score. Nothing saves until you confirm."
      footer={
        <>
          <Btn variant="ghost" onClick={() => (reset(), onClose())}>
            Cancel
          </Btn>
          {table && !preview && (
            <Btn onClick={runPreview} loading={busy}>
              Preview
            </Btn>
          )}
          {preview && (
            <Btn onClick={apply} loading={busy} disabled={preview.matched === 0} icon={CheckCircle2}>
              Save {preview.matched} scores
            </Btn>
          )}
        </>
      }
    >
      {!table ? (
        <div className="flex flex-col gap-4">
          <Btn variant="secondary" icon={Download} onClick={downloadTemplate} className="w-fit">
            Download template
          </Btn>
          <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-[#003cbb]/50 dark:border-gray-700">
            <Upload className="size-6 text-gray-400" />
            <span className="text-[14px] font-semibold text-gray-800 dark:text-gray-200">Choose a CSV file</span>
            <span className="text-[12px] text-gray-500">Excel: File → Save as → CSV (comma delimited)</span>
            <input
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFileName(f.name);
                const parsed = parseCsv(await f.text());
                setTable(parsed);
                const h = parsed[0]?.map((x) => x.toLowerCase()) ?? [];
                setMatricCol(Math.max(0, h.findIndex((x) => x.includes("matric"))));
                const s = h.findIndex((x) => x.includes("score") || x.includes(scoreLabel.toLowerCase()) || x.includes("exam") || x.includes("ca"));
                setScoreCol(s >= 0 ? s : Math.min(1, h.length - 1));
              }}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-[14px] font-semibold text-gray-800 dark:text-gray-200">
            <FileSpreadsheet className="size-4 text-emerald-600" /> {fileName} · {body.length} rows
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Which column is the matric number?" htmlFor="col-matric">
              <Select id="col-matric" value={matricCol} onChange={(e) => (setMatricCol(Number(e.target.value)), setPreview(null))}>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={`Which column is ${scoreLabel}?`} htmlFor="col-score">
              <Select id="col-score" value={scoreCol} onChange={(e) => (setScoreCol(Number(e.target.value)), setPreview(null))}>
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {preview && (
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                <p className="text-[22px] font-bold text-emerald-700 dark:text-emerald-300">{preview.matched}</p>
                <p className="text-[12px] text-emerald-800 dark:text-emerald-300">matched</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40">
                <p className="text-[22px] font-bold text-amber-700 dark:text-amber-300">{preview.unknown.length}</p>
                <p className="text-[12px] text-amber-800 dark:text-amber-300">unknown matric numbers</p>
              </div>
              <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-800">
                <p className="text-[22px] font-bold text-gray-700 dark:text-gray-200">{preview.duplicates.length}</p>
                <p className="text-[12px] text-gray-600 dark:text-gray-400">duplicates (first kept)</p>
              </div>
              {preview.unknown.length > 0 && (
                <p className="flex items-start gap-2 text-[12px] text-amber-800 sm:col-span-3 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> Not in this class: {preview.unknown.slice(0, 6).join(", ")}
                  {preview.unknown.length > 6 && ` and ${preview.unknown.length - 6} more`}. They&apos;ll be skipped.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
