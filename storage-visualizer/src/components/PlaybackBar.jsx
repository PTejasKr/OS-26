import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  FastForward,
} from 'lucide-react';
import { playKeyClick } from '../utils/soundEffects';

export default function PlaybackBar({
  isPlaying,
  onTogglePlay,
  onReset,
  onStepBack,
  onStepForward,
  currentStepIndex,
  totalSteps,
  speed,
  onSpeedChange,
  currentStepData,
}) {
  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="p-3 rounded-xl border border-cyan-500/20 bg-[#090d16]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
      {/* Play / Step Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            playKeyClick();
            onReset();
          }}
          title="Reset to Step 0"
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            playKeyClick();
            onStepBack();
          }}
          disabled={currentStepIndex <= 0}
          title="Step Backward"
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            playKeyClick();
            onTogglePlay();
          }}
          className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
            isPlaying
              ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
              : 'bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>PAUSE</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            playKeyClick();
            onStepForward();
          }}
          disabled={currentStepIndex >= totalSteps}
          title="Step Forward"
          className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 disabled:opacity-40 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Scrubber Timeline Slider */}
      <div className="flex-1 min-w-[200px] flex items-center gap-3">
        <span className="text-[11px] text-slate-400 shrink-0">
          STEP <strong className="text-cyan-400">{currentStepIndex}</strong> / {totalSteps}
        </span>

        <input
          type="range"
          min="0"
          max={totalSteps}
          value={currentStepIndex}
          onChange={(e) => {
            const step = parseInt(e.target.value, 10);
            if (!isNaN(step)) {
              onStepForward(step);
            }
          }}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        <span className="text-[10px] text-cyan-500/80 shrink-0">
          {totalSteps > 0 ? Math.round((currentStepIndex / totalSteps) * 100) : 0}%
        </span>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-1">
        <Gauge className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => {
              playKeyClick();
              onSpeedChange(s);
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              speed === s
                ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-300'
                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Step Description Telemetry */}
      {currentStepData && (
        <div className="w-full pt-1.5 border-t border-cyan-500/10 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="text-amber-400 font-semibold truncate">
            {currentStepData.description}
          </span>
          <span className="text-slate-400 shrink-0 ml-2">
            Cumulative: <strong className="text-cyan-400">{currentStepData.cumulative}</strong> tracks
          </span>
        </div>
      )}
    </div>
  );
}
