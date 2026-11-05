import React, { useState } from 'react';
import {
  Database,
  Binary,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import BentoCard from './BentoCard';
import {
  simulateFreeSpaceManagement,
  simulateContiguousAllocation,
  DEFAULT_FILES,
} from '../algorithms/fileAllocation';
import { simulateCacheReplacement } from '../algorithms/cacheReplacement';
import { playKeyClick, playCacheHitSound, playButtonSnap } from '../utils/soundEffects';

export default function FreeSpaceCacheStudio({ theme }) {
  const isDark =
    theme === 'dark' ||
    (theme === undefined &&
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark');

  // Free space state
  const baseAllocation = simulateContiguousAllocation(DEFAULT_FILES);
  const freeSpaceData = simulateFreeSpaceManagement(baseAllocation.blocks);

  // Buffer Cache State
  const [cacheAlgo, setCacheAlgo] = useState('LRU'); // 'FIFO', 'LRU', 'LFU', 'Clock'
  const [frameCapacity, setFrameCapacity] = useState(4);
  const [requestQueueInput, setRequestQueueInput] = useState('7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2');
  const [stepIndex, setStepIndex] = useState(0);

  const blockRequests = requestQueueInput
    .replace(/,/g, ' ')
    .trim()
    .split(/\s+/)
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n));

  const cacheResult = simulateCacheReplacement(blockRequests, frameCapacity, cacheAlgo);
  const currentStep = cacheResult.steps[stepIndex] || cacheResult.steps[0] || null;

  const handleStepNext = () => {
    if (stepIndex < cacheResult.steps.length - 1) {
      playKeyClick();
      setStepIndex((s) => s + 1);
    }
  };

  const handleStepPrev = () => {
    if (stepIndex > 0) {
      playKeyClick();
      setStepIndex((s) => s - 1);
    }
  };

  const handleStepReset = () => {
    playButtonSnap();
    setStepIndex(0);
  };

  return (
    <div className="space-y-6 select-text transition-colors duration-300">
      {/* 2-Column Bento: Left is Free Space Management, Right is Storage Buffer Cache */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Bento: Free Space Management (Bitmaps & Linked List) */}
        <BentoCard
          title="FREE SPACE MANAGEMENT & BIT VECTORS"
          subtitle="Kernel Block Tracking Architecture"
          badge={`${freeSpaceData.totalFree} / 64 BLOCKS FREE`}
          icon={Binary}
          theme={theme}
        >
          <div className="space-y-5">
            {/* Bitmap Explanation */}
            <div
              className={`p-4 border-l-2 border-[#891a20] space-y-1 transition-colors ${
                isDark ? 'bg-[#891a20]/10 text-[#dedbd2]' : 'bg-[#891a20]/5 text-[#2b2a33]'
              }`}
            >
              <div className="text-[10px] font-mono-tech uppercase font-bold text-[#891a20] flex justify-between">
                <span>Bit Vector (Bitmap) Formula:</span>
                <span>1 = Free | 0 = Allocated</span>
              </div>
              <p className="text-xs font-mono-tech pt-1">
                Block Address = <code>(Word_Index × 32) + Offset_of_First_1_Bit</code>
              </p>
            </div>

            {/* Visual Binary Bit Grid */}
            <div className="space-y-2">
              <div
                className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                Bit Vector Map (64 Blocks):
              </div>
              <div
                className={`grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3.5 border transition-colors ${
                  isDark
                    ? 'bg-[#12121b] border-[#24242e]'
                    : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                {freeSpaceData.bitVector.map((bit, idx) => (
                  <div
                    key={`bit-${idx}`}
                    className={`aspect-square flex items-center justify-center font-bold text-[10px] font-mono-tech border transition-all ${
                      bit === 1
                        ? isDark
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : isDark
                        ? 'bg-[#181824] border-[#24242e] text-[#8c8b94]'
                        : 'bg-[#f0eee6] border-[#0d0d11]/15 text-[#6b6a72]'
                    }`}
                    title={`Block ${idx}: ${bit === 1 ? 'FREE (1)' : 'ALLOCATED (0)'}`}
                  >
                    {bit}
                  </div>
                ))}
              </div>
            </div>

            {/* Hexadecimal Word Representation */}
            <div className="space-y-1.5">
              <div
                className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                Hexadecimal In-Memory Words:
              </div>
              <div className="flex gap-2 flex-wrap">
                {freeSpaceData.hexBytes.map((hex, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 border font-mono-tech font-bold text-xs ${
                      isDark
                        ? 'border-[#24242e] bg-[#14141c] text-[#f3f1ea]'
                        : 'border-[#0d0d11]/15 bg-white text-[#0d0d11]'
                    }`}
                  >
                    Byte[{i}]: {hex}
                  </span>
                ))}
              </div>
            </div>

            {/* Linked Free List */}
            <div
              className={`p-4 border space-y-1.5 transition-colors ${
                isDark
                  ? 'bg-[#14141c] border-[#24242e]'
                  : 'bg-white border-[#0d0d11]/15'
              }`}
            >
              <div className="text-[10px] font-mono-tech uppercase font-bold text-[#891a20]">
                Alternative: Linked Free List (First 8 Pointers):
              </div>
              <div
                className={`text-xs font-mono-tech overflow-x-auto ${
                  isDark ? 'text-[#dedbd2]' : 'text-[#2b2a33]'
                }`}
              >
                Head ➔{' '}
                {freeSpaceData.freeList.slice(0, 8).map((b, i) => (
                  <span key={i} className="font-bold">
                    [Block {b}] ➔{' '}
                  </span>
                ))}
                <span className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}>
                  ... ({freeSpaceData.totalFree} blocks total)
                </span>
              </div>
            </div>
          </div>
        </BentoCard>

        {/* Right Bento: Storage Buffer Cache & Page Replacement */}
        <BentoCard
          title="STORAGE BUFFER CACHE & REPLACEMENT"
          subtitle="DRAM Cache Frame Hit/Miss Simulation"
          badge={`HIT RATE: ${cacheResult.hitRate}%`}
          icon={Database}
          theme={theme}
        >
          <div className="space-y-5">
            {/* Algorithm & Capacity Controls */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold block mb-1 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  Cache Algorithm:
                </label>
                <select
                  value={cacheAlgo}
                  onChange={(e) => {
                    playKeyClick();
                    setCacheAlgo(e.target.value);
                  }}
                  className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                      : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                  }`}
                >
                  <option value="LRU">LRU (Least Recently Used)</option>
                  <option value="FIFO">FIFO (First-In, First-Out)</option>
                  <option value="LFU">LFU (Least Frequently Used)</option>
                  <option value="Clock">Clock / Second-Chance</option>
                </select>
              </div>

              <div>
                <label
                  className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold block mb-1 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  Buffer Frames:
                </label>
                <select
                  value={frameCapacity}
                  onChange={(e) => {
                    playKeyClick();
                    setFrameCapacity(parseInt(e.target.value, 10));
                  }}
                  className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none cursor-pointer ${
                    isDark
                      ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                      : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                  }`}
                >
                  {[3, 4, 5, 6].map((cap) => (
                    <option key={cap} value={cap}>
                      {cap} Memory Frames
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Request Stream Input */}
            <div>
              <label
                className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] font-semibold block mb-1 ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                Block Access Sequence:
              </label>
              <input
                type="text"
                value={requestQueueInput}
                onChange={(e) => setRequestQueueInput(e.target.value)}
                className={`w-full border px-3 py-2 text-xs font-mono-tech outline-none ${
                  isDark
                    ? 'bg-[#14141c] border-[#24242e] text-[#f3f1ea] focus:border-[#f3f1ea]'
                    : 'bg-white border-[#0d0d11]/20 text-[#0d0d11] focus:border-[#0d0d11]'
                }`}
              />
            </div>

            {/* Cache Summary Telemetry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div
                className={`p-3 border ${
                  isDark ? 'bg-[#14141c] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[9px] font-mono-tech uppercase tracking-wider opacity-60">
                  Total Accesses
                </div>
                <div className="font-bold text-base font-tall mt-0.5">{blockRequests.length}</div>
              </div>
              <div
                className={`p-3 border ${
                  isDark ? 'bg-[#14141c] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[9px] font-mono-tech uppercase tracking-wider opacity-60">
                  Cache Hits
                </div>
                <div className="font-bold text-base font-tall text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {cacheResult.hits}
                </div>
              </div>
              <div
                className={`p-3 border ${
                  isDark ? 'bg-[#14141c] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[9px] font-mono-tech uppercase tracking-wider opacity-60">
                  Cache Misses
                </div>
                <div className="font-bold text-base font-tall text-rose-600 dark:text-rose-400 mt-0.5">
                  {cacheResult.misses}
                </div>
              </div>
              <div
                className={`p-3 border ${
                  isDark ? 'bg-[#14141c] border-[#24242e]' : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="text-[9px] font-mono-tech uppercase tracking-wider opacity-60">
                  Disk I/O Saved
                </div>
                <div className="font-bold text-base font-tall mt-0.5">{cacheResult.diskIoAvoided} Seeks</div>
              </div>
            </div>

            {/* Current Step Buffer Frame Inspection */}
            {currentStep && (
              <div
                className={`p-4 border space-y-3 transition-colors ${
                  isDark
                    ? 'bg-[#14141c] border-[#24242e]'
                    : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-mono-tech">
                  <div className="flex items-center space-x-2">
                    <span>
                      ACCESS #{currentStep.stepNumber}:{' '}
                      <strong className="font-bold">Block {currentStep.block}</strong>
                    </span>
                    <span className="opacity-40">|</span>
                    <span className="opacity-60">
                      Step {stepIndex + 1} of {cacheResult.steps.length}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 border text-[10px] font-mono-tech uppercase tracking-wider font-semibold ${
                      currentStep.isHit
                        ? isDark
                          ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : isDark
                        ? 'border-rose-500/50 bg-rose-950/40 text-rose-300'
                        : 'border-rose-600 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {currentStep.isHit ? '⚡ CACHE HIT (0 SEEK)' : 'DISK MISS (FETCH NEEDED)'}
                  </span>
                </div>

                {/* Frames Visualization */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {Array.from({ length: frameCapacity }).map((_, fIdx) => {
                    const frameData = currentStep.framesSnapshot[fIdx];
                    const isFocus = frameData && frameData.block === currentStep.block;

                    return (
                      <div
                        key={`frame-${fIdx}`}
                        className={`p-3 border text-center font-mono-tech transition-all ${
                          isFocus
                            ? isDark
                              ? 'border-[#f3f1ea] bg-[#222230] text-[#f3f1ea] font-bold shadow-sm'
                              : 'border-[#0d0d11] bg-[#e6e4dc] text-[#0d0d11] font-bold shadow-sm'
                            : frameData
                            ? isDark
                              ? 'border-[#24242e] bg-[#101018] text-[#dedbd2]'
                              : 'border-[#0d0d11]/15 bg-white text-[#2b2a33]'
                            : isDark
                            ? 'border-dashed border-[#24242e] text-[#8c8b94]'
                            : 'border-dashed border-[#0d0d11]/20 text-[#6b6a72]'
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider opacity-60">
                          FRAME {fIdx}
                        </div>
                        <div className="font-bold text-sm my-0.5">
                          {frameData ? `Blk ${frameData.block}` : 'EMPTY'}
                        </div>
                        {frameData && cacheAlgo === 'Clock' && (
                          <div className="text-[9px] opacity-70">Ref: {frameData.refBit}</div>
                        )}
                        {frameData && cacheAlgo === 'LFU' && (
                          <div className="text-[9px] opacity-70">Freq: {frameData.freq}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-[#0d0d11]/10 dark:border-[#24242e]">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleStepPrev}
                      disabled={stepIndex === 0}
                      className={`p-1.5 border text-xs font-mono-tech uppercase transition-all disabled:opacity-30 cursor-pointer ${
                        isDark
                          ? 'border-[#24242e] hover:border-[#8c8b94]'
                          : 'border-[#0d0d11]/20 hover:border-[#0d0d11]'
                      }`}
                      title="Previous Step"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={handleStepNext}
                      disabled={stepIndex >= cacheResult.steps.length - 1}
                      className={`p-1.5 border text-xs font-mono-tech uppercase transition-all disabled:opacity-30 cursor-pointer ${
                        isDark
                          ? 'border-[#24242e] hover:border-[#8c8b94]'
                          : 'border-[#0d0d11]/20 hover:border-[#0d0d11]'
                      }`}
                      title="Next Step"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      onClick={handleStepReset}
                      className={`p-1.5 border text-xs font-mono-tech uppercase transition-all cursor-pointer ${
                        isDark
                          ? 'border-[#24242e] hover:border-[#8c8b94]'
                          : 'border-[#0d0d11]/20 hover:border-[#0d0d11]'
                      }`}
                      title="Reset Steps"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>

                  {currentStep.evictedBlock !== null && (
                    <div className="text-[10px] font-mono-tech text-rose-500 font-semibold">
                      Evicted Block {currentStep.evictedBlock} from frame memory.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
