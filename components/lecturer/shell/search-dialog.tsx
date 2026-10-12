"use client";

/**
 * Global search (1.3): one box for courses, students (name or matric) and
 * projects. Results are scoped server-side to the lecturer's own courses,
 * advisees and supervisees. Opens with ⌘K / Ctrl+K or "/".
 */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, FileText, Loader2, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { lecturerApi } from "@/lib/lecturer/api";
import type { SearchResult } from "@/lib/lecturer/types";
import { Sheet } from "../ui/sheet";

const KIND_LABEL: Record<SearchResult["kind"], string> = { course: "Courses", student: "Students", project: "Projects" };
const KIND_ICON = { course: BookOpen, student: UserRound, project: FileText };

export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setTerm("");
      setResults([]);
    }
  }

  useEffect(() => {
    if (term.trim().length < 2) return;
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      lecturerApi
        .search(term)
        .then((r) => !cancelled && (setResults(r), setCursor(0)))
        .finally(() => !cancelled && setLoading(false));
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [term]);

  const shown = useMemo(() => (term.trim().length < 2 ? [] : results), [term, results]);

  const grouped = useMemo(() => {
    const groups: { kind: SearchResult["kind"]; items: (SearchResult & { index: number })[] }[] = [];
    shown.forEach((r, index) => {
      let g = groups.find((x) => x.kind === r.kind);
      if (!g) groups.push((g = { kind: r.kind, items: [] }));
      g.items.push({ ...r, index });
    });
    return groups;
  }, [shown]);

  const go = (r: SearchResult) => {
    onClose();
    router.push(r.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(shown.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && shown[cursor]) {
      e.preventDefault();
      go(shown[cursor]);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <Sheet open={open} onClose={onClose} title="Search" description="Courses, your students by name or matric number, and projects you supervise." size="lg">
      <div className="sticky top-0 z-10 -mx-1 bg-white px-1 pb-3 dark:bg-gray-900">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-gray-400" />
          <input
            data-autofocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder='Try "Adeyemi", "SEN 201" or "fintech"'
            aria-label="Search"
            role="combobox"
            aria-expanded={shown.length > 0}
            aria-controls="lecturer-search-results"
            aria-activedescendant={shown[cursor] ? `sr-${cursor}` : undefined}
            className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pr-10 pl-11 text-[15px] outline-none focus:border-[#003cbb] focus:bg-white focus:ring-3 focus:ring-[#003cbb]/15 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          />
          {loading && <Loader2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-gray-400" />}
        </div>
      </div>
      <ul id="lecturer-search-results" role="listbox" ref={listRef} className="flex min-h-[220px] flex-col gap-4">
        {term.trim().length < 2 && <li className="py-10 text-center text-[14px] text-gray-500">Type at least 2 letters. You only see students in your courses, advisees and supervisees.</li>}
        {term.trim().length >= 2 && !loading && shown.length === 0 && (
          <li className="py-10 text-center text-[14px] text-gray-500">No matches for “{term}” in your courses, advisees or supervisees.</li>
        )}
        {grouped.map((g) => (
          <li key={g.kind}>
            <p className="mb-1 px-2 text-[11px] font-bold tracking-wider text-gray-400 uppercase">{KIND_LABEL[g.kind]}</p>
            <ul>
              {g.items.map((r) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <li key={`${r.kind}-${r.id}-${r.index}`} id={`sr-${r.index}`} role="option" aria-selected={cursor === r.index} data-index={r.index}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(r.index)}
                      onClick={() => go(r)}
                      className={cn("flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2.5 text-left", cursor === r.index ? "bg-[#eef3fd] dark:bg-[#003cbb]/20" : "hover:bg-gray-50 dark:hover:bg-gray-800")}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-gray-900 dark:text-gray-100">{r.title}</span>
                        <span className="block truncate text-[12px] text-gray-500">{r.subtitle}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
