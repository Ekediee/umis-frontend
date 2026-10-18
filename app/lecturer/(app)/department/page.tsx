"use client";

/**
 * 9.2 Department page (moved out of the main menu) · 9.3 course catalogue entry.
 * Empty fields (Vision, Mission) are hidden, not shown blank. Duplicate codes
 * are tagged for the department admin only.
 */

import { useMemo, useState } from "react";
import { Copy, GraduationCap, Search, UserRound } from "lucide-react";
import { lecturerApi } from "@/lib/lecturer/api";
import { plural } from "@/lib/lecturer/format";
import { useLecturerQuery } from "@/lib/lecturer/query";
import { useLecturer } from "@/components/lecturer/shell/lecturer-provider";
import { Page } from "@/components/lecturer/shell/page";
import { CardSkeleton, Chip, ErrorState, Input, KeyValue, PageHeader, SectionTitle, Segmented, Surface } from "@/components/lecturer/ui/primitives";
import { Sheet } from "@/components/lecturer/ui/sheet";

type Entry = Awaited<ReturnType<typeof lecturerApi.getDepartment>>["catalogue"][number];

export default function DepartmentPage() {
  const q = useLecturerQuery("department", () => lecturerApi.getDepartment());
  const { hasRole } = useLecturer();
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState("all");
  const [open, setOpen] = useState<Entry | null>(null);
  const isAdmin = hasRole("hod"); // department admins and HODs see duplicate tags

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (q.data?.catalogue ?? []).filter((c) => (level === "all" || String(c.level) === level) && (!t || `${c.code} ${c.title}`.toLowerCase().includes(t)));
  }, [q.data, term, level]);

  if (q.error)
    return (
      <Page>
        <ErrorState error={q.error} screen="Department" onRetry={q.refetch} />
      </Page>
    );
  if (!q.data)
    return (
      <Page>
        <CardSkeleton rows={5} />
      </Page>
    );
  const d = q.data;

  return (
    <Page>
      <PageHeader title={d.departmentName} description={`${d.schoolName} · ${d.schoolCode} / ${d.departmentCode}`} />

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Surface>
            <SectionTitle title="People" as="h3" />
            <KeyValue label="Head of department" value={d.hod} />
            {d.advisorsByLevel.map((a) => (
              <KeyValue key={a.level} label={`Course advisor, Level ${a.level}`} value={a.name} />
            ))}
          </Surface>
          <Surface>
            <SectionTitle title="Programmes" as="h3" />
            <ul className="flex flex-col gap-2">
              {d.programmes.map((p) => (
                <li key={p.name} className="flex items-center gap-2 text-[14px] text-gray-800 dark:text-gray-200">
                  <GraduationCap className="size-4 text-gray-400" /> {p.name} <span className="text-gray-400">· {p.years} years</span>
                </li>
              ))}
            </ul>
          </Surface>
          {(d.vision || d.mission) && (
            <Surface>
              {d.vision && <KeyValue label="Vision" value={d.vision} />}
              {d.mission && <KeyValue label="Mission" value={d.mission} />}
            </Surface>
          )}
        </div>

        <Surface padded={false}>
          <div className="flex flex-col gap-3 p-5 md:p-6">
            <SectionTitle title="Course catalogue" count={d.catalogue.length} className="mb-0" />
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
              <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search code or title" className="pl-10" aria-label="Search courses" />
            </div>
            <Segmented ariaLabel="Level" size="sm" value={level} onChange={setLevel} options={[{ value: "all", label: "All levels" }, ...[100, 200, 300, 400].map((l) => ({ value: String(l), label: `${l}` }))]} />
          </div>
          <ul className="divide-y divide-gray-100 border-t border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            {list.map((c) => (
              <li key={c.code}>
                <button type="button" onClick={() => setOpen(c)} className="flex min-h-[60px] w-full items-center gap-3 px-5 text-left hover:bg-gray-50 md:px-6 dark:hover:bg-gray-800/40">
                  <span className="w-[96px] shrink-0 text-[13px] font-bold text-gray-900 dark:text-gray-100">{c.code}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-gray-700 dark:text-gray-300">{c.title}</span>
                  {isAdmin && c.possibleDuplicateOf && (
                    <Chip tone="amber" icon={Copy} className="hidden sm:inline-flex">
                      Possible duplicate
                    </Chip>
                  )}
                  {c.teaching && <UserRound className="size-4 text-[#003cbb]" aria-label="You teach this" />}
                  <span className="w-[72px] text-right text-[12px] text-gray-500">
                    {plural(c.units, "unit")} · {c.level}
                  </span>
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="p-8 text-center text-[14px] text-gray-500">No course matches “{term}”.</li>}
          </ul>
        </Surface>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} size="sm" title={open ? `${open.code} · ${open.title}` : ""} description="Read-only. Your department admin manages the catalogue in BU Pulse.">
        {open && (
          <div>
            <KeyValue label="Units" value={open.units} />
            <KeyValue label="Level" value={open.level} />
            <KeyValue label="Prerequisites" value={open.prerequisites.length ? open.prerequisites.join(", ") : "None"} />
            <KeyValue label="Teaching this semester" value={open.teaching ?? "Not allocated"} />
          </div>
        )}
      </Sheet>
    </Page>
  );
}
