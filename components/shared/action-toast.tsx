"use client";

/**
 * A toast with a clear next step: icon, title and message, then the action
 * button underneath (never squeezed beside the text on a phone).
 * Rendered with sonner's `toast.custom`, so it stacks and dismisses like any toast.
 *
 *   showActionToast({ title, description, actionLabel, onAction, tone: "error" })
 */

import { toast } from "sonner";
import { AlertCircle, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "error" | "info";

/**
 * Error uses the same red fill as the app's other error toasts, in both themes,
 * so it stands out on a dark page instead of blending into it.
 */
const TONE: Record<Tone, { card: string; iconWrap: string; icon: string; title: string; body: string; close: string; action: string }> = {
  error: {
    card: "bg-[#FFF0F0] border-[#FFE0E1]",
    iconWrap: "bg-white border border-[#FFE0E1]",
    icon: "text-[#E60000]",
    title: "text-[#E60000]",
    body: "text-[#B42318]",
    close: "text-[#E60000]/60 hover:text-[#E60000] hover:bg-[#FFE0E1]",
    action: "bg-[#003cbb] hover:bg-[#002e8f]",
  },
  info: {
    card: "bg-white dark:bg-gray-900 border-[#ccdcfd] dark:border-[#2563EB]/40",
    iconWrap: "bg-[#eef3fd] dark:bg-[#2563EB]/15",
    icon: "text-[#003cbb] dark:text-[#8FB0FF]",
    title: "text-[#0A0D14] dark:text-gray-100",
    body: "text-[#525866] dark:text-gray-400",
    close: "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
    action: "bg-[#003cbb] dark:bg-[#2563EB] hover:bg-[#002e8f] dark:hover:bg-[#1D4ED8]",
  },
};

interface ActionToastProps {
  id: string | number;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  icon?: LucideIcon;
  actionIcon?: LucideIcon;
  tone?: Tone;
}

function ActionToast({ id, title, description, actionLabel, onAction, icon: Icon = AlertCircle, actionIcon: ActionIcon, tone = "error" }: ActionToastProps) {
  const t = TONE[tone];
  return (
    <div
      role="alert"
      className={cn(
        "relative w-[356px] max-w-[calc(100vw-32px)] rounded-[16px] border p-4 pr-10",
        "shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]",
        t.card,
      )}
    >
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="Dismiss"
        className={cn("absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-colors", t.close)}
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex gap-3">
        <span className={cn("w-9 h-9 shrink-0 rounded-full flex items-center justify-center", t.iconWrap)}>
          <Icon className={cn("w-[18px] h-[18px]", t.icon)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("text-[14px] font-semibold leading-snug", t.title)}>{title}</p>
          {description && <p className={cn("mt-0.5 text-[13px] leading-relaxed", t.body)}>{description}</p>}
          <button
            type="button"
            onClick={() => {
              toast.dismiss(id);
              onAction();
            }}
            className={cn("mt-3 inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-[10px] text-white text-[13px] font-semibold transition-colors", t.action)}
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function showActionToast(props: Omit<ActionToastProps, "id"> & { duration?: number }) {
  const { duration = 12000, ...rest } = props;
  return toast.custom((id) => <ActionToast id={id} {...rest} />, { duration });
}
