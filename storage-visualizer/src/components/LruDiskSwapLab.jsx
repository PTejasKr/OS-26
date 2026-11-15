import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Copy,
  Check,
  Cpu,
  Zap,
  HardDrive,
  Info,
} from 'lucide-react';
import Drive3DCanvas from './Drive3DCanvas';
import {
  simulateLruDiskSwap,
  LRU_EXAMPLES,
  getDiskCylinderForPage,
} from '../algorithms/lruSimulation';
import {
  playSeekTick,
  playCacheHitSound,
  playReadPulse,
  playButtonSnap,
  playKeyClick,
  playSeekChime,
} from '../utils/soundEffects';

export default function LruDiskSwapLab({ theme = 'dark' }) {
  const isDark = theme === 'dark';

  // Lab Configuration State
  const [selectedExampleId, setSelectedExampleId] = useState('silberschatz');
  const [frameCapacity, setFrameCapacity] = useState(3);
  const [customInput, setCustomInput] = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3');
  const [isCustom, setIsCustom] = useState(false);

  // Active Example Object
  const activeExample = useMemo(() => {
    return LRU_EXAMPLES.find((ex) => ex.id === selectedExampleId) || LRU_EXAMPLES[0];
  }, [selectedExampleId]);

  // Parse page request stream
  const pageRequests = useMemo(() => {
    if (isCustom) {
      return customInput
        .replace(/,/g, ' ')
        .trim()
        .split(/\s+/)
        .map((v) => parseInt(v, 10))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 99);
    }
    return activeExample.pages;
  }, [isCustom, customInput, activeExample]);

  // Execute deterministic LRU simulation
  const simulation = useMemo(() => {
    return simulateLruDiskSwap(pageRequests, frameCapacity, 53);
  }, [pageRequests, frameCapacity]);

  // Step Execution State
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x = 1.8s, 2x = 0.9s, 0.5x = 2.8s
  const [copied, setCopied] = useState(false);
  const [viewLayout, setViewLayout] = useState('split'); // 'split', 'drive-only', 'ascii-only'

  const currentStep = simulation.steps[stepIndex] || simulation.steps[0] || null;

  // Sound and feedback when step changes
  const triggerStepEffects = (step) => {
    if (!step) return;
    if (step.isHit) {
      playCacheHitSound();
    } else {
      playSeekTick(1 + (step.seekDistance / 200) * 0.5);
      setTimeout(() => {
        playReadPulse();
      }, 140);
    }
  };

  // Step forward
  const handleStepForward = () => {
    if (stepIndex < simulation.steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      triggerStepEffects(simulation.steps[nextIdx]);
    } else {
      playSeekChime();
      setIsPlaying(false);
    }
  };

  // Step backward
  const handleStepBackward = () => {
    if (stepIndex > 0) {
      playKeyClick();
      setStepIndex((s) => s - 1);
    }
  };

  // Reset
  const handleReset = () => {
    playButtonSnap();
    setIsPlaying(false);
    setStepIndex(0);
  };

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(1800 / playbackSpeed);
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < simulation.steps.length - 1) {
          const next = prev + 1;
          triggerStepEffects(simulation.steps[next]);
          return next;
        } else {
          setIsPlaying(false);
          playSeekChime();
          return prev;
        }
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, simulation.steps]);

  // Reset step index if example or frames change
  const handleSelectExample = (id) => {
    playKeyClick();
    if (id === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSelectedExampleId(id);
      const ex = LRU_EXAMPLES.find((e) => e.id === id);
      if (ex) {
        setFrameCapacity(ex.defaultFrames);
      }
    }
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleFrameCapacityChange = (cap) => {
    playKeyClick();
    setFrameCapacity(cap);
    setStepIndex(0);
    setIsPlaying(false);
  };

  // Derived 3D Drive values
  const activeDiskCylinder = currentStep?.diskHeadAfterStep ?? 53;
  const pendingCylinders = useMemo(() => {
    return pageRequests
      .slice(stepIndex + 1)
      .map((p) => getDiskCylinderForPage(p));
  }, [pageRequests, stepIndex]);

  const servicedCylinders = useMemo(() => {
    return pageRequests
      .slice(0, stepIndex + 1)
      .map((p) => getDiskCylinderForPage(p));
  }, [pageRequests, stepIndex]);

  // Generate ASCII Monospace Blueprint for the current step
  const asciiContent = useMemo(() => {
    if (!currentStep) return 'Initializing LRU Hardware Simulation...';

    let out = `================================================================================\n`;
    out += `       OS/26 // LRU MEMORY & 3D HARD DISK SWAP ARCHITECTURAL BLUEPRINT\n`;
    out += `================================================================================\n\n`;

    // 1. Current Access Status Banner
    out += `[ STEP ${String(currentStep.stepNumber).padStart(2, '0')} / ${String(simulation.totalRequests).padStart(2, '0')} ]  CPU REQUEST: VIRTUAL PAGE ${currentStep.page}\n`;
    if (currentStep.isHit) {
      out += `STATUS: ⚡ [PAGE CACHE HIT] resident in RAM Frame ${currentStep.framesSnapshot.findIndex(f => f.isTarget)}.\n`;
      out += `RESULT: Zero-copy DMA transfer from DRAM. Mechanical 3D Hard Disk remains IDLE (0 Seek).\n`;
    } else if (currentStep.evictedPage !== null) {
      out += `STATUS: ⚠️ [PAGE FAULT & EVICTION] All ${frameCapacity} RAM frames occupied.\n`;
      out += `VICTIM: Page ${currentStep.evictedPage} (Untouched longest, at bottom of LRU stack).\n`;
      out += `SWAP ACTION: Write Page ${currentStep.evictedPage} ➔ Disk Track ${currentStep.victimSwapCylinder} | Read Page ${currentStep.page} ➔ Disk Track ${currentStep.targetCylinder}.\n`;
    } else {
      out += `STATUS: ⚠️ [PAGE FAULT (COLD MISS)] Page ${currentStep.page} not in memory.\n`;
      out += `SWAP ACTION: Empty RAM frame available. 3D Hard Drive arm reads Page ${currentStep.page} from Track ${currentStep.targetCylinder}.\n`;
    }
    out += `\n`;

    // 2. Primary Memory RAM Frame Table
    out += `+------------------------------------------------------------------------------+\n`;
    out += `| PRIMARY MEMORY // DRAM PAGE BUFFER FRAMES (CAPACITY: ${frameCapacity} FRAMES)                |\n`;
    out += `+-------+-----------+----------------+----------+------------------------------+\n`;
    out += `| FRAME | RESIDENT  | DISK CYLINDER  | AGE/STEP | HARDWARE MMU STATUS          |\n`;
    out += `+-------+-----------+----------------+----------+------------------------------+\n`;

    currentStep.framesSnapshot.forEach((f) => {
      const fLabel = `  F${f.frameIndex}  `;
      const pLabel = f.page !== null ? `PAGE ${f.page}`.padEnd(9) : 'EMPTY    ';
      const cLabel = f.cylinder !== null ? `CYL ${String(f.cylinder).padStart(3, '0')}`.padEnd(14) : 'N/A           ';
      const aLabel = f.lastAccessedStep !== -1 ? `Step ${String(f.lastAccessedStep).padStart(2, '0')}`.padEnd(8) : 'N/A     ';

      let status = 'RESIDENT';
      if (f.isTarget && currentStep.isHit) status = '⚡ CACHE HIT (0 SEEK)';
      else if (f.isTarget && currentStep.evictedPage !== null) status = `LOADED (Replaced Page ${currentStep.evictedPage})`;
      else if (f.isTarget) status = 'LOADED FROM DISK';
      else if (f.isLru) status = 'NEXT VICTIM CANDIDATE';
      else if (f.isMru) status = 'MOST RECENTLY USED (MRU)';

      out += `|${fLabel}| ${pLabel} | ${cLabel} | ${aLabel} | ${status.padEnd(28)} |\n`;
    });
    out += `+-------+-----------+----------------+----------+------------------------------+\n\n`;

    // 3. LRU Temporal Locality Stack (DLL Representation)
    out += `+------------------------------------------------------------------------------+\n`;
    out += `| TEMPORAL LOCALITY STACK // HASH MAP + DOUBLY LINKED LIST [O(1) EVICTION]     |\n`;
    out += `+------------------------------------------------------------------------------+\n`;
    if (currentStep.lruStackSnapshot.length === 0) {
      out += `| [EMPTY STACK] No pages resident in memory yet.\n`;
    } else {
      const stackChain = currentStep.lruStackSnapshot
        .map((p, idx) => {
          if (idx === 0) return `[MRU: Pg ${p}]`;
          if (idx === currentStep.lruStackSnapshot.length - 1) return `[LRU/VICTIM: Pg ${p}]`;
          return `(Pg ${p})`;
        })
        .join(' <==> ');
      out += `| HEAD ${stackChain} TAIL\n`;
      out += `| * Explanation: On every hit or load, node is detached and spliced to HEAD.\n`;
      out += `|   When memory fills up, the tail node is evicted in O(1) time without scanning.\n`;
    }
    out += `+------------------------------------------------------------------------------+\n\n`;

    // 4. Secondary Memory 3D Hard Disk Status
    out += `+------------------------------------------------------------------------------+\n`;
    out += `| SECONDARY STORAGE // 3D HARD DISK PLATTER (SWAP & BACKING STORE)             |\n`;
    out += `+------------------------------------------------------------------------------+\n`;
    out += `| 3D Arm Position: Cylinder ${String(currentStep.diskHeadAfterStep).padStart(3, '0')} | Physical Seek Delta: ${String(currentStep.seekDistance).padStart(3, '0')} Tracks\n`;
    out += `| Cumulative Seek: ${String(currentStep.cumulativeSeekDistance).padStart(4, '0')} Tracks | Physical Disk Seeks Avoided by DRAM: ${currentStep.cumulativeHits}\n`;
    out += `| Latency Comparison: DRAM Hit = 0.001 ms | Physical Mechanical Seek = ~${(currentStep.seekDistance > 0 ? 3.0 + 0.4 * Math.sqrt(currentStep.seekDistance) : 0).toFixed(2)} ms\n`;
    out += `+------------------------------------------------------------------------------+\n\n`;

    // 5. Execution History Log
    out += `STEP-BY-STEP LRU MEMORY & DISK TRACE TABLE:\n`;
    out += `Step | Page | Outcome   | Frame Layout [F0..F${frameCapacity - 1}] | 3D Hard Disk Mechanical Seek Action\n`;
    out += `-----+------+-----------+-------------------------+------------------------------------------\n`;
    simulation.steps.slice(0, stepIndex + 1).forEach((s) => {
      const stNum = `S${String(s.stepNumber).padStart(2, '0')}`;
      const pgStr = `Pg ${s.page}`.padEnd(5);
      const outStr = s.isHit ? '⚡ HIT     ' : s.evictedPage !== null ? '⚠️ EVICTION' : '⚠️ COLD_MISS';
      const frameStr = `[${s.framesSnapshot.map((f) => (f.page !== null ? f.page : '-')).join(', ')}]`.padEnd(23);

      let diskStr = `Seek ${s.seekDistance} trk ➔ Cyl ${s.targetCylinder}`;
      if (s.isHit) diskStr = `⚡ 0 SEEK (DRAM HIT)`;
      else if (s.evictedPage !== null) diskStr = `Evict ${s.evictedPage} (Cyl ${s.victimSwapCylinder}) ➔ Read ${s.page} (Cyl ${s.targetCylinder})`;

      out += `${stNum}  | ${pgStr} | ${outStr} | ${frameStr} | ${diskStr}\n`;
    });

    return out;
  }, [currentStep, simulation, frameCapacity, stepIndex]);

  // Copy to clipboard
  const handleCopyAscii = () => {
    playKeyClick();
    navigator.clipboard.writeText(asciiContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CURATED PRESETS & WORKBENCH CONTROLS */}
      <div
        className={`border p-6 transition-colors ${
          isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-[#e8e7e1] border-[#0d0d11]/15'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#0d0d11]/10 dark:border-[#24242e]">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono-tech uppercase tracking-[0.2em] text-[#891a20] font-bold">
              <Cpu size={14} />
              <span>ACADEMIC BENCHMARK EXAMPLES & FRAME CONFIGURATION</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-tall font-bold uppercase tracking-tight mt-1">
              LRU PAGE CACHE & 3D HARD DISK SWAP WORKBENCH
            </h3>
          </div>

          {/* View Layout Toggle */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <span
              className={`text-[10px] font-mono-tech uppercase tracking-wider mr-1 hidden sm:inline ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              LAYOUT:
            </span>
            {[
              { id: 'split', label: 'SPLIT DUAL VIEW' },
              { id: 'drive-only', label: '3D HARD DRIVE' },
              { id: 'ascii-only', label: 'ASCII TERMINAL' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  playKeyClick();
                  setViewLayout(v.id);
                }}
                className={`px-2.5 py-1 text-[10px] font-mono-tech uppercase tracking-wider border transition-all ${
                  viewLayout === v.id
                    ? isDark
                      ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] font-bold shadow'
                      : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] font-bold shadow'
                    : isDark
                    ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Selection & Frame Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 items-center">
          <div className="md:col-span-8 space-y-2">
            <label
              className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              SELECT OPERATING SYSTEM BENCHMARK EXAMPLE:
            </label>
            <div className="flex flex-wrap gap-2">
              {LRU_EXAMPLES.map((ex) => {
                const isSelected = !isCustom && selectedExampleId === ex.id;
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelectExample(ex.id)}
                    className={`px-3 py-1.5 text-xs font-mono-tech tracking-wider border transition-all text-left flex items-center gap-1.5 ${
                      isSelected
                        ? isDark
                          ? 'border-[#f3f1ea] bg-[#1a1a26] text-[#f3f1ea] font-bold shadow-sm'
                          : 'border-[#0d0d11] bg-[#dedcd2] text-[#0d0d11] font-bold shadow-sm'
                        : isDark
                        ? 'border-[#24242e] bg-[#101018] text-[#8c8b94] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
                        : 'border-[#0d0d11]/15 bg-white text-[#6b6a72] hover:border-[#0d0d11]/40 hover:text-[#0d0d11]'
                    }`}
                  >
                    <span>{ex.title.split(' ')[0]}</span>
                    <span className="opacity-50 text-[10px]">[{ex.pages.slice(0, 4).join(',')}...]</span>
                  </button>
                );
              })}
              <button
                onClick={() => handleSelectExample('custom')}
                className={`px-3 py-1.5 text-xs font-mono-tech tracking-wider border transition-all ${
                  isCustom
                    ? isDark
                      ? 'border-[#f3f1ea] bg-[#1a1a26] text-[#f3f1ea] font-bold'
                      : 'border-[#0d0d11] bg-[#dedcd2] text-[#0d0d11] font-bold'
                    : isDark
                    ? 'border-[#24242e] bg-[#101018] text-[#8c8b94] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'border-[#0d0d11]/15 bg-white text-[#6b6a72] hover:border-[#0d0d11]/40 hover:text-[#0d0d11]'
                }`}
              >
                + CUSTOM STRING
              </button>
            </div>

            {/* Custom Input Field */}
            {isCustom && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    setStepIndex(0);
                  }}
                  className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none ${
                    isDark
                      ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                      : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                  }`}
                  placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4, 2, 3"
                />
              </div>
            )}
          </div>

          {/* Frame Capacity Selector */}
          <div className="md:col-span-4 space-y-2">
            <label
              className={`block text-[10px] font-mono-tech uppercase tracking-[0.2em] ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              PRIMARY MEMORY (RAM FRAMES):
            </label>
            <div className="flex gap-2">
              {[3, 4, 5].map((cap) => (
                <button
                  key={cap}
                  onClick={() => handleFrameCapacityChange(cap)}
                  className={`flex-1 py-1.5 text-xs font-mono-tech font-bold border transition-all text-center ${
                    frameCapacity === cap
                      ? isDark
                        ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] shadow'
                        : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] shadow'
                      : isDark
                      ? 'border-[#24242e] bg-[#101018] text-[#8c8b94] hover:text-[#f3f1ea]'
                      : 'border-[#0d0d11]/15 bg-white text-[#6b6a72] hover:text-[#0d0d11]'
                  }`}
                >
                  {cap} FRAMES
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Example Description Banner */}
        {!isCustom && activeExample && (
          <div
            className={`mt-4 p-3 border-l-2 border-[#891a20] text-xs font-mono-tech flex items-start space-x-2 ${
              isDark ? 'bg-[#891a20]/10 text-[#dedbd2]' : 'bg-[#891a20]/5 text-[#2b2a33]'
            }`}
          >
            <Info size={15} className="shrink-0 mt-0.5 text-[#891a20]" />
            <div>
              <span className="font-bold text-[#891a20] uppercase">{activeExample.title}: </span>
              <span>{activeExample.description}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. REAL-TIME INTERACTIVE STEP CONTROLS & DYNAMIC STATUS */}
      <div
        className={`border p-4 transition-colors ${
          isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-[#e8e7e1] border-[#0d0d11]/15'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Step Navigation Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={handleStepBackward}
              disabled={stepIndex === 0}
              className={`px-3 py-1.5 border text-xs font-mono-tech uppercase tracking-wider flex items-center space-x-1.5 transition-all disabled:opacity-30 ${
                isDark
                  ? 'border-[#24242e] text-[#f3f1ea] hover:bg-[#1a1a26]'
                  : 'border-[#0d0d11]/20 text-[#0d0d11] hover:bg-[#dedcd2]'
              }`}
            >
              <ChevronLeft size={14} />
              <span>PREV</span>
            </button>

            <button
              onClick={handleStepForward}
              disabled={stepIndex >= simulation.steps.length - 1}
              className={`px-4 py-1.5 border text-xs font-mono-tech uppercase tracking-wider font-bold flex items-center space-x-2 transition-all shadow-sm ${
                isDark
                  ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] hover:bg-white'
                  : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black'
              }`}
            >
              <span>STEP EXECUTION</span>
              <ChevronRight size={14} />
            </button>

            <button
              onClick={() => {
                playButtonSnap();
                setIsPlaying(!isPlaying);
              }}
              className={`px-3 py-1.5 border text-xs font-mono-tech uppercase tracking-wider flex items-center space-x-1.5 transition-all ${
                isPlaying
                  ? 'bg-[#891a20] text-white border-[#891a20]'
                  : isDark
                  ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                  : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
              }`}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'PAUSE' : 'AUTO RUN'}</span>
            </button>

            {/* Speed toggle */}
            <div className="flex items-center border border-[#0d0d11]/15 dark:border-[#24242e]">
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    playKeyClick();
                    setPlaybackSpeed(spd);
                  }}
                  className={`px-2 py-1 text-[10px] font-mono-tech font-bold transition-colors ${
                    playbackSpeed === spd
                      ? isDark
                        ? 'bg-[#f3f1ea] text-[#07070a]'
                        : 'bg-[#0d0d11] text-[#f2f2f2]'
                      : isDark
                      ? 'text-[#8c8b94] hover:text-[#f3f1ea]'
                      : 'text-[#6b6a72] hover:text-[#0d0d11]'
                  }`}
                >
                  {spd}X
                </button>
              ))}
            </div>

            <button
              onClick={handleReset}
              className={`p-1.5 border transition-all ${
                isDark
                  ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea]'
                  : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11]'
              }`}
              title="Reset to Step 1"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Current Step Counter & Outcome Badge */}
          <div className="flex items-center space-x-3">
            <span
              className={`text-xs font-mono-tech uppercase tracking-wider ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              STEP <strong className="font-bold text-base text-[#891a20]">{stepIndex + 1}</strong> OF{' '}
              {simulation.steps.length}
            </span>

            {currentStep && (
              <span
                className={`px-3 py-1 border text-xs font-mono-tech uppercase tracking-wider font-bold flex items-center gap-1.5 ${
                  currentStep.isHit
                    ? isDark
                      ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                      : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : currentStep.evictedPage !== null
                    ? isDark
                      ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                      : 'border-rose-600 bg-rose-50 text-rose-800'
                    : isDark
                    ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                    : 'border-amber-600 bg-amber-50 text-amber-800'
                }`}
              >
                {currentStep.isHit && <Zap size={13} />}
                {currentStep.isHit
                  ? '⚡ DRAM CACHE HIT (0 SEEK)'
                  : currentStep.evictedPage !== null
                  ? `PAGE FAULT & EVICTION (VICTIM: PG ${currentStep.evictedPage})`
                  : 'PAGE FAULT (COLD MISS)'}
              </span>
            )}
          </div>
        </div>

        {/* Live Step Explanation Banner */}
        {currentStep && (
          <div
            className={`mt-3 p-3 border text-xs font-mono-tech transition-colors ${
              isDark
                ? 'bg-[#14141e] border-[#24242e] text-[#f3f1ea]'
                : 'bg-white border-[#0d0d11]/15 text-[#0d0d11]'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#891a20]">EXECUTION NOTE:</span>
              <span>{currentStep.explanation}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. DUAL-PANE WORKBENCH (3D HARD DRIVE ON LEFT + LIVE ASCII ON RIGHT) */}
      <div
        className={`grid gap-6 ${
          viewLayout === 'split'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* LEFT PANE: 3D MECHANICAL HARD DRIVE (SECONDARY STORAGE / SWAP SPACE) */}
        {(viewLayout === 'split' || viewLayout === 'drive-only') && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-6' : 'col-span-1'
            } border flex flex-col relative transition-colors ${
              isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-[#e8e7e1] border-[#0d0d11]/15'
            }`}
          >
            {/* Header info */}
            <div className="p-4 border-b border-[#0d0d11]/10 dark:border-[#24242e] flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <HardDrive size={15} className="text-[#891a20]" />
                <span className="text-xs font-mono-tech uppercase font-bold tracking-wider">
                  SECONDARY STORAGE: 3D MECHANICAL ACTUATOR
                </span>
              </div>
              <span
                className={`text-[10px] font-mono-tech uppercase tracking-wider ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                SWAP TARGET: CYL {currentStep?.targetCylinder ?? 53}
              </span>
            </div>

            {/* 3D Drive Canvas Component */}
            <div className="w-full h-[520px] relative overflow-hidden">
              <Drive3DCanvas
                currentTrack={activeDiskCylinder}
                minTrack={0}
                maxTrack={199}
                pendingRequests={pendingCylinders}
                servicedRequests={servicedCylinders}
                direction="right"
                isSeeking={isPlaying}
                stepDescription={currentStep?.explanation || 'Disk Active'}
                theme={theme}
              />

              {/* Physical Overlay HUD */}
              <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex justify-between items-end">
                <div className="bg-[#07090e]/90 backdrop-blur-md border border-[#24242e] p-2.5 text-xs font-mono-tech text-[#f3f1ea] space-y-1">
                  <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider">
                    PHYSICAL ARM POSITION
                  </div>
                  <div className="font-bold text-sm text-[#00f0ff]">
                    CYLINDER {activeDiskCylinder}
                  </div>
                  <div className="text-[10px] opacity-75">
                    {currentStep?.isHit
                      ? 'Status: IDLE (Page resident in RAM)'
                      : currentStep?.evictedPage !== null
                      ? `Status: Swap Write (${currentStep.victimSwapCylinder}) ➔ Read (${currentStep.targetCylinder})`
                      : `Status: Read Page ${currentStep?.page} into RAM`}
                  </div>
                </div>

                <div className="bg-[#07090e]/90 backdrop-blur-md border border-[#24242e] p-2.5 text-xs font-mono-tech text-[#f3f1ea] text-right space-y-1">
                  <div className="text-[10px] text-[#8c8b94] uppercase tracking-wider">
                    MECHANICAL SEEK LATENCY
                  </div>
                  <div className="font-bold text-sm text-[#f59e0b]">
                    {currentStep?.isHit ? '0.00 ms (0 Seek)' : `~${(3.0 + 0.4 * Math.sqrt(currentStep?.seekDistance || 0)).toFixed(2)} ms`}
                  </div>
                  <div className="text-[10px] opacity-75">
                    {currentStep?.isHit ? '⚡ 100% RAM Speed' : `Delta: ${currentStep?.seekDistance || 0} Tracks`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PANE: LIVE ASCII BLUEPRINT (PRIMARY MEMORY & SWAP TERMINAL) */}
        {(viewLayout === 'split' || viewLayout === 'ascii-only') && (
          <div
            className={`${
              viewLayout === 'split' ? 'lg:col-span-6' : 'col-span-1'
            } border flex flex-col transition-colors ${
              isDark ? 'bg-[#08090d] border-[#24242e]' : 'bg-[#f4f2eb] border-[#0d0d11]/15'
            }`}
          >
            {/* Terminal Header Bar */}
            <div className="p-3 border-b border-[#0d0d11]/10 dark:border-[#24242e] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal size={14} className="text-[#891a20]" />
                <span className="text-xs font-mono-tech uppercase font-bold tracking-wider">
                  LIVE ASCII ARCHITECTURE TERMINAL
                </span>
              </div>
              <button
                onClick={handleCopyAscii}
                className={`px-2.5 py-1 text-[10px] font-mono-tech uppercase tracking-wider border flex items-center space-x-1.5 transition-colors ${
                  isDark
                    ? 'border-[#24242e] bg-[#12121b] text-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'border-[#0d0d11]/20 bg-white text-[#6b6a72] hover:text-[#0d0d11]'
                }`}
                title="Copy ASCII Diagram to Clipboard"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copied ? 'COPIED!' : 'COPY ASCII'}</span>
              </button>
            </div>

            {/* Scrollable ASCII Monospace Viewport */}
            <div className="p-4 flex-1 h-[520px] overflow-auto font-mono text-[11px] sm:text-xs leading-relaxed select-text whitespace-pre">
              <pre
                className={`${
                  isDark ? 'text-[#00f0ff]' : 'text-[#0d0d11]'
                } font-mono`}
              >
                {asciiContent}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* 4. SUMMARY TELEMETRY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            TOTAL ACCESSES
          </div>
          <div className="font-bold text-xl font-tall mt-0.5">{simulation.totalRequests}</div>
        </div>

        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            DRAM CACHE HITS
          </div>
          <div className="font-bold text-xl font-tall text-emerald-600 dark:text-emerald-400 mt-0.5">
            {simulation.hits}
          </div>
        </div>

        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            PAGE FAULTS (MISSES)
          </div>
          <div className="font-bold text-xl font-tall text-rose-600 dark:text-rose-400 mt-0.5">
            {simulation.misses}
          </div>
        </div>

        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            VICTIMS EVICTED
          </div>
          <div className="font-bold text-xl font-tall text-[#f59e0b] mt-0.5">
            {simulation.evictions}
          </div>
        </div>

        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            HIT RATIO
          </div>
          <div className="font-bold text-xl font-tall text-[#891a20] mt-0.5">
            {simulation.hitRate}%
          </div>
        </div>

        <div
          className={`p-3.5 border transition-colors ${
            isDark ? 'bg-[#0c0c12] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
          }`}
        >
          <div className="text-[10px] font-mono-tech uppercase tracking-wider opacity-60">
            DISK SELECTION SAVINGS
          </div>
          <div className="font-bold text-xl font-tall mt-0.5">
            {simulation.seeksAvoidedByCache} Seeks (~{simulation.timeSavedMs}ms)
          </div>
        </div>
      </div>
    </div>
  );
}
