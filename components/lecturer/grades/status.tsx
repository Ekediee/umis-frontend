"use client";

/** Grade sheet status model (5B): Open → With HOD → With Dean → With Registry → Released, or Returned. */

import { Check, Clock, Lock, Undo2 } from "lucide-react";
import { dayDate } from "@/lib/lecturer/format";
import type { GradeSheet, GradeSheetStatus } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Chip, type Tone } from "../ui/primitives";

export const SHEET_STATUS: Record<GradeSheetStatus, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "blue" },
  with_hod: { label: "With HOD", tone: "purple" },
  returned: { label: "Returned", tone: "red" },
  with_dean: { label: "With Dean", tone: "purple" },
  with_registry: { label: "With Registry", tone: "purple" },
  released: { label: "Released", tone: "green" },
};

export function SheetStatusChip({ status }: { status: GradeSheetStatus }) {
  const s = SHEET_STATUS[status];
  return (
    <Chip tone={s.tone} icon={status === "returned" ? Undo2 : status === "open" ? Clock : status === "released" ? Check : Lock}>
      {s.label}
    </Chip>
  );
}

const STEPS: { status: GradeSheetStatus; label: string }[] = [
  { status: "with_hod", label: "Submitted" },
  { status: "with_dean", label: "HOD" },
  { status: "with_registry", label: "Dean" },
  { status: "released", label: "Registry" },
  { status: "released", label: "Released" },
];

/** 5B.4 status tracker with dates. */
export function StatusTracker({ sheet }: { sheet: GradeSheet }) {
  const order: GradeSheetStatus[] = ["open", "with_hod", "with_dean", "with_registry", "released"];
  const current = order.indexOf(sheet.status === "returned" ? "with_hod" : sheet.status);
  const dateFor = (s: GradeSheetStatus) => sheet.history.filter((h) => h.status === s).at(-1)?.at;
  return (
    <ol className="flex w-full items-start" aria-label="Approval progress">
      {STEPS.map((step, i) => {
        const reached = current >= i + 1 || (i === STEPS.length - 1 && sheet.status === "released");
        const isNow = current === i + 1 && sheet.status !== "released";
        const at = i === 0 ? dateFor("with_hod") : i < 4 ? dateFor(order[i + 1]) : undefined;
        return (
          <li key={step.label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : reached || isNow ? "bg-[#003cbb]" : "bg-gray-200 dark:bg-gray-700")} />
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                  reached ? "bg-[#003cbb] text-white" : isNow ? "bg-white text-[#003cbb] ring-2 ring-[#003cbb] dark:bg-gray-900" : "bg-gray-100 text-gray-400 dark:bg-gray-800",
                )}
              >
                {reached ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "bg-transparent" : reached ? "bg-[#003cbb]" : "bg-gray-200 dark:bg-gray-700")} />
            </div>
            <span className={cn("text-[12px] font-semibold", reached || isNow ? "text-gray-900 dark:text-gray-100" : "text-gray-400")}>{step.label}</span>
            <span className="text-[11px] text-gray-400">{at ? dayDate(at) : isNow ? "Waiting" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
