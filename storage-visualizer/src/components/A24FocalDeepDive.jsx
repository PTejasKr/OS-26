import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import A24PhysicalDisc from './A24PhysicalDisc';
import Drive3DCanvas from './Drive3DCanvas';
import TrajectoryChart from './TrajectoryChart';
import StepCalculationProof from './StepCalculationProof';
import AsciiDiagrams from './AsciiDiagrams';
import DataFlowStateMachine from './DataFlowStateMachine';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import {
  simulateDiskScheduling,
} from '../algorithms/diskScheduling';
import {
  playVinylClick,
  playSeekTick,
  playSeekChime,
  playButtonSnap,
  toggleMute,
  isMuted,
} from '../utils/soundEffects';

/**
 * A24FocalDeepDive
 * Deep-dive focal takeover page following the exact editorial design language
 * of a24.raviklaassens.com:
 * - Huge tall condensed headline typography
 * - Editorial italic serif quotes & film-journal synopsis
 * - Accolades & awards citations
 * - Embedded 3D Hardware Platter, Trajectory, Math Proof, & ASCII Schematics
 * - Up-Next endless crate scroll transition at bottom
 */
const A24FocalDeepDive = React.memo(function A24FocalDeepDive({
  item,
  catalog,
  onClose,
  onSelectNext,
  theme = 'dark',
  onToggleTheme,
}) {
  const [activeTab, setActiveTab] = useState('simulation'); // 'simulation', 'hardware3d', 'ascii', 'pipeline'
  const [isSpinning, setIsSpinning] = useState(true);
  const [muted, setMuted] = useState(isMuted());
  const isDark = theme === 'dark';

  // Interactive Simulation State for this algorithm
  const [queueStr, setQueueStr] = useState(
    (item.defaultQueue || [98, 183, 37, 122, 14, 124, 65, 67]).join(', ')
  );
  const [headPos, setHeadPos] = useState(item.defaultHead || 53);
  const [direction, setDirection] = useState(item.defaultDirection || 'right');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Parse queue string
  const parsedQueue = useMemo(() => {
    return queueStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 199);
  }, [queueStr]);

  // Compute simulation trajectory using the verified mathematical algorithms
  const simulationResult = useMemo(() => {
    const algoKey = item.id.toUpperCase();
    return simulateDiskScheduling(algoKey, parsedQueue, headPos, direction, 0, 199);
  }, [item.id, parsedQueue, headPos, direction]);

  const currentTrack =
    simulationResult.trajectory[
      Math.min(currentStepIndex, simulationResult.trajectory.length - 1)
    ] ?? headPos;

  // Next item in the catalog for the "UP NEXT" transition
  const currentIndex = catalog.findIndex((c) => c.id === item.id);
  const nextItem = catalog[(currentIndex + 1) % catalog.length];

  const pageRootRef = useRef(null);
  const footerRef = useRef(null);
  const footerStageRef = useRef(null);
  const footerGlowRef = useRef(null);
  const footerDiscRef = useRef(null);
  const bar0Ref = useRef(null);
  const bar1Ref = useRef(null);
  const statusLabelRef = useRef(null);
  const [footerPullCount, setFooterPullCount] = useState(0);
  const isAdvancingRef = useRef(false);
  const pullCountRef = useRef(0);
  const pullProgressRef = useRef(0);
  const dragRafRef = useRef(null);
  const resetTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const clearDragTimerRef = useRef(null);
  const didDragRef = useRef(false);

  const applyDragVisuals = useCallback(
    (progress, isActivelyDragging) => {
      pullProgressRef.current = Math.max(0, Math.min(1, progress));
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
      }

      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (isAdvancingRef.current) return;

        const stage = pullCountRef.current;
        const clamped = pullProgressRef.current;
        const eased = 1 - Math.pow(1 - clamped, 1.6);
        const pullY = isActivelyDragging ? Math.round(eased * 56 * 10) / 10 : 0;

        if (footerStageRef.current) {
          footerStageRef.current.style.transition = isActivelyDragging
            ? 'none'
            : 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)';
          footerStageRef.current.style.transform = `translate3d(0, ${-pullY}px, 0)`;
        }

        if (footerDiscRef.current) {
          footerDiscRef.current.style.transition = isActivelyDragging
            ? 'none'
            : 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)';
          footerDiscRef.current.style.transform = isActivelyDragging
            ? `scale(${(1 + eased * 0.08).toFixed(4)}) rotate(${(eased * 22).toFixed(2)}deg)`
            : 'scale(1) rotate(0deg)';
        }

        if (footerGlowRef.current) {
          const baseOpacity = stage >= 1 ? 0.14 : 0.04;
          footerGlowRef.current.style.transition = isActivelyDragging
            ? 'none'
            : 'opacity 420ms ease-out';
          footerGlowRef.current.style.opacity = String(
            isActivelyDragging ? Math.min(0.36, baseOpacity + eased * 0.24) : baseOpacity
          );
        }

        const bar0Pct = stage >= 1 ? 100 : isActivelyDragging ? Math.round(clamped * 100) : 0;
        const bar1Pct =
          stage >= 2 ? 100 : stage === 1 && isActivelyDragging ? Math.round(clamped * 100) : 0;
        const barTransition = isActivelyDragging
          ? 'none'
          : 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)';

        if (bar0Ref.current) {
          bar0Ref.current.style.transition = barTransition;
          bar0Ref.current.style.width = `${bar0Pct}%`;
        }
        if (bar1Ref.current) {
          bar1Ref.current.style.transition = barTransition;
          bar1Ref.current.style.width = `${bar1Pct}%`;
        }

        if (statusLabelRef.current && nextItem) {
          if (stage >= 2) {
            statusLabelRef.current.textContent = `SWITCHING TO ${nextItem.title}...`;
          } else if (stage === 1) {
            statusLabelRef.current.textContent =
              isActivelyDragging && clamped > 0.04
                ? `PULLING 2 / 2 · KEEP DRAGGING (${Math.round(clamped * 100)}%)`
                : `DRAG 1 / 2 ARMED · LONG DRAG AGAIN FOR ${nextItem.title}`;
          } else {
            statusLabelRef.current.textContent =
              isActivelyDragging && clamped > 0.04
                ? `PULLING 1 / 2 · KEEP DRAGGING (${Math.round(clamped * 100)}%)`
                : 'LONG DRAG TWICE AT FOOTER TO SWITCH CARD';
          }
        }
      });
    },
    [nextItem]
  );

  const updatePullCount = useCallback((val) => {
    pullCountRef.current = val;
    setFooterPullCount(val);
  }, []);

  const triggerNextCard = useCallback(() => {
    if (isAdvancingRef.current || !nextItem) return;
    isAdvancingRef.current = true;
    clearTimeout(resetTimerRef.current);
    clearTimeout(advanceTimerRef.current);
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    document.body.style.cursor = '';
    updatePullCount(2);
    playVinylClick();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (bar0Ref.current) bar0Ref.current.style.width = '100%';
    if (bar1Ref.current) bar1Ref.current.style.width = '100%';
    if (statusLabelRef.current) {
      statusLabelRef.current.textContent = `SWITCHING TO ${nextItem.title}...`;
    }
    if (footerGlowRef.current) {
      footerGlowRef.current.style.transition = 'opacity 260ms ease-out';
      footerGlowRef.current.style.opacity = '0.36';
    }
    if (!prefersReducedMotion) {
      if (footerStageRef.current) {
        footerStageRef.current.style.transition =
          'transform 340ms cubic-bezier(0.22, 1, 0.36, 1), opacity 280ms ease-out';
        footerStageRef.current.style.transform = 'translate3d(0, -96px, 0)';
        footerStageRef.current.style.opacity = '0';
      }
      if (pageRootRef.current) {
        pageRootRef.current.style.transition = 'opacity 280ms cubic-bezier(0.22, 1, 0.36, 1)';
        pageRootRef.current.style.opacity = '0';
      }
    }

    advanceTimerRef.current = setTimeout(
      () => {
        onSelectNext(nextItem);
      },
      prefersReducedMotion ? 40 : 300
    );
  }, [nextItem, onSelectNext, updatePullCount]);

  const registerFooterDrag = useCallback(() => {
    if (isAdvancingRef.current) return;
    clearTimeout(resetTimerRef.current);

    const nextCount = pullCountRef.current + 1;
    if (nextCount >= 2) {
      triggerNextCard();
    } else {
      playSeekTick();
      updatePullCount(1);
      applyDragVisuals(0, false);
      resetTimerRef.current = setTimeout(() => {
        updatePullCount(0);
        applyDragVisuals(0, false);
      }, 8000);
    }
  }, [triggerNextCard, updatePullCount, applyDragVisuals]);

  // Reset scroll & visuals on card change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    isAdvancingRef.current = false;
    document.body.style.cursor = '';
    if (pageRootRef.current) {
      pageRootRef.current.style.transition = '';
      pageRootRef.current.style.opacity = '1';
    }
    if (footerStageRef.current) {
      footerStageRef.current.style.opacity = '1';
    }
    updatePullCount(0);
    applyDragVisuals(0, false);
    return () => {
      document.body.style.cursor = '';
      clearTimeout(resetTimerRef.current);
      clearTimeout(advanceTimerRef.current);
      clearTimeout(clearDragTimerRef.current);
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, [item.id, updatePullCount, applyDragVisuals]);

  useEffect(() => {
    const isNearBottom = (tolerance = 60) => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight;
      return scrollY + window.innerHeight >= docHeight - tolerance;
    };

    const getThresholdPx = () =>
      Math.min(115, Math.max(76, window.innerHeight * 0.12));

    const DEADZONE_PX = 10;

    // 1. Mouse long drag state across whole Section 3 (or near page bottom)
    const pointerState = {
      active: false,
      startX: 0,
      startY: 0,
      inFooter: false,
      startedNearBottom: false,
      startTag: '',
      consumed: false,
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || isAdvancingRef.current) return;
      if (e.clientX >= document.documentElement.clientWidth) return;
      const tag = e.target?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CANVAS'].includes(tag)) return;

      const inFooter = Boolean(footerRef.current?.contains(e.target));
      const startedNearBottom = isNearBottom(80);
      if (!inFooter && !(startedNearBottom && e.clientY >= window.innerHeight * 0.45)) {
        return;
      }

      clearTimeout(clearDragTimerRef.current);
      pointerState.active = true;
      pointerState.startX = e.clientX;
      pointerState.startY = e.clientY;
      pointerState.inFooter = inFooter;
      pointerState.startedNearBottom = startedNearBottom;
      pointerState.startTag = tag;
      pointerState.consumed = false;
      didDragRef.current = false;

      if (inFooter) {
        document.body.style.cursor = 'grabbing';
      }
    };

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch' || !pointerState.active) return;
      const dx = e.clientX - pointerState.startX;
      const dy = pointerState.startY - e.clientY;

      if (Math.hypot(dx, dy) > 8) {
        didDragRef.current = true;
        document.body.style.cursor = 'grabbing';
      }

      if (pointerState.consumed || isAdvancingRef.current) return;

      const eligible =
        pointerState.inFooter ||
        (pointerState.startedNearBottom &&
          pointerState.startY >= window.innerHeight * 0.45 &&
          !['CODE', 'PRE'].includes(pointerState.startTag));

      if (eligible && dy > DEADZONE_PX && dy > Math.abs(dx) * 0.85) {
        if (!pointerState.inFooter) {
          window.getSelection?.()?.removeAllRanges?.();
        }
        const threshold = getThresholdPx();
        const progress = Math.min(1, (dy - DEADZONE_PX) / Math.max(1, threshold - DEADZONE_PX));
        applyDragVisuals(progress, true);
        if (dy >= threshold) {
          pointerState.consumed = true;
          document.body.style.cursor = '';
          registerFooterDrag();
        }
      } else if (dy <= DEADZONE_PX) {
        applyDragVisuals(0, false);
      }
    };

    const onPointerEnd = (e) => {
      if (e?.pointerType === 'touch') return;
      if (!pointerState.active) return;
      pointerState.active = false;
      document.body.style.cursor = '';
      if (!pointerState.consumed && !isAdvancingRef.current) {
        applyDragVisuals(0, false);
      }
      clearTimeout(clearDragTimerRef.current);
      clearDragTimerRef.current = setTimeout(() => {
        didDragRef.current = false;
      }, 140);
    };

    // 2. Touch long drag state (mobile / touchscreen)
    const touchState = {
      active: false,
      startX: 0,
      startY: 0,
      pullOriginY: null,
      inFooter: false,
      consumed: false,
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1 || isAdvancingRef.current) return;
      const touch = e.touches[0];
      const tag = e.target?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'CANVAS'].includes(tag)) return;

      const nearBottom = isNearBottom(60);
      touchState.active = true;
      touchState.startX = touch.clientX;
      touchState.startY = touch.clientY;
      touchState.inFooter = Boolean(footerRef.current?.contains(e.target));
      touchState.pullOriginY =
        nearBottom && (touchState.inFooter || touch.clientY >= window.innerHeight * 0.45)
          ? touch.clientY
          : null;
      touchState.consumed = false;
    };

    const onTouchMove = (e) => {
      if (!touchState.active || touchState.consumed || e.touches.length !== 1 || isAdvancingRef.current) return;
      const touch = e.touches[0];

      if (touchState.pullOriginY === null) {
        if (touchState.inFooter && isNearBottom(24)) {
          touchState.pullOriginY = touch.clientY;
        }
        return;
      }

      const dx = touch.clientX - touchState.startX;
      const dy = touchState.pullOriginY - touch.clientY;

      if (dy > DEADZONE_PX && dy > Math.abs(dx) * 0.85) {
        const threshold = getThresholdPx();
        const progress = Math.min(1, (dy - DEADZONE_PX) / Math.max(1, threshold - DEADZONE_PX));
        applyDragVisuals(progress, true);
        if (dy >= threshold) {
          touchState.consumed = true;
          registerFooterDrag();
        }
      } else if (dy <= DEADZONE_PX) {
        applyDragVisuals(0, false);
      }
    };

    const onTouchEnd = () => {
      touchState.active = false;
      touchState.pullOriginY = null;
      if (!touchState.consumed && !isAdvancingRef.current) {
        applyDragVisuals(0, false);
      }
    };

    // 3. Wheel / trackpad overscroll downward at footer
    const WHEEL_THRESHOLD = 160;
    const wheelState = {
      lastTime: 0,
      lastDeltaY: 0,
      startedAtBottom: false,
      accum: 0,
      consumed: false,
      decayTimer: null,
    };

    const onWheel = (e) => {
      if (isAdvancingRef.current || e.deltaY <= 0) return;

      const now = performance.now();
      const gap = now - wheelState.lastTime;
      const isFreshGesture =
        gap > 200 ||
        (wheelState.consumed &&
          e.deltaY >= 32 &&
          e.deltaY > wheelState.lastDeltaY * 2.0 + 8 &&
          wheelState.lastDeltaY <= 18);

      if (isFreshGesture) {
        wheelState.accum = 0;
        wheelState.consumed = false;
        wheelState.startedAtBottom = isNearBottom(24);
      }

      wheelState.lastTime = now;
      wheelState.lastDeltaY = e.deltaY;

      if (!wheelState.startedAtBottom || wheelState.consumed) return;

      wheelState.accum += e.deltaY;
      applyDragVisuals(Math.min(1, wheelState.accum / WHEEL_THRESHOLD), true);

      clearTimeout(wheelState.decayTimer);
      wheelState.decayTimer = setTimeout(() => {
        if (!wheelState.consumed && !isAdvancingRef.current) {
          wheelState.accum = 0;
          applyDragVisuals(0, false);
        }
      }, 280);

      if (wheelState.accum >= WHEEL_THRESHOLD) {
        wheelState.consumed = true;
        wheelState.accum = 0;
        registerFooterDrag();
      }
    };

    // 4. Reset armed count if user scrolls away from the footer
    const onScroll = () => {
      if (pullCountRef.current <= 0 || isAdvancingRef.current) return;
      const footerTop = footerRef.current?.getBoundingClientRect().top ?? Infinity;
      if (footerTop > window.innerHeight * 0.85 && !isNearBottom(320)) {
        clearTimeout(resetTimerRef.current);
        updatePullCount(0);
        applyDragVisuals(0, false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);
    window.addEventListener('blur', onPointerEnd);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('blur', onPointerEnd);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(wheelState.decayTimer);
    };
  }, [registerFooterDrag, updatePullCount, applyDragVisuals]);

  // Step controls
  const handleStepForward = () => {
    if (currentStepIndex < simulationResult.steps.length) {
      playSeekTick();
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      playSeekChime();
    }
  };

  const handleStepReset = () => {
    playVinylClick();
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div
      ref={pageRootRef}
      className={`min-h-screen bg-transparent transition-colors duration-500 select-text ${
        isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
      }`}
    >
      {/* STICKY LUXURY EDITORIAL HEADER */}
      <header
        className={`sticky top-0 z-50 transform-gpu backdrop-blur-md border-b px-6 md:px-12 py-4 flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-[#07070a]/90 border-[#24242e] text-[#f3f1ea]'
            : 'bg-[#f2f2f2]/90 border-[#0d0d11]/15 text-[#0d0d11]'
        }`}
      >
        <button
          onClick={() => {
            playVinylClick();
            onClose();
          }}
          className={`flex items-center space-x-2 text-xs font-mono-tech uppercase tracking-[0.2em] transition-colors ${
            isDark ? 'text-[#8c8b94] hover:text-[#f3f1ea]' : 'text-[#6b6a72] hover:text-[#0d0d11]'
          }`}
        >
          <ArrowLeft size={16} />
          <span>BACK TO CRATE ARCHIVE</span>
        </button>

        <div className="flex items-center space-x-3">
          <span
            className={`text-xs font-mono-tech tracking-[0.25em] hidden sm:inline ${
              isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
            }`}
          >
            ARCHIVE NO. {item.matrixCode}
          </span>

          {/* Theme Switcher in Focal View */}
          {onToggleTheme && (
            <button
              onClick={() => {
                playButtonSnap();
                onToggleTheme();
              }}
              className={`p-2 border transition-[color,background-color,border-color] ${
                isDark
                  ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                  : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={() => {
              const newMute = toggleMute();
              setMuted(newMute);
            }}
            className={`p-2 border transition-[color,background-color,border-color] ${
              isDark
                ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
            }`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Close button */}
          <button
            onClick={() => {
              playButtonSnap();
              onClose();
            }}
            className={`p-2 border transition-[color,background-color,border-color] ${
              isDark
                ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
            }`}
            aria-label="Close Focal View"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* SECTION 1: PRODUCTION HERO (a24.raviklaassens.com / #production_hero) */}
      <section
        className={`animate-focal-enter px-6 md:px-16 lg:px-24 pt-12 pb-16 border-b transition-colors ${
          isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Matrix Tag & Year */}
          <div className="flex items-center space-x-3 mb-3">
            <span
              className={`text-xs font-mono-tech tracking-[0.25em] uppercase ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              {item.category}
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDark ? 'bg-[#f3f1ea]/40' : 'bg-[#0d0d11]/40'
              }`}
            />
            <span
              className={`text-xs font-mono-tech tracking-[0.2em] uppercase ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              FIRST SPECIFICATION // {item.year}
            </span>
          </div>

          {/* Massive Tall Title */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-tall font-bold uppercase tracking-tight leading-none mb-4">
            {item.title}
          </h1>

          <div
            className={`w-full h-[1px] mb-6 ${
              isDark ? 'bg-[#24242e]' : 'bg-[#0d0d11]/15'
            }`}
          />

          {/* Technical Metadata Row */}
          <div
            className={`flex flex-wrap items-center gap-y-3 gap-x-10 text-[22px] font-mono-tech uppercase tracking-wide mb-12 ${
              isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
            }`}
          >
            <div>
              <span className="opacity-70">RUNTIME COMPLEXITY: </span>
              <span className={`font-bold ${isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}`}>
                {item.runtime}
              </span>
            </div>
            <div>
              <span className="opacity-70">ALGORITHM DOMAIN: </span>
              <span className={`font-bold ${isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}`}>
                {item.category}
              </span>
            </div>
            <div>
              <span className="opacity-70">SPECIFICATION YEAR: </span>
              <span className={`font-bold ${isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}`}>
                {item.year}
              </span>
            </div>
          </div>

          {/* TWO-COLUMN SHOWCASE: PHYSICAL CD ON LEFT, EDITORIAL SYNOPSIS ON RIGHT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Spinning Tactile CD */}
            <div
              className={`lg:col-span-5 flex flex-col items-center justify-center p-8 border shadow-2xl relative overflow-hidden group ${
                isDark
                  ? 'bg-[#0c0c12] border-[#24242e]'
                  : 'bg-[#e8e7e1] border-[#0d0d11]/15'
              }`}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-20 blur-3xl"
                style={{
                  background: `radial-gradient(circle, ${item.accentColor || '#891a20'}, transparent 70%)`,
                  transform: 'translateZ(0)',
                  willChange: 'transform, opacity',
                }}
              />
              <A24PhysicalDisc
                item={item}
                isActive={true}
                isSpinning={isSpinning}
                size={290}
                showScribble={false}
                showNumberTag={false}
                theme={theme}
              />
              <div className="mt-8 flex items-center space-x-3 z-10">
                <button
                  onClick={() => setIsSpinning(!isSpinning)}
                  className={`flex items-center space-x-2.5 px-6 py-2.5 border text-xs font-mono-tech uppercase tracking-[0.2em] font-medium transition-[color,background-color,border-color] ${
                    isDark
                      ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea] hover:border-[#f3f1ea]'
                      : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11] hover:border-[#0d0d11]'
                  }`}
                >
                  {isSpinning ? <Pause size={13} className="shrink-0" /> : <Play size={13} className="shrink-0" />}
                  <span>{isSpinning ? 'PAUSE ROTATION' : 'SPIN DISC'}</span>
                </button>
              </div>
            </div>

            {/* Right: Editorial Synopsis & Awards */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div>
                <p
                  className={`text-xs font-mono-tech uppercase tracking-[0.2em] mb-3 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  CRITIC SYNOPSIS & ARCHIVAL ESSAY
                </p>
                <p className={`text-[14px] leading-relaxed mb-6 font-normal ${isDark ? 'text-[#d6d5dc]' : 'text-[#2a2a32]'}`}>
                  "{item.synopsis}"
                </p>
              </div>

              {/* Accolades & Citations */}
              <div
                className={`space-y-2 border-l-2 pl-4 py-2 ${
                  isDark ? 'border-[#f3f1ea]/40' : 'border-[#0d0d11]/40'
                }`}
              >
                <p
                  className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] mb-1 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  HISTORICAL AWARDS & BENCHMARKS
                </p>
                {item.awards.map((award, i) => (
                  <p
                    key={i}
                    className="text-xs font-mono-tech tracking-[0.1em] opacity-90"
                  >
                    {award}
                  </p>
                ))}
              </div>

              {/* Technical Specifications Grid */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 gap-4 border p-5 ${
                  isDark
                    ? 'bg-[#0c0c12] border-[#24242e]'
                    : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                }`}
              >
                {Object.entries(item.specs).map(([key, val]) => (
                  <div key={key}>
                    <p
                      className={`text-[9px] font-mono-tech uppercase tracking-[0.18em] mb-1 ${
                        isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                      }`}
                    >
                      {key.replace(/([A-Z])/g, ' $1')}
                    </p>
                    <p className="text-xs font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE HARDWARE & SIMULATION SUITE */}
      <section
        className={`animate-focal-enter px-6 md:px-16 lg:px-24 py-16 border-b transition-colors ${
          isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Heading & Navigation Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p
                className={`text-xs font-mono-tech uppercase tracking-[0.25em] mb-1 ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                LABORATORY VERIFICATION
              </p>
              <h2 className="text-4xl sm:text-5xl font-tall font-bold uppercase tracking-tight">
                INTERACTIVE TRAJECTORY & HARDWARE ENGINE
              </h2>
            </div>

            {/* Suite Tabs */}
            <div
              className={`flex flex-wrap items-center gap-2 border p-1.5 ${
                isDark ? 'border-[#24242e] bg-[#0c0c12]' : 'border-[#0d0d11]/15 bg-[#e8e7e1]'
              }`}
            >
              {[
                { id: 'simulation', num: '01', label: 'SEEK ENGINE' },
                { id: 'hardware3d', num: '02', label: '3D HARD DRIVE' },
                { id: 'ascii', num: '03', label: 'ASCII BLUEPRINT' },
                { id: 'pipeline', num: '04', label: 'I/O STATE MACHINE' },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      playVinylClick();
                      setActiveTab(tab.id);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-mono-tech uppercase tracking-[0.16em] transition-[color,background-color] ${
                      isSelected
                        ? isDark
                          ? 'bg-[#f3f1ea] text-[#07070a] font-bold shadow'
                          : 'bg-[#0d0d11] text-[#f2f2f2] font-bold shadow'
                        : isDark
                        ? 'text-[#8c8b94] hover:text-[#f3f1ea]'
                        : 'text-[#6b6a72] hover:text-[#0d0d11]'
                    }`}
                  >
                    <span className="opacity-50 text-[10px]">[{tab.num}]</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB CONTENT 1: SEEK SIMULATION & PROOF */}
          {activeTab === 'simulation' && (
            <div className="space-y-8">
              {/* Interactive Inputs Bar */}
              <div
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 border p-6 items-center ${
                  isDark
                    ? 'bg-[#0c0c12] border-[#24242e]'
                    : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                }`}
              >
                <div className="md:col-span-6">
                  <label
                    className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] mb-1 ${
                      isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                    }`}
                  >
                    CYLINDER REQUEST QUEUE [0 - 199]
                  </label>
                  <input
                    type="text"
                    value={queueStr}
                    onChange={(e) => setQueueStr(e.target.value)}
                    className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none ${
                      isDark
                        ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                        : 'bg-[#ffffff] border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                    }`}
                    placeholder="98, 183, 37, 122, 14, 124, 65, 67"
                  />
                </div>

                <div className="md:col-span-3">
                  <label
                    className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] mb-1 ${
                      isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                    }`}
                  >
                    START HEAD CYLINDER
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="199"
                    value={headPos}
                    onChange={(e) => setHeadPos(parseInt(e.target.value, 10) || 0)}
                    className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none ${
                      isDark
                        ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                        : 'bg-[#ffffff] border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                    }`}
                  />
                </div>

                <div className="md:col-span-3">
                  <label
                    className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] mb-1 ${
                      isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                    }`}
                  >
                    HEAD SWEEP DIRECTION
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none ${
                      isDark
                        ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                        : 'bg-[#ffffff] border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                    }`}
                  >
                    <option value="right">Right (Increasing: 0 → 199)</option>
                    <option value="left">Left (Decreasing: 199 → 0)</option>
                  </select>
                </div>
              </div>

              {/* Trajectory Visualizer */}
              <div
                className={`border p-6 ${
                  isDark
                    ? 'bg-[#0c0c12] border-[#24242e]'
                    : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                }`}
              >
                <TrajectoryChart
                  trajectory={simulationResult.trajectory}
                  initialHead={headPos}
                  requests={parsedQueue}
                  currentStepIndex={currentStepIndex}
                />
              </div>

              {/* Step By Step Math Calculation Proof */}
              <div
                className={`border p-6 ${
                  isDark
                    ? 'bg-[#0c0c12] border-[#24242e]'
                    : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                }`}
              >
                <StepCalculationProof
                  algorithm={item.id.toUpperCase()}
                  initialHead={headPos}
                  requests={parsedQueue}
                  steps={simulationResult.steps}
                  totalHeadMovements={simulationResult.totalHeadMovements}
                  currentStepIndex={currentStepIndex}
                  onStepChange={setCurrentStepIndex}
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: 3D HARD DRIVE HARDWARE */}
          {activeTab === 'hardware3d' && (
            <div
              className={`border p-6 ${
                isDark
                  ? 'bg-[#0c0c12] border-[#24242e]'
                  : 'bg-[#e8e7e1] border-[#0d0d11]/15'
              }`}
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={`text-xs font-mono-tech uppercase tracking-[0.2em] ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  ACTIVE TRACK: {currentTrack} // PENDING REQUESTS: {parsedQueue.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleStepForward}
                    className={`px-3 py-1.5 border text-xs font-mono-tech uppercase tracking-[0.16em] transition-[color,background-color,border-color] ${
                      isDark
                        ? 'border-[#24242e] hover:bg-[#f3f1ea] hover:text-[#07070a]'
                        : 'border-[#0d0d11]/20 hover:bg-[#0d0d11] hover:text-[#f2f2f2]'
                    }`}
                  >
                    STEP ARM →
                  </button>
                  <button
                    onClick={handleStepReset}
                    className={`p-1.5 border transition-[color,background-color,border-color] ${
                      isDark
                        ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                        : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
                    }`}
                    title="Reset"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
              <div
                className={`h-[550px] w-full rounded border overflow-hidden ${
                  isDark ? 'border-[#24242e]/60' : 'border-[#0d0d11]/15'
                }`}
              >
                <Drive3DCanvas
                  currentTrack={currentTrack}
                  minTrack={0}
                  maxTrack={199}
                  pendingRequests={parsedQueue}
                  servicedRequests={simulationResult.trajectory.slice(0, currentStepIndex)}
                  direction={direction}
                  isSeeking={isPlaying}
                  stepDescription={`Servicing Track ${currentTrack}`}
                  onTrackClick={(trk) => setHeadPos(trk)}
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT 3: ASCII BOX-DRAWING BLUEPRINT */}
          {activeTab === 'ascii' && (
            <div
              className={`border p-6 ${
                isDark
                  ? 'bg-[#0c0c12] border-[#24242e]'
                  : 'bg-[#e8e7e1] border-[#0d0d11]/15'
              }`}
            >
              <AsciiDiagrams
                theme={theme}
                activeResult={{
                  algorithmName: item.code,
                  totalMovement: simulationResult.totalSeek,
                  averageMovement: (simulationResult.totalSeek / Math.max(1, parsedQueue.length)).toFixed(2),
                  initialHead: headPos,
                  steps: simulationResult.steps,
                }}
                currentTrack={currentTrack}
                minTrack={0}
                maxTrack={199}
                servicedRequests={simulationResult.trajectory.slice(0, currentStepIndex)}
                pendingRequests={parsedQueue}
              />
            </div>
          )}

          {/* TAB CONTENT 4: OS I/O PIPELINE STATE MACHINE */}
          {activeTab === 'pipeline' && (
            <div
              className={`border p-6 ${
                isDark
                  ? 'bg-[#0c0c12] border-[#24242e]'
                  : 'bg-[#e8e7e1] border-[#0d0d11]/15'
              }`}
            >
              <DataFlowStateMachine
                theme={theme}
                activeAlgorithm={item.code}
                activeTrack={currentTrack}
                previousTrack={simulationResult.trajectory[Math.max(0, currentStepIndex - 1)] ?? 53}
                seekDistance={Math.abs(currentTrack - (simulationResult.trajectory[Math.max(0, currentStepIndex - 1)] ?? 53))}
              />
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: "UP NEXT" ENDLESS CRATE NAVIGATION (a24.raviklaassens.com / [data-scroll-next]) */}
      <section
        ref={footerRef}
        onDragStart={(e) => e.preventDefault()}
        className="relative overflow-hidden px-6 md:px-16 lg:px-24 pt-24 pb-28 min-h-[75vh] flex flex-col justify-center select-none cursor-grab active:cursor-grabbing"
      >
        {/* Full-Section Ambient Spotlight That Responds to Drag Tension */}
        <div
          ref={footerGlowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: footerPullCount >= 1 ? 0.14 : 0.04,
            background: `radial-gradient(ellipse 65% 55% at 50% 52%, ${nextItem.accentColor || '#891a20'}, transparent 72%)`,
          }}
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <div
            ref={footerStageRef}
            className="flex flex-col items-center text-center will-change-[transform,opacity]"
          >
            {/* Animated Hint Arrow */}
            <div
              className={`mb-3 animate-scroll-hint ${footerPullCount >= 1 ? '!text-[#891a20] ' : ''}${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              <ChevronDown size={28} />
            </div>

            <p
              className={`text-xs font-mono-tech uppercase tracking-[0.3em] mb-2 transition-colors ${
                footerPullCount >= 1
                  ? 'text-[#891a20] font-bold'
                  : isDark
                  ? 'text-[#8c8b94]'
                  : 'text-[#6b6a72]'
              }`}
            >
              {footerPullCount >= 1
                ? 'UP NEXT IN ARCHIVE · DRAG 1/2 ARMED'
                : 'UP NEXT IN ARCHIVE'}
            </p>

            <button
              onClick={() => {
                if (didDragRef.current) return;
                triggerNextCard();
              }}
              className="group flex flex-col items-center focus:outline-none"
            >
              <h3 className="text-6xl sm:text-8xl font-tall font-bold uppercase tracking-tight group-hover:underline transition-colors">
                {nextItem.title}
              </h3>
              <p
                className={`text-[14px] font-normal transition-colors mt-1 ${
                  isDark
                    ? 'text-[#8c8b94] group-hover:text-[#f3f1ea]'
                    : 'text-[#6b6a72] group-hover:text-[#0d0d11]'
                }`}
              >
                {nextItem.aka}
              </p>

              <div ref={footerDiscRef} className="mt-8 will-change-transform">
                <div className="transform group-hover:scale-105 transition-transform duration-500">
                  <A24PhysicalDisc
                    item={nextItem}
                    isActive={false}
                    isSpinning={false}
                    size={180}
                    showScribble={false}
                    showNumberTag={false}
                    theme={theme}
                  />
                </div>
              </div>

              <span
                className={`mt-8 inline-flex items-center space-x-2.5 px-6 py-3 border text-xs font-mono-tech uppercase tracking-[0.2em] font-medium transition-[color,background-color,border-color] ${
                  isDark
                    ? 'border-[#24242e] bg-[#0c0c12] text-[#8c8b94] group-hover:text-[#f3f1ea] group-hover:border-[#f3f1ea]'
                    : 'border-[#0d0d11]/20 bg-[#f5f4ef] text-[#6b6a72] group-hover:text-[#0d0d11] group-hover:border-[#0d0d11]'
                }`}
              >
                <span>ADVANCE TO DISC {nextItem.num}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {/* Two-Stage Footer Long-Drag Progress Gauge (0/2 -> 1/2 -> Switch) */}
            <div className="mt-7 flex flex-col items-center space-y-2.5">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-20 h-1 overflow-hidden transition-colors ${
                    isDark ? 'bg-[#24242e]' : 'bg-[#0d0d11]/15'
                  }`}
                >
                  <div
                    ref={bar0Ref}
                    className={`h-full ${
                      footerPullCount >= 1
                        ? 'bg-[#891a20]'
                        : isDark
                        ? 'bg-[#f3f1ea]'
                        : 'bg-[#0d0d11]'
                    }`}
                    style={{ width: footerPullCount >= 1 ? '100%' : '0%' }}
                  />
                </div>
                <div
                  className={`w-20 h-1 overflow-hidden transition-colors ${
                    isDark ? 'bg-[#24242e]' : 'bg-[#0d0d11]/15'
                  }`}
                >
                  <div
                    ref={bar1Ref}
                    className={`h-full ${
                      footerPullCount >= 1
                        ? 'bg-[#891a20]'
                        : isDark
                        ? 'bg-[#f3f1ea]'
                        : 'bg-[#0d0d11]'
                    }`}
                    style={{ width: footerPullCount >= 2 ? '100%' : '0%' }}
                  />
                </div>
              </div>
              <span
                ref={statusLabelRef}
                className={`text-[10px] font-mono-tech uppercase tracking-[0.22em] transition-colors ${
                  footerPullCount >= 1
                    ? 'text-[#891a20] font-bold'
                    : isDark
                    ? 'text-[#8c8b94]'
                    : 'text-[#6b6a72]'
                }`}
              >
                {footerPullCount >= 2
                  ? `SWITCHING TO ${nextItem.title}...`
                  : footerPullCount === 1
                  ? `DRAG 1 / 2 ARMED · LONG DRAG AGAIN FOR ${nextItem.title}`
                  : 'LONG DRAG TWICE AT FOOTER TO SWITCH CARD'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
});

export default A24FocalDeepDive;
