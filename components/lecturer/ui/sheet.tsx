"use client";

/**
 * Sheet — one component, two shapes:
 * - phones: bottom sheet with drag handle (student app + Linktree share sheet)
 * - desktop: centred dialog, or a right-hand side panel for detail views
 *
 * Handles Escape, focus trap, focus restore, scroll lock and aria-modal.
 */

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "dialog" | "panel";
  size?: "sm" | "md" | "lg";
  /** Block closing while a write is in flight. */
  dismissible?: boolean;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, description, children, footer, variant = "dialog", size = "md", dismissible = true }: SheetProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 60);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panelRef.current) {
        const nodes = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose, dismissible]);

  if (typeof document === "undefined") return null;

  const width = { sm: "md:max-w-[420px]", md: "md:max-w-[520px]", lg: "md:max-w-[720px]" }[size];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[300]">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onClose()}
          />
          <div className={cn("pointer-events-none absolute inset-0 flex items-end", variant === "dialog" ? "md:items-center md:justify-center md:p-6" : "md:items-stretch md:justify-end")}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, x: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 32, stiffness: 380 }}
              className={cn(
                "pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:bg-gray-900 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]",
                variant === "dialog" ? cn("md:rounded-[24px] md:shadow-2xl", width) : "md:h-full md:max-h-none md:max-w-[560px] md:rounded-none md:rounded-l-[24px]",
              )}
            >
              <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
                <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>
              <div className="flex items-start justify-between gap-4 px-5 pt-2 pb-3 md:px-6 md:pt-5">
                <div className="min-w-0">
                  <h2 id={titleId} className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-gray-50">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={!dismissible}
                  aria-label="Close"
                  className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 md:px-6">{children}</div>
              {footer && <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/70 px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:px-6 dark:border-gray-800 dark:bg-gray-900">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
