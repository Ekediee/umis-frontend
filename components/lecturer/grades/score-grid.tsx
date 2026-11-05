"use client";

/**
 * Spreadsheet-style score entry (5A.4, 5B.1).
 * - One or more editable columns (e.g. CA and Exam on the grade sheet).
 * - Enter / ↓ moves down the same column, ↑ moves up; Tab moves across (WCAG).
 * - Each cell saves as typed (on blur or Enter) with a per-cell state.
 * - Rejects scores above max with copy that says what to do; blank stays blank.
 * - Wide tables scroll sideways inside their own frame: the student column and
 *   header stay pinned, and arrow buttons appear while there's more to see.
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { validateScore } from "@/lib/lecturer/grading";
import { cn } from "@/lib/utils";
import { PersonAvatar } from "../ui/primitives";

/** An editable score column. */
export interface ScoreColumn {
  key: string;
  /** Used in the header and in error copy ("CA is out of 40."). */
  label: string;
  max: number;
  onSave: (rowId: string, value: number | null) => Promise<void>;
}

export interface GridRow {
  id: string;
  first: string;
  last: string;
  matric: string;
  /** Value of the single editable column (when `columns` isn't used). */
  value?: number | null;
  /** Values per editable column key (when `columns` is used). */
  values?: Record<string, number | null>;
  /** Locks every editable cell in the row. */
  locked?: boolean;
  /** Locks only these columns (e.g. Exam when a status is set). */
  lockedKeys?: string[];
  /** Small note under a cell, per column key (e.g. "Edited"). */
  notes?: Record<string, ReactNode>;
  highlight?: boolean;
  tags?: ReactNode;
  /** Read-only columns: the first `beforeHeaders.length` render before the inputs, the rest after. */
  cells?: ReactNode[];
  trailing?: ReactNode;
}

function omit<T extends Record<string, unknown>>(obj: T, key: string): T {
  const next = { ...obj };
  delete next[key];
  return next;
}

type CellState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

const SINGLE = "value";

// Pinned "#" and Student columns. The # column has a fixed width so the
// Student column can stick right after it.
const STICKY_NUM = "sticky left-0 w-10 min-w-10 max-w-10 pr-1 pl-3 text-right";
const STICKY_NAME = "sticky left-10 min-w-[170px] pl-3 md:min-w-[220px]";
const STICKY_EDGE = "shadow-[6px_0_8px_-6px_rgba(15,23,42,0.18)] dark:shadow-[6px_0_8px_-6px_rgba(0,0,0,0.6)]";
const stickyBg = (row: { highlight?: boolean }) => (row.highlight ? "bg-red-50 dark:bg-[#2a1517]" : "bg-white dark:bg-gray-900");

export function ScoreGrid({
  rows,
  max,
  label,
  onSave,
  columns,
  extraHeaders = [],
  beforeHeaders,
  onOpenRow,
}: {
  rows: GridRow[];
  /** Single-column mode: max, label and onSave describe the one editable column. */
  max?: number;
  label?: string;
  onSave?: (id: string, value: number | null) => Promise<void>;
  /** Multi-column mode. */
  columns?: ScoreColumn[];
  extraHeaders?: string[];
  beforeHeaders?: string[];
  /** Makes the student cell a button that opens that student's details. */
  onOpenRow?: (id: string) => void;
}) {
  const cols: ScoreColumn[] = columns ?? [{ key: SINGLE, label: label ?? "Score", max: max ?? 100, onSave: onSave ?? (async () => undefined) }];
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, CellState>>({});
  const tableRef = useRef<HTMLTableElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const el = tableRef.current?.parentElement; // the shared Table's scroll frame
    if (!el) return;
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update); // also fires once on observe
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const scrollSideways = (dir: -1 | 1) => {
    const el = tableRef.current?.parentElement;
    el?.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  const cellKey = (rowId: string, colKey: string) => `${rowId}::${colKey}`;
  const valueOf = (row: GridRow, col: ScoreColumn) => (columns ? (row.values?.[col.key] ?? null) : (row.value ?? null));
  const isLocked = (row: GridRow, col: ScoreColumn) => !!row.locked || !!row.lockedKeys?.includes(col.key);

  const focusCell = (colKey: string, i: number) => {
    const el = inputs.current[`${colKey}:${i}`];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const commit = async (row: GridRow, col: ScoreColumn, index: number) => {
    const k = cellKey(row.id, col.key);
    const raw = drafts[k];
    if (raw === undefined) return;
    const current = valueOf(row, col);
    if (raw.trim() === (current === null ? "" : String(current))) {
      setDrafts((d) => omit(d, k));
      return;
    }
    const v = validateScore(raw, col.max, col.label);
    if (!v.ok) {
      setStates((s) => ({ ...s, [k]: { kind: "error", message: `${v.message} Check row ${index + 1}.` } }));
      return;
    }
    setStates((s) => ({ ...s, [k]: { kind: "saving" } }));
    try {
      await col.onSave(row.id, v.value);
      setStates((s) => ({ ...s, [k]: { kind: "saved" } }));
      setDrafts((d) => omit(d, k));
      setTimeout(() => setStates((s) => (s[k]?.kind === "saved" ? { ...s, [k]: { kind: "idle" } } : s)), 1500);
    } catch (e) {
      setStates((s) => ({ ...s, [k]: { kind: "error", message: (e as Error).message } }));
    }
  };

  const before = beforeHeaders?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-[20px] border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {(edges.left || edges.right) && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
          <p className="text-[12px] text-gray-500 dark:text-gray-400">Swipe sideways or use the arrows to see every column.</p>
          <div className="flex shrink-0 gap-1.5">
            {([-1, 1] as const).map((dir) => {
              const Icon = dir < 0 ? ChevronLeft : ChevronRight;
              const enabled = dir < 0 ? edges.left : edges.right;
              return (
                <button
                  key={dir}
                  type="button"
                  onClick={() => scrollSideways(dir)}
                  disabled={!enabled}
                  aria-label={dir < 0 ? "Scroll table left" : "Scroll table right"}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-35 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Table
        ref={tableRef}
        containerClassName="max-h-[70vh] overscroll-x-contain"
        className={cn("w-full text-left text-[14px]", cols.length > 1 ? "min-w-[680px]" : "min-w-[560px]")}
      >
          <TableHeader className="sticky top-0 z-20 text-[12px] font-semibold tracking-wide text-gray-500 uppercase [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800">
            <TableRow>
              <TableHead className={cn(STICKY_NUM, "z-30 py-3")}>#</TableHead>
              <TableHead className={cn(STICKY_NAME, "z-30 py-3", edges.left && STICKY_EDGE)}>Student</TableHead>
              {beforeHeaders?.map((h) => (
                <TableHead key={h} className="px-3 text-right">
                  {h}
                </TableHead>
              ))}
              {cols.map((c) => (
                <TableHead key={c.key} className="w-[130px] px-3">
                  {columns ? `${c.label} (${c.max})` : c.label}
                </TableHead>
              ))}
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
              const rowStates = cols.map((c) => states[cellKey(row.id, c.key)] ?? ({ kind: "idle" } as CellState));
              const errors = rowStates.filter((s): s is Extract<CellState, { kind: "error" }> => s.kind === "error");
              const saving = rowStates.some((s) => s.kind === "saving");
              const saved = !saving && rowStates.some((s) => s.kind === "saved");
              return (
                <TableRow key={row.id} className={cn(row.highlight && "bg-red-50/70 dark:bg-red-950/20", row.locked && !row.highlight && "opacity-70")}>
                  <TableCell className={cn(STICKY_NUM, "z-10 py-2 text-[12px] text-gray-400 tabular-nums", stickyBg(row))}>{i + 1}</TableCell>
                  <TableCell className={cn(STICKY_NAME, "z-10 py-2", stickyBg(row), edges.left && STICKY_EDGE)}>
                    <div className="flex items-center gap-3">
                      {onOpenRow ? (
                        <button
                          type="button"
                          onClick={() => onOpenRow(row.id)}
                          aria-label={`Open ${row.first} ${row.last}'s marks`}
                          className="group/name -m-1.5 flex min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-[#eef3fd] focus-visible:ring-3 focus-visible:ring-[#003cbb]/30 focus-visible:outline-none dark:hover:bg-[#003cbb]/15"
                        >
                          <PersonAvatar first={row.first} last={row.last} size={32} />
                          <span className="min-w-0">
                            <span className="block font-semibold text-gray-900 group-hover/name:text-[#003cbb] dark:text-gray-100 dark:group-hover/name:text-[#4d82ff]">
                              {row.first} {row.last}
                            </span>
                            <span className="block text-[12px] text-gray-500 tabular-nums">{row.matric}</span>
                          </span>
                        </button>
                      ) : (
                        <PersonAvatar first={row.first} last={row.last} size={32} />
                      )}
                      <div className="min-w-0">
                        {!onOpenRow && (
                          <>
                            <p className="flex flex-wrap items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
                              {row.first} {row.last} {row.tags}
                            </p>
                            <p className="text-[12px] text-gray-500 tabular-nums">{row.matric}</p>
                          </>
                        )}
                        {onOpenRow && row.tags && <p className="flex flex-wrap items-center gap-1.5">{row.tags}</p>}
                        {errors.map((e) => (
                          <p key={e.message} role="alert" className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-red-600">
                            <AlertCircle className="size-3" /> {e.message}
                          </p>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  {row.cells?.slice(0, before).map((c, k) => (
                    <TableCell key={k} className="px-3 text-right font-medium text-gray-700 tabular-nums dark:text-gray-300">
                      {c}
                    </TableCell>
                  ))}
                  {cols.map((col) => {
                    const k = cellKey(row.id, col.key);
                    const value = valueOf(row, col);
                    const err = states[k]?.kind === "error";
                    const shown = drafts[k] ?? (value === null ? "" : String(value));
                    return (
                      <TableCell key={col.key} className="px-3">
                        {isLocked(row, col) ? (
                          <span className="inline-flex h-10 items-center gap-1.5 text-[15px] font-semibold text-gray-700 tabular-nums dark:text-gray-300">
                            {value ?? "–"} <Lock className="size-3.5 text-gray-300" />
                          </span>
                        ) : (
                          <div className="relative">
                            <input
                              ref={(el) => {
                                inputs.current[`${col.key}:${i}`] = el;
                              }}
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label={`${col.label} for ${row.first} ${row.last}, out of ${col.max}`}
                              aria-invalid={err}
                              value={shown}
                              onChange={(e) => {
                                setDrafts((d) => ({ ...d, [k]: e.target.value }));
                                if (err) setStates((s) => ({ ...s, [k]: { kind: "idle" } }));
                              }}
                              onBlur={() => commit(row, col, i)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "ArrowDown") {
                                  e.preventDefault();
                                  commit(row, col, i);
                                  focusCell(col.key, i + 1);
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  commit(row, col, i);
                                  focusCell(col.key, i - 1);
                                } else if (e.key === "Escape") {
                                  setDrafts((d) => omit(d, k));
                                }
                              }}
                              className={cn(
                                "h-10 w-[96px] rounded-xl border bg-white px-3 text-right text-[15px] font-semibold tabular-nums outline-none focus:ring-3 dark:bg-gray-950 dark:text-gray-100",
                                err ? "border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-[#003cbb] focus:ring-[#003cbb]/15 dark:border-gray-700",
                              )}
                              placeholder="–"
                            />
                            <span className="pointer-events-none absolute top-1/2 left-[104px] -translate-y-1/2 text-[12px] text-gray-400">/{col.max}</span>
                          </div>
                        )}
                        {row.notes?.[col.key] && <div className="mt-1 text-[11px] text-gray-500">{row.notes[col.key]}</div>}
                      </TableCell>
                    );
                  })}
                  {row.cells?.slice(before).map((c, k) => (
                    <TableCell key={k} className="px-3 text-right font-semibold text-gray-900 tabular-nums dark:text-gray-100">
                      {c}
                    </TableCell>
                  ))}
                  <TableCell className="w-10 pr-3">
                    <span className="flex justify-end" aria-live="polite">
                      {saving && <Loader2 className="size-4 animate-spin text-gray-400" aria-label="Saving" />}
                      {saved && <Check className="size-4 text-emerald-500" aria-label="Saved" />}
                      {row.trailing}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
      </Table>
    </div>
  );
}
