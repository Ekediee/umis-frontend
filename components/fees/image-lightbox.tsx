"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, alt, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);
  const [translateX, setTranslateX] = useState(0);

  const SWIPE_THRESHOLD = 50;

  // Sync initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setTranslateX(0);
    }
  }, [isOpen, initialIndex]);

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTranslateX(0);
    setTimeout(() => setIsTransitioning(false), 350);
  }, []);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, goTo]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    goTo(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, goTo]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
  }, [onClose, handlePrev, handleNext]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    isDragging.current = true;
    setIsTransitioning(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || images.length <= 1) return;
    touchEndX.current = e.touches[0].clientX;
    const delta = touchEndX.current - touchStartX.current;
    setTranslateX(delta);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || images.length <= 1) return;
    isDragging.current = false;
    const delta = touchEndX.current - touchStartX.current;

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else {
      // Snap back
      setIsTransitioning(true);
      setTranslateX(0);
      setTimeout(() => setIsTransitioning(false), 350);
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
      style={{
        animation: "lightbox-fade-in 0.2s ease-out",
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors duration-200"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className="text-[14px] font-medium text-white/90">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Image Container with swipe */}
      <div
        className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isTransitioning
              ? "transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              : "none",
          }}
        >
          <Image
            src={images[currentIndex]}
            alt={`${alt} - image ${currentIndex + 1}`}
            width={1200}
            height={800}
            className="object-contain max-w-[90vw] max-h-[85vh] rounded-xl select-none pointer-events-none"
            style={{
              transition: isTransitioning ? "opacity 0.3s ease" : "none",
            }}
            draggable={false}
            unoptimized
            priority
          />
        </div>
      </div>

      {/* Desktop Nav Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center transition-colors duration-200"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center transition-colors duration-200"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? "w-3 h-3 bg-white"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60"
              }`}
              type="button"
            />
          ))}
        </div>
      )}

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes lightbox-fade-in {
          from {
            opacity: 0;
            backdrop-filter: blur(0);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(12px);
          }
        }
      `}</style>
    </div>
  );
}
