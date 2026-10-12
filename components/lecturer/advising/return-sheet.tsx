"use client";

/** 6.3 Return with reason: chips + note; at least one chip or 10 characters. */

import { useState } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { lecturerApi } from "@/lib/lecturer/api";
import { fullName } from "@/lib/lecturer/format";
import { useMutation } from "@/lib/lecturer/query";
import { RETURN_REASON_LABELS, isReturnValid } from "@/lib/lecturer/rules";
import type { Registration, ReturnReason } from "@/lib/lecturer/types";
import { cn } from "@/lib/utils";
import { Btn, Field, Textarea } from "../ui/primitives";
import { Sheet } from "../ui/sheet";

export function ReturnSheet({ registration, onClose, onDone }: { registration: Registration | null; onClose: () => void; onDone?: () => void }) {
  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [note, setNote] = useState("");
  const send = useMutation(lecturerApi.returnRegistration, { invalidates: ["advising", "today:"] });

  // Pre-fill from failed checks whenever a different registration opens (6.2a).
  const [forId, setForId] = useState<string | null>(null);
  if ((registration?.id ?? null) !== forId) {
    setForId(registration?.id ?? null);
    if (registration) {
      const failed = registration.checks.filter((c) => !c.passed);
      setReasons([...new Set(failed.map((c) => c.suggestedReason).filter(Boolean) as ReturnReason[])]);
      setNote(failed.map((c) => c.detail).filter(Boolean).join(". "));
    }
  }

  const valid = isReturnValid(reasons, note);

  return (
    <Sheet
      open={!!registration}
      onClose={onClose}
      dismissible={!send.pending}
      title={registration ? `Return to ${fullName(registration.student)}` : ""}
      description="They see your reason on their registration screen and get a push and email. Their form reopens."
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            variant="dark"
            icon={Undo2}
            loading={send.pending}
            disabled={!valid}
            onClick={async () => {
              const r = await send.mutate(registration!.id, reasons, note.trim()).catch(() => undefined);
              if (r) {
                toast.success(`Returned to ${fullName(r.student)}`, { description: "Logged with time and reason." });
                onDone?.();
                onClose();
              }
            }}
          >
            Return with reason
          </Btn>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-gray-800 dark:text-gray-200">Reason</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RETURN_REASON_LABELS) as ReturnReason[]).map((r) => {
              const on = reasons.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReasons((list) => (on ? list.filter((x) => x !== r) : [...list, r]))}
                  className={cn(
                    "min-h-[40px] rounded-full border px-4 text-[13px] font-semibold transition-colors",
                    on ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300",
                  )}
                >
                  {RETURN_REASON_LABELS[r]}
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field label="What should they fix?" htmlFor="ret-note" hint={!valid ? "Pick a reason or write at least 10 characters." : "Be specific: name the course and what to change."}>
          <Textarea id="ret-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="e.g. Add COS 102 Problem Solving — you failed it in 2025/2026." />
        </Field>
      </div>
    </Sheet>
  );
}
