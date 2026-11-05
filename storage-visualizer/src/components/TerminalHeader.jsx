import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Activity,
  FolderTree,
  Database,
  GraduationCap,
  Volume2,
  VolumeX,
  Tv,
  FileDown,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { playKeyClick, setAudioMuted } from '../utils/soundEffects';

export default function TerminalHeader({
  activeTab,
  setActiveTab,
  crtEffect,
  setCrtEffect,
  onReset,
  onExport,
  headPosition,
  bestAlgorithm,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) playKeyClick();
  };

  const navItems = [
    { id: 'scheduler', label: 'Disk Scheduler & 3D Studio', icon: HardDrive },
    { id: 'stateflow', label: 'State Flow Pipeline', icon: Activity, badge: 'FLOW' },
    { id: 'ascii', label: 'ASCII Schematics', icon: Terminal, badge: 'ASCII' },
    { id: 'files', label: 'File Allocation & FAT', icon: FolderTree },
    { id: 'cache', label: 'Free Space & Buffer Cache', icon: Database },
    { id: 'viva', label: 'Viva & Exam Studio', icon: GraduationCap },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-[#060911]/95 backdrop-blur-xl sticky top-0 z-40 font-mono">
      {/* Top Telemetry Strip with Horizontal Padding */}
      <div className="border-b border-slate-800/60 bg-[#04060b]/90">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 xl:px-28 2xl:px-36 py-2 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              CHRONOS STORAGE OS v3.8
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-300">
              HEAD: <strong className="text-amber-400">CYL-{headPosition}</strong>
            </span>
            {bestAlgorithm && (
              <>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <span className="text-slate-300 hidden sm:inline">
                  OPTIMAL: <strong className="text-emerald-400 font-bold">{bestAlgorithm}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-cyan-500/80 tracking-widest hidden md:inline">
              {currentTime}
            </span>
            <span className="text-slate-700 hidden md:inline">|</span>

            {/* Quick HUD controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setCrtEffect(!crtEffect);
                  playKeyClick();
                }}
                title="Toggle CRT Phosphor Scanline Overlay"
                className={`px-2.5 py-1 rounded-md border text-[10.5px] flex items-center gap-1.5 transition-colors ${
                  crtEffect
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Tv className="w-3 h-3" />
                <span>CRT: {crtEffect ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={toggleSound}
                title="Toggle Web Audio Synthesizer"
                className={`p-1.5 rounded-md border transition-colors ${
                  !muted
                    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                {!muted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  onExport?.();
                }}
                title="Export Full Laboratory Report"
                className="px-2.5 py-1 rounded-md border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5 text-[10.5px]"
              >
                <FileDown className="w-3 h-3" />
                <span className="hidden sm:inline">EXPORT</span>
              </button>

              <button
                onClick={() => {
                  playKeyClick();
                  onReset?.();
                }}
                title="Reset Simulation State"
                className="p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar with Matching Horizontal Padding */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 md:px-14 lg:px-20 xl:px-28 2xl:px-36 py-3 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(0,240,255,0.35)]">
            <HardDrive className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-slate-100 tracking-wider flex items-center gap-2">
              <span>STORAGE</span>
              <span className="text-cyan-400">ANALYZER</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                BENTO PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 tracking-wider">
              INTERACTIVE 3D DISK & FILE BENCHMARK
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playKeyClick();
                  setActiveTab(item.id);
                }}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.18)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                      item.badge === 'ASCII'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
