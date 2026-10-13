"use client";

import { useState } from "react";
import { ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { IconBubble, Toggle } from "@/components/student/ui";
import { studentApi } from "@/lib/student/api";
import type { Classmate } from "@/lib/student/types";

const PALETTE = ["bg-[#ebf1ff] text-[#003cbb]", "bg-[#effaf6] text-[#12B76A]", "bg-[#fdebff] text-[#a855f7]", "bg-[#ebfaff] text-[#0ea5e9]", "bg-amber-50 text-amber-600"];
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * Opt-in both ways: you only see classmates who chose to be visible, and only
 * after you choose to be visible yourself. Nothing else about you is shown.
 */
export function ClassmatesTab({ courseId, classmates, visible, onVisibleChange }: { courseId: string; classmates: Classmate[]; visible: boolean; onVisibleChange: (v: boolean) => void }) {
  const [saving, setSaving] = useState(false);

  const change = async (v: boolean) => {
    setSaving(true);
    onVisibleChange(v);
    try {
      await studentApi.setVisibleToClassmates(courseId, v);
      toast.success(v ? "You're visible to classmates in this course" : "You're hidden from classmates");
    } catch {
      onVisibleChange(!v);
      toast.error("Couldn't update your visibility.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4 p-4 md:p-5 rounded-[20px] bg-[#f6f8fa] dark:bg-gray-800/60">
        <IconBubble icon={ShieldCheck} tone="green" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-gray-900 dark:text-gray-100">Show me to classmates in {courseId}</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">Only your name, department and level are shown, so you can find people for study groups. Your grades and contact details stay private.</p>
        </div>
        <Toggle checked={visible} onChange={change} disabled={saving} label={`Show me to classmates in ${courseId}`} />
      </div>

      {!visible ? (
        <div className="flex flex-col items-center text-center py-10 px-4">
          <IconBubble icon={Users} tone="gray" size="lg" className="mb-3" />
          <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{classmates.length} classmates have opted in</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 max-w-sm">Turn on visibility above to see who they are. It works both ways.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {classmates.map((c, i) => (
            <li key={c.id} className="flex items-center gap-3 p-3 rounded-[16px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-in fade-in duration-300">
              <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center text-[13px] font-bold shrink-0 ${PALETTE[i % PALETTE.length]} dark:bg-gray-800 dark:text-gray-200`}>{initials(c.name)}</span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name}</span>
                <span className="block text-[12px] text-gray-500 dark:text-gray-400 truncate">
                  {c.department} · {c.level}L
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
