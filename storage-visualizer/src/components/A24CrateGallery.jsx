import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import A24PhysicalDisc from './A24PhysicalDisc';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { playVinylClick, playButtonSnap } from '../utils/soundEffects';

/**
 * A24CrateGallery
 * The core arched record crate experience directly mirroring the physical disc rail:
 * - Edge-to-edge panoramic full-screen view spanning length to length from side to side.
 * - Generous, polished padding amongst discs so each title and rim is clearly visible.
 * - Seamless infinite circular loop (wrapping from after last to first, and first to last).
 * - Interactive hover scrolling (scrolling wheel/trackpad anywhere on the carousel rotates discs).
 * - True physical 3D arch with apex elevation, tangential slope rotation, and 3D yaw.
 * - Full mouse drag, wheel scroll, keyboard arrows, and navigation buttons.
 */
export default function A24CrateGallery({
  catalog,
  activeIndex,
  onSelectIndex,
  onOpenFocalView,
  selectedCategory,
  onSelectCategory,
  theme = 'base', // 'base' or 'dark'
}) {
  const activeItem = catalog[activeIndex] || catalog[0] || {};
  const isDark = theme === 'dark';
  const total = catalog.length;

  // Track viewport width for responsive side-to-side spacing and visible range
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stage container reference for hover-scroll interception
  const stageRef = useRef(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentDragDeltaRef = useRef(0);

  // Advance / Retreat navigation helpers with circular modulo wrapping
  const handleNext = useCallback(() => {
    if (total === 0) return;
    playVinylClick();
    onSelectIndex((prev) => (prev + 1) % total);
  }, [total, onSelectIndex]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    playVinylClick();
    onSelectIndex((prev) => (prev - 1 + total) % total);
  }, [total, onSelectIndex]);

  // Keyboard navigation (Left / Right arrow keys, Enter to open focal view)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Enter') {
        onOpenFocalView(activeItem);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, activeItem, onOpenFocalView]);

  // Non-passive wheel event listener on the carousel stage for natural hover-scroll
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let accumulatedDelta = 0;
    let isThrottled = false;
    let resetTimer = null;

    const onWheel = (e) => {
      // Prevent standard browser page scroll while over the CD carousel
      e.preventDefault();
      e.stopPropagation();

      // Support horizontal swipe or vertical mouse wheel roll
      const delta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      accumulatedDelta += delta;

      if (!isThrottled) {
        if (accumulatedDelta > 22) {
          isThrottled = true;
          accumulatedDelta = 0;
          handleNext();
          setTimeout(() => {
            isThrottled = false;
          }, 140);
        } else if (accumulatedDelta < -22) {
          isThrottled = true;
          accumulatedDelta = 0;
          handlePrev();
          setTimeout(() => {
            isThrottled = false;
          }, 140);
        }
      }

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        accumulatedDelta = 0;
      }, 120);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheel);
      clearTimeout(resetTimer);
    };
  }, [handleNext, handlePrev]);

  // Mouse Drag handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    currentDragDeltaRef.current = 0;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    currentDragDeltaRef.current = e.clientX - startXRef.current;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = currentDragDeltaRef.current;
    if (delta < -45) {
      handleNext();
    } else if (delta > 45) {
      handlePrev();
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
    currentDragDeltaRef.current = 0;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    currentDragDeltaRef.current = e.touches[0].clientX - startXRef.current;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const delta = currentDragDeltaRef.current;
    if (delta < -45) {
      handleNext();
    } else if (delta > 45) {
      handlePrev();
    }
  };

  // Dynamic side-to-side spacing calculation to span full screen width
  // Provides generous padding between discs to avoid crowded overlapping
  const spacingX = useMemo(() => {
    if (viewportWidth >= 1900) return 380;
    if (viewportWidth >= 1600) return 360;
    if (viewportWidth >= 1360) return 335;
    if (viewportWidth >= 1024) return 295;
    if (viewportWidth >= 768) return 260;
    return 210;
  }, [viewportWidth]);

  // Maximum delta visible across the full screen width
  const maxDelta = viewportWidth >= 1600 ? 4 : 3;

  // Parabolic curvature drop factor
  const curvatureY = useMemo(() => {
    if (viewportWidth >= 1600) return 24;
    if (viewportWidth >= 1200) return 22;
    return 20;
  }, [viewportWidth]);

  // Helper: Shortest circular delta for infinite seamless loop (after last to first)
  const getCircularDelta = useCallback(
    (itemIndex, activeIdx, count) => {
      let delta = itemIndex - activeIdx;
      while (delta > count / 2) delta -= count;
      while (delta < -count / 2) delta += count;
      return delta;
    },
    []
  );

  const categories = ['ALL', 'DISK SCHEDULING', 'FILE ALLOCATION', 'PAGE CACHE'];

  return (
    <section
      id="section_hero"
      className={`relative min-h-[90vh] flex flex-col justify-center items-center gap-6 pt-24 pb-12 w-full overflow-hidden transition-colors duration-500 select-none ${
        isDark ? 'bg-[#07070a] text-[#f3f1ea]' : 'bg-[#f2f2f2] text-[#0d0d11]'
      }`}
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[520px] rounded-full pointer-events-none opacity-20 blur-[140px] transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${activeItem.accentColor || '#891a20'}, transparent 70%)`,
        }}
      />

      {/* TOP ROW: EXPERIENCE INFO (TITLE & METADATA) & CATEGORY PILLS */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 lg:px-24">
        {/* Left: Active Title & Credits */}
        <div className="w-full lg:max-w-md flex flex-col justify-start">
          <div className="flex items-center space-x-3 mb-2">
            <span
              className={`text-[10px] font-mono-tech tracking-[0.25em] uppercase font-bold ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              {activeItem.matrixCode}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-[#f3f1ea]/40' : 'bg-[#0d0d11]/40'
              }`}
            />
            <span
              className={`text-[10px] font-mono-tech tracking-[0.2em] uppercase font-bold ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              YEAR {activeItem.year}
            </span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl font-tall font-bold uppercase tracking-tight leading-none mb-1">
            {activeItem.title}
          </h1>

          <p
            className={`text-lg sm:text-xl font-editorial italic mb-4 ${
              isDark ? 'text-[#dedbd2]' : 'text-[#3a3942]'
            }`}
          >
            {activeItem.aka}
          </p>

          {/* Info Panels */}
          <div className="w-full space-y-1">
            <div
              className={`py-1.5 border-t flex justify-between items-center text-xs ${
                isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
              }`}
            >
              <span
                className={`text-[9px] font-mono-tech uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                ALGORITHM DOMAIN
              </span>
              <span className="font-semibold text-right">{activeItem.category}</span>
            </div>

            <div
              className={`py-1.5 border-t flex justify-between items-center text-xs ${
                isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
              }`}
            >
              <span
                className={`text-[9px] font-mono-tech uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                RUNTIME COMPLEXITY
              </span>
              <span className="font-mono-tech text-right font-bold">{activeItem.runtime}</span>
            </div>

            <div
              className={`py-1.5 border-t border-b flex justify-between items-center text-xs ${
                isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
              }`}
            >
              <span
                className={`text-[9px] font-mono-tech uppercase tracking-[0.2em] ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                SPECIFICATION YEAR
              </span>
              <span className="font-mono-tech text-right font-bold">
                {activeItem.year}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Category Selector & Focal CTA */}
        <div className="flex flex-col lg:items-end justify-between space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  playVinylClick();
                  onSelectCategory(cat);
                }}
                className={`px-3 py-1.5 text-[10px] font-mono-tech uppercase tracking-[0.2em] transition-all border ${
                  selectedCategory === cat
                    ? isDark
                      ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] font-bold'
                      : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] font-bold'
                    : isDark
                    ? 'bg-transparent text-[#8c8b94] border-[#24242e] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'bg-transparent text-[#6b6a72] border-[#0d0d11]/20 hover:border-[#0d0d11] hover:text-[#0d0d11]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Focal View Deep Dive CTA */}
          <button
            onClick={() => {
              playButtonSnap();
              onOpenFocalView(activeItem);
            }}
            className={`group flex items-center space-x-3 px-6 py-3.5 font-mono-tech text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-lg ${
              isDark
                ? 'bg-[#f3f1ea] text-[#07070a] hover:bg-white hover:scale-105 active:scale-95'
                : 'bg-[#0d0d11] text-[#f2f2f2] hover:bg-black hover:scale-105 active:scale-95'
            }`}
          >
            <span>INSPECT ALGORITHM // FOCAL VIEW</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* CENTER STAGE: FULL-SCREEN LENGTH-TO-LENGTH ARCHED RECORD CRATE DISPLAY */}
      {/* Interactive hover-scroll, drag, and seamless infinite wrapping */}
      <div
        ref={stageRef}
        className="my-6 relative w-full h-[460px] sm:h-[500px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows positioned at screen edges */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className={`absolute left-4 sm:left-8 md:left-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full border transition-all backdrop-blur-md shadow-xl ${
            isDark
              ? 'bg-[#07070a]/85 border-[#24242e] text-[#f3f1ea] hover:bg-[#14141c] hover:scale-110 active:scale-95'
              : 'bg-[#f2f2f2]/85 border-[#0d0d11]/20 text-[#0d0d11] hover:bg-white hover:scale-110 active:scale-95'
          }`}
          aria-label="Previous Disc"
        >
          <ChevronLeft size={22} className="shrink-0" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className={`absolute right-4 sm:right-8 md:right-12 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center rounded-full border transition-all backdrop-blur-md shadow-xl ${
            isDark
              ? 'bg-[#07070a]/85 border-[#24242e] text-[#f3f1ea] hover:bg-[#14141c] hover:scale-110 active:scale-95'
              : 'bg-[#f2f2f2]/85 border-[#0d0d11]/20 text-[#0d0d11] hover:bg-white hover:scale-110 active:scale-95'
          }`}
          aria-label="Next Disc"
        >
          <ChevronRight size={22} className="shrink-0" />
        </button>

        {/* The Arched Disc Stage spanning length to length from side to side */}
        <div 
          className="relative w-full h-full pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {catalog.map((item, idx) => {
            // Infinite seamless loop calculation: wraps past last to first, and before first to last
            const delta = getCircularDelta(idx, activeIndex, total);

            // Filter out items beyond the panoramic visible arch range
            if (Math.abs(delta) > maxDelta) return null;

            // Geometry of the Physical Arch:
            // xPos: wide horizontal spacing spanning length to length
            // yPos: smooth parabolic drop on sides, active disc at apex (0px)
            // rotZ: tangential tilt along the curve
            // rotY: 3D perspective inward yaw
            const xPos = delta * spacingX;
            const yPos = Math.pow(Math.abs(delta), 1.62) * curvatureY;
            const rotZ = delta * 5.2; // degrees tilt along slope
            const rotY = -delta * 11; // degrees yaw towards camera
            const scale = Math.max(0.68, 1.14 - Math.abs(delta) * 0.13);
            const opacity = Math.max(0.15, 1 - Math.abs(delta) * 0.22);
            const zIndex = 40 - Math.abs(delta) * 5;

            const isSelected = delta === 0;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  playVinylClick();
                  if (isSelected) {
                    onOpenFocalView(item);
                  } else {
                    onSelectIndex(idx);
                  }
                }}
                className="pointer-events-auto cursor-pointer will-change-transform"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '270px',
                  height: '270px',
                  transform: `translate(-50%, -50%) translate3d(${xPos}px, ${yPos}px, 0) rotateZ(${rotZ}deg) rotateY(${rotY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transformOrigin: 'center center',
                  transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease',
                }}
              >
                <A24PhysicalDisc
                  item={item}
                  isActive={isSelected}
                  isSpinning={isSelected}
                  size={270}
                  theme={theme}
                  showScribble={isSelected}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
