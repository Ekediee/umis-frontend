"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type TypewriterSegment =
  | { text: string; className?: string }
  | { break: true };

interface TypewriterHeadingProps {
  segments: TypewriterSegment[];
  className?: string;
  /** Delay before the first character is typed (ms). */
  startDelay?: number;
  /** Base delay between characters (ms). */
  speed?: number;
  /** How long the caret keeps blinking once typing completes (ms). */
  caretLinger?: number;
}

const isBreak = (s: TypewriterSegment): s is { break: true } => "break" in s;

/**
 * Types out a heading character by character.
 *
 * The full text is always rendered (untyped characters are just transparent),
 * so line wrapping is decided up front and nothing shifts while typing. The
 * text is also present in the SSR output for SEO and screen readers.
 */
export function TypewriterHeading({
  segments,
  className,
  startDelay = 500,
  speed = 55,
  caretLinger = 2500,
}: TypewriterHeadingProps) {
  const reduceMotion = useReducedMotion();
  const total = segments.reduce((n, s) => n + (isBreak(s) ? 0 : s.text.length), 0);

  const [typed, setTyped] = useState(0);
  const [showCaret, setShowCaret] = useState(true);

  const done = reduceMotion || typed >= total;

  useEffect(() => {
    if (reduceMotion) return;

    if (typed >= total) {
      const t = setTimeout(() => setShowCaret(false), caretLinger);
      return () => clearTimeout(t);
    }

    // Small, human-feeling jitter, with a longer beat after spaces.
    const prevChar = charAt(segments, typed - 1);
    const delay =
      typed === 0 ? startDelay : speed + Math.random() * 40 + (prevChar === " " ? 60 : 0);

    const t = setTimeout(() => setTyped((n) => n + 1), delay);
    return () => clearTimeout(t);
  }, [typed, total, reduceMotion, segments, speed, startDelay, caretLinger]);

  const visibleCount = reduceMotion ? total : typed;
  const fullText = segments.map((s) => (isBreak(s) ? " " : s.text)).join("");

  let consumed = 0;
  let caretPlaced = false;

  return (
    <h1 className={className}>
      <span className="sr-only">{fullText}</span>
      <span aria-hidden="true">
        {segments.map((seg, i) => {
          if (isBreak(seg)) return <br key={i} />;

          const start = consumed;
          consumed += seg.text.length;
          const shown = Math.max(0, Math.min(seg.text.length, visibleCount - start));

          // Place the caret in the segment currently being typed (or the last one when done).
          const caretHere =
            !caretPlaced && !reduceMotion && showCaret &&
            (shown < seg.text.length || (done && consumed === total));
          if (caretHere) caretPlaced = true;

          return (
            <span key={i} className={seg.className}>
              {seg.text.slice(0, shown)}
              {caretHere && <Caret blinking={done || typed === 0} />}
              <span className="opacity-0">{seg.text.slice(shown)}</span>
            </span>
          );
        })}
      </span>
    </h1>
  );
}

function charAt(segments: TypewriterSegment[], index: number): string | undefined {
  if (index < 0) return undefined;
  let offset = 0;
  for (const s of segments) {
    if (isBreak(s)) continue;
    if (index < offset + s.text.length) return s.text[index - offset];
    offset += s.text.length;
  }
  return undefined;
}

/**
 * Zero-width inline anchor with an absolutely positioned bar, so the caret never
 * takes up space or introduces a line-break opportunity mid-word.
 */
function Caret({ blinking }: { blinking: boolean }) {
  return (
    <span className="relative">
      <motion.span
        className="absolute left-[2px] top-[0.12em] h-[0.95em] w-[3px] rounded-full bg-brand-blue dark:bg-[#33FFC2]"
        animate={blinking ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
        transition={blinking ? { duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] } : { duration: 0 }}
      />
    </span>
  );
}
