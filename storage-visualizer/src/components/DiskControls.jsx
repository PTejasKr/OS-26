import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  PlusCircle,
  Shuffle,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import BentoCard from './BentoCard';
import { playKeyClick } from '../utils/soundEffects';

export const WORKLOAD_PRESETS = [
  {
    name: 'Textbook Classic (Silberschatz)',
    queue: '98, 183, 37, 122, 14, 124, 65, 67',
    head: 53,
    min: 0,
    max: 199,
    dir: 'right',
  },
  {
    name: 'Balanced Mixed Workload',
    queue: '82, 170, 43, 140, 24, 16, 190',
    head: 50,
    min: 0,
    max: 199,
    dir: 'right',
  },
  {
    name: 'Clustered Locality + Duplicates',
    queue: '30, 35, 35, 40, 180, 185',
    head: 50,
    min: 0,
    max: 199,
    dir: 'left',
  },
  {
    name: 'Extreme Boundary Stress Test',
    queue: '0, 10, 50, 150, 199',
    head: 100,
    min: 0,
    max: 199,
    dir: 'right',
  },
  {
    name: 'Randomized 12-Track Storm',
    queue: '12, 189, 44, 91, 155, 23, 110, 78, 160, 5, 134, 99',
    head: 75,
    min: 0,
    max: 199,
    dir: 'right',
  },
];

export default function DiskControls({
  queueInput,
  setQueueInput,
  headInput,
  setHeadInput,
  minTrackInput,
  setMinTrackInput,
  maxTrackInput,
  setMaxTrackInput,
  directionInput,
  setDirectionInput,
  onApply,
  onInjectRequest,
  errorMessage,
}) {
  const [injectValue, setInjectValue] = useState('');

  const handlePresetChange = (e) => {
    const selected = WORKLOAD_PRESETS.find((p) => p.name === e.target.value);
    if (selected) {
      playKeyClick();
      setQueueInput(selected.queue);
      setHeadInput(selected.head);
      setMinTrackInput(selected.min);
      setMaxTrackInput(selected.max);
      setDirectionInput(selected.dir);
    }
  };

  const handleRandomize = () => {
    playKeyClick();
    const count = 8;
    const min = parseInt(minTrackInput, 10) || 0;
    const max = parseInt(maxTrackInput, 10) || 199;
    const randomTracks = Array.from({ length: count }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    );
    setQueueInput(randomTracks.join(', '));
    setHeadInput(Math.floor(Math.random() * (max - min + 1)) + min);
  };

  const handleInject = (e) => {
    e.preventDefault();
    const val = parseInt(injectValue, 10);
    if (!isNaN(val)) {
      playKeyClick();
      onInjectRequest?.(val);
      setInjectValue('');
    }
  };

  return (
    <BentoCard
      title="WORKLOAD & DRIVE CONFIGURATION"
      subtitle="Parameters & Dynamic Request Injection"
      badge="INPUT MATRIX"
      badgeColor="cyan"
      icon={Sliders}
    >
      <div className="space-y-3 font-mono text-xs">
        {/* Presets Selector */}
        <div>
          <label className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
            Workload Preset:
          </label>
          <select
            onChange={handlePresetChange}
            className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {WORKLOAD_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Request Queue Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 text-[11px] uppercase tracking-wider">
              Request Queue (Cylinders):
            </label>
            <button
              onClick={handleRandomize}
              className="text-[10px] text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3" />
              <span>Randomize</span>
            </button>
          </div>
          <textarea
            rows={2}
            value={queueInput}
            onChange={(e) => setQueueInput(e.target.value)}
            placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
            className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg p-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 resize-none"
          />
        </div>

        {/* Head Position & Direction */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
              Initial Head:
            </label>
            <input
              type="number"
              value={headInput}
              onChange={(e) => setHeadInput(e.target.value)}
              className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-amber-400 font-bold text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
              Arm Direction:
            </label>
            <select
              value={directionInput}
              onChange={(e) => setDirectionInput(e.target.value)}
              className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="right">RIGHT (Increasing ➔)</option>
              <option value="left">LEFT (Decreasing ⬅)</option>
            </select>
          </div>
        </div>

        {/* Min & Max Track Cylinders */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
              Min Track:
            </label>
            <input
              type="number"
              value={minTrackInput}
              onChange={(e) => setMinTrackInput(e.target.value)}
              className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[11px] uppercase tracking-wider block mb-1">
              Max Track:
            </label>
            <input
              type="number"
              value={maxTrackInput}
              onChange={(e) => setMaxTrackInput(e.target.value)}
              className="w-full bg-[#080d16] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-2 rounded bg-red-950/60 border border-red-500/50 text-red-300 flex items-center gap-2 text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Apply Simulation Button */}
        <button
          onClick={() => {
            playKeyClick();
            onApply?.();
          }}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Execute Simulation Matrix</span>
        </button>

        {/* Dynamic Real-time Request Injector */}
        <div className="pt-2 border-t border-cyan-500/10">
          <label className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
            Real-Time Request Injection:
          </label>
          <form onSubmit={handleInject} className="flex gap-1.5">
            <input
              type="number"
              placeholder="Track #"
              value={injectValue}
              onChange={(e) => setInjectValue(e.target.value)}
              className="w-24 bg-[#080d16] border border-amber-500/40 rounded-lg px-2 py-1 text-amber-300 text-xs focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="flex-1 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Queue Track</span>
            </button>
          </form>
        </div>
      </div>
    </BentoCard>
  );
}
