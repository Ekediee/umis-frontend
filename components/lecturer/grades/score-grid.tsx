"use client";

/**
 * Spreadsheet-style score entry (5A.4, 5B.1).
 * - Enter / ↓ moves down, ↑ moves up; full keyboard use (WCAG).
 * - Each cell saves as typed (on blur or Enter) with a per-cell state.
 * - Rejects scores above max with copy that says what to do; blank stays blank.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Loader2, Lock } from "lucide-react";
import { validateScore } from "@/lib/lecturer/grading";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "../ui/primitives";

export interface GridRow {
  id: string;
  first: string;
  last: string;
  matric: string;
  value: number | null;
  locked?: boolean;
  highlight?: boolean;
  tags?: ReactNode;
  /** Extra read-only columns rendered after the input (e.g. CA, total, grade). */
  cells?: ReactNode[];
  trailing?: ReactNode;
}

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj };
  delete next[key];
  return next;
}

type CellState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

export function ScoreGrid({
  rows,
  max,
  label,
  extraHeaders = [],
  onSave,
  beforeHeaders,
}: {
  rows: GridRow[];
  max: number;
  label: string;
  extraHeaders?: string[];
  beforeHeaders?: string[];
  onSave: (id: string, value: number | null) => Promise<void>;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, CellState>>({});

  const focusRow = (i: number) => {
    const el = inputs.current[i];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const commit = async (row: GridRow, index: number) => {
    const raw = drafts[row.id];
    if (raw === undefined) return;
    const current = row.value === null ? "" : String(row.value);
    if (raw.trim() === current) {
      setDrafts((d) => omit(d, row.id));
      return;
    }
    const v = validateScore(raw, max, label);
    if (!v.ok) {
      setStates((s) => ({ ...s, [row.id]: { kind: "error", message: `${v.message} Check row ${index + 1}.` } }));
      return;
    }
    setStates((s) => ({ ...s, [row.id]: { kind: "saving" } }));
    try {
      await onSave(row.id, v.value);
      setStates((s) => ({ ...s, [row.id]: { kind: "saved" } }));
      setDrafts((d) => omit(d, row.id));
      setTimeout(() => setStates((s) => (s[row.id]?.kind === "saved" ? { ...s, [row.id]: { kind: "idle" } } : s)), 1500);
    } catch (e) {
      setStates((s) => ({ ...s, [row.id]: { kind: "error", message: (e as Error).message } }));
    }
  };

  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[560px] text-left text-[14px]">
          <TableHeader className="bg-gray-50 text-[12px] font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800/50">
            <TableRow>
              <TableHead className="w-10 py-3 pl-4 text-right">#</TableHead>
              <TableHead className="py-3 pl-3">Student</TableHead>
              {beforeHeaders?.map((h) => (
                <TableHead key={h} className="px-3 text-right">
                  {h}
                </TableHead>
              ))}
              <TableHead className="w-[130px] px-3">{label}</TableHead>
              {extraHeaders.map((h) => (
                <TableHead key={h} className="px-3 text-right">
                  {h}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-gray-100 dark:[&_tr]:border-gray-800">
            {rows.map((row, i) => {
              const state = states[row.id] ?? { kind: "idle" };
              const draft = drafts[row.id];
              const shown = draft ?? (row.value === null ? "" : String(row.value));
              const err = state.kind === "error";
              return (
                <TableRow key={row.id} className={cn(row.highlight && "bg-red-50/70 dark:bg-red-950/20", row.locked && !row.highlight && "opacity-70")}>
                  <TableCell className="py-2 pl-4 text-right text-[12px] text-gray-400 tabular-nums">{i + 1}</TableCell>
                  <TableCell className="py-2 pl-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar first={row.first} last={row.last} size={32} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
                          {row.first} {row.last} {row.tags}
                        </p>
                        <p className="text-[12px] text-gray-500 tabular-nums">{row.matric}</p>
                        {err && (
                          <p role="alert" className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-red-600">
                            <AlertCircle className="size-3" /> {state.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {row.cells?.slice(0, beforeHeaders?.length ?? 0).map((c, k) => (
                    <TableCell key={k} className="px-3 text-right font-medium text-gray-700 tabular-nums dark:text-gray-300">
                      {c}
                    </TableCell>
                  ))}
                  <TableCell className="px-3">
                    {row.locked ? (
                      <span className="inline-flex h-10 items-center gap-1.5 text-[15px] font-semibold text-gray-700 tabular-nums dark:text-gray-300">
                        {row.value ?? "–"} <Lock className="size-3.5 text-gray-300" />
                      </span>
                    ) : (
                      <div className="relative">
                        <input
                          ref={(el) => {
                            inputs.current[i] = el;
                          }}
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label={`${label} for ${row.first} ${row.last}, out of ${max}`}
                          aria-invalid={err}
                          value={shown}
                          onChange={(e) => {
                            setDrafts((d) => ({ ...d, [row.id]: e.target.value }));
                            if (err) setStates((s) => ({ ...s, [row.id]: { kind: "idle" } }));
                          }}
                          onBlur={() => commit(row, i)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "ArrowDown") {
                              e.preventDefault();
                              commit(row, i);
                              focusRow(i + 1);
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              commit(row, i);
                              focusRow(i - 1);
                            } else if (e.key === "Escape") {
                              setDrafts((d) => omit(d, row.id));
                            }
                          }}
                          className={cn(
                            "h-10 w-[96px] rounded-xl border bg-white px-3 text-right text-[15px] font-semibold tabular-nums outline-none focus:ring-3 dark:bg-gray-950 dark:text-gray-100",
                            err ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-[#003cbb] focus:ring-[#003cbb]/15 dark:border-gray-700",
                          )}
                          placeholder="–"
                        />
                        <span className="pointer-events-none absolute top-1/2 left-[104px] -translate-y-1/2 text-[12px] text-gray-400">/{max}</span>
                      </div>
                    )}
                  </TableCell>
                  {row.cells?.slice(beforeHeaders?.length ?? 0).map((c, k) => (
                    <TableCell key={k} className="px-3 text-right font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                      {c}
                    </TableCell>
                  ))}
                  <TableCell className="w-10 pr-3">
                    <span className="flex justify-end" aria-live="polite">
                      {state.kind === "saving" && <Loader2 className="size-4 animate-spin text-gray-400" aria-label="Saving" />}
                      {state.kind === "saved" && <Check className="size-4 text-emerald-500" aria-label="Saved" />}
                      {row.trailing}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
