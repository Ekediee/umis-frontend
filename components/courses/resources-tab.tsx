"use client";

import { Download, ExternalLink, FileText, FolderOpen, Presentation, FileType2, Image as ImageIcon, Link2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionLabel } from "@/components/student/ui";
import type { Material } from "@/lib/student/types";
import { cn } from "@/lib/utils";
import { NotebookLmCard } from "./notebooklm";

const KIND: Record<Material["kind"], { label: string; icon: typeof FileText; cls: string }> = {
  pdf: { label: "PDF", icon: FileText, cls: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" },
  pptx: { label: "PPTX", icon: Presentation, cls: "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400" },
  docx: { label: "DOCX", icon: FileType2, cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" },
  image: { label: "IMG", icon: ImageIcon, cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" },
  link: { label: "LINK", icon: Link2, cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  paper: { label: "PAPER", icon: FileText, cls: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400" },
};

const size = (kb?: number) => (kb === undefined ? "" : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

export function ResourcesTab({ courseId, materials }: { courseId: string; materials: Material[] }) {
  if (!materials.length) return <EmptyState icon={FolderOpen} title="No resources yet" description="Slides, reading lists and past questions appear here as your lecturer uploads them." className="min-h-[240px]" />;

  const weeks = [...new Set(materials.map((m) => m.week))].sort((a, b) => b - a);

  const open = (m: Material) => {
    if (m.url) {
      window.open(m.url, "_blank", "noopener,noreferrer");
      return;
    }
    toast.message("File not uploaded yet", { description: "This is demo data. Files open here once lecturers upload them in the lecturer portal." });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="lg:hidden">
        <NotebookLmCard courseId={courseId} compact />
      </div>
      {weeks.map((w) => (
        <section key={w}>
          <SectionLabel>{w === 0 ? "Course outline" : `Week ${w}`}</SectionLabel>
          <ul className="flex flex-col gap-2">
            {materials
              .filter((m) => m.week === w)
              .map((m) => {
                const k = KIND[m.kind];
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => open(m)}
                      className="w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[16px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 text-left transition-all active:scale-[0.995] group"
                    >
                      <span className={cn("w-11 h-11 rounded-[12px] inline-flex flex-col items-center justify-center shrink-0", k.cls)}>
                        <k.icon className="w-4 h-4" />
                        <span className="text-[8px] font-extrabold tracking-wider mt-0.5">{k.label}</span>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name}</span>
                        <span className="block text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                          {size(m.sizeKb)}
                          {m.releaseAt ? ` · Added ${new Date(m.releaseAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : ""}
                        </span>
                      </span>
                      <span className="w-9 h-9 rounded-full inline-flex items-center justify-center text-gray-400 group-hover:text-[#003cbb] dark:group-hover:text-[#4d82ff] group-hover:bg-[#eef3fd] dark:group-hover:bg-[#003cbb]/20 transition-colors shrink-0">
                        {m.kind === "link" ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
      <p className="text-[12px] text-gray-400 dark:text-gray-500">Files you open stay available offline on this device.</p>
    </div>
  );
}
