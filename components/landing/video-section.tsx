"use client";

/**
 * "BU Pulse in 60 seconds": the product film, right under the hero.
 *
 * - Starts playing (muted, as browsers require for autoplay) when at least half
 *   of it scrolls into view, and pauses when it scrolls away, resuming where it left off.
 * - The file only downloads as the section approaches; phones get the 720p cut.
 * - Students who ask for reduced motion get a play button instead of autoplay.
 * - Sound, play/pause, replay and full screen are one tap away.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Clapperboard, Maximize2, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { SectionEyebrow } from "./edu-decor";
import { cn } from "@/lib/utils";

const SRC_1080 = "/videos/bu-pulse-60s-1080.mp4";
const SRC_720 = "/videos/bu-pulse-60s-720.mp4";
const POSTER = "/videos/bu-pulse-60s-poster.jpg";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoSection() {
  const wrap = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false); // load the file only as the section approaches
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(60);
  // Once the student pauses it themselves, scrolling never restarts it
  const userPaused = useRef(false);

  useEffect(() => {
    const el = wrap.current;
    const v = video.current;
    if (!el || !v) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // React doesn't reliably apply the `muted` attribute, and browsers only autoplay muted video
    v.muted = true;
    v.defaultMuted = true;

    const preload = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    preload.observe(el);

    const autoplay = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.5) {
          if (!reduceMotion && !userPaused.current && v.paused && !v.ended) v.play().catch(() => {});
        } else if (!v.paused) {
          v.pause();
        }
      },
      { threshold: [0, 0.5] },
    );
    autoplay.observe(el);
    return () => {
      preload.disconnect();
      autoplay.disconnect();
    };
  }, []);

  // Sources are added when the section comes near; a <video> only picks them up on load()
  useEffect(() => {
    if (near) video.current?.load();
  }, [near]);

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.ended) {
      v.currentTime = 0;
      userPaused.current = false;
      v.play().catch(() => {});
    } else if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  }, []);

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    // Turning sound on is a clear "I'm watching": make sure it's playing
    if (!v.muted && v.paused) toggle();
  };

  const fullscreen = () => {
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.(); // iPhone Safari
  };

  const seek = (e: React.PointerEvent<HTMLDivElement>) => {
    const v = video.current;
    if (!v || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
  };

  return (
    <section id="see-it" aria-labelledby="video-heading" className="relative w-full pt-4 pb-20 md:pb-24 bg-white dark:bg-[#0B0F19] z-10">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <SectionEyebrow icon={Clapperboard}>See it in action</SectionEyebrow>
          <motion.h2
            id="video-heading"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-extrabold text-[#101828] dark:text-white tracking-tight mb-4"
          >
            BU Pulse in 60 seconds
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-[#4A5565] dark:text-gray-400 leading-relaxed"
          >
            Register courses, pay fees, check results and plan your GPA. Here&apos;s a quick look at a semester on Pulse.
          </motion.p>
        </div>

        <motion.div
          ref={wrap}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative group"
        >
          {/* Soft brand glow behind the frame */}
          <div aria-hidden className="absolute -inset-4 md:-inset-6 rounded-[36px] bg-gradient-to-r from-[#33FFC2]/25 via-[#382AF7]/20 to-[#F514B1]/25 blur-2xl opacity-70 dark:opacity-40" />

          <div className="relative overflow-hidden rounded-[20px] md:rounded-[28px] border border-[#E5E7EB] dark:border-white/10 bg-[#f7f8fc] dark:bg-[#111827] aspect-video">
            <video
              ref={video}
              className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              poster={POSTER}
              muted
              playsInline
              preload={near ? "auto" : "none"}
              aria-label="BU Pulse product video, 60 seconds"
              onClick={toggle}
              onPlay={() => {
                setPlaying(true);
                setEnded(false);
              }}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setEnded(true);
              }}
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 60)}
            >
              {near && (
                <>
                  <source src={SRC_720} type="video/mp4" media="(max-width: 767px)" />
                  <source src={SRC_1080} type="video/mp4" />
                </>
              )}
            </video>

            {/* Big centre button while paused or at the end */}
            {!playing && (
              <button
                type="button"
                onClick={toggle}
                aria-label={ended ? "Watch again" : "Play video"}
                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/15 transition-colors"
              >
                <span className="flex items-center gap-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 pl-4 pr-5 py-3 shadow-xl text-[15px] font-semibold text-[#003CBB] dark:text-white">
                  <span className="w-9 h-9 rounded-full bg-[#003CBB] text-white flex items-center justify-center">
                    {ended ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
                  </span>
                  {ended ? "Watch again" : time > 0 ? "Resume" : "Watch the film"}
                </span>
              </button>
            )}

            {/* Sound prompt: autoplay is muted, so invite sound while it plays */}
            {playing && muted && (
              <button
                type="button"
                onClick={toggleSound}
                className="absolute top-3 right-3 md:top-4 md:right-4 inline-flex items-center gap-2 rounded-full bg-black/55 hover:bg-black/70 backdrop-blur px-3.5 py-2 text-[13px] font-semibold text-white transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                Tap for sound
              </button>
            )}

            {/* Control bar */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 px-3 md:px-4 pb-3 pt-10 bg-gradient-to-t from-black/55 to-transparent transition-opacity duration-300",
                playing ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100" : "opacity-100",
              )}
            >
              <div
                role="slider"
                tabIndex={0}
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(time)}
                aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
                onPointerDown={seek}
                onKeyDown={(e) => {
                  const v = video.current;
                  if (!v) return;
                  if (e.key === "ArrowRight") v.currentTime = Math.min(duration, v.currentTime + 5);
                  if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
                }}
                className="relative h-1.5 rounded-full bg-white/30 cursor-pointer mb-2.5"
              >
                <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${(time / (duration || 60)) * 100}%` }} />
              </div>
              <div className="flex items-center gap-1 text-white">
                <button type="button" onClick={toggle} aria-label={playing ? "Pause" : ended ? "Watch again" : "Play"} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15">
                  {playing ? <Pause className="w-4 h-4 fill-current" /> : ended ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Mute"} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="ml-1 text-[12px] font-medium tabular-nums text-white/90">
                  {fmt(time)} / {fmt(duration)}
                </span>
                <button type="button" onClick={fullscreen} aria-label="Full screen" className="ml-auto w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
