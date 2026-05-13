"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { ImageLightbox } from "./image-lightbox";

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageCarousel({ images, alt, className }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isDragging = useRef(false);
  const [translateX, setTranslateX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const SWIPE_THRESHOLD = 40;

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTranslateX(0);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

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
        // Swiped left → next
        goTo(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
      } else {
        // Swiped right → prev
        goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
      }
    } else {
      // Snap back
      setIsTransitioning(true);
      setTranslateX(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  if (images.length === 0) return null;

  return (
    <>
      <div
        className={`relative group overflow-hidden rounded-[4px] ${className || "h-[152px] w-full"}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image Track */}
        <div
          className="w-full h-full relative"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isTransitioning ? "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="relative w-full h-full cursor-pointer"
            type="button"
          >
            <Image
              src={images[currentIndex]}
              alt={`${alt} - image ${currentIndex + 1}`}
              fill
              className="object-cover"
              style={{
                transition: isTransitioning ? "opacity 0.3s ease" : "none",
                width: "100%",
                height: "100%",
              }}
              priority
              sizes="(max-width: 768px) 50vw, 270px"
            />
          </button>
        </div>

        {/* Navigation Arrows — only when multiple images, desktop hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 text-[#0a0d14]" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              type="button"
            >
              <ChevronRight className="w-4 h-4 text-[#0a0d14]" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(idx);
                  }}
                  className={`rounded-full transition-all duration-200 ${
                    idx === currentIndex
                      ? "w-2 h-2 bg-white"
                      : "w-1.5 h-1.5 bg-white/50"
                  }`}
                  type="button"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox — passes all images for scrolling */}
      <ImageLightbox
        images={images}
        initialIndex={currentIndex}
        alt={alt}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
