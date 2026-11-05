import React from 'react';
import { Volume2, VolumeX, Sun, Moon } from 'lucide-react';
import { toggleMute, isMuted, playButtonSnap } from '../utils/soundEffects';

/**
 * A24NavBar
 * The sleek editorial top navigation bar mirroring a24.raviklaassens.com:
 * - Geometric logo mark
 * - Studio / Cinema theme switcher
 * - Audio state toggle
 */
export default function A24NavBar({
  activeMatrix = 'OS26-DS-01',
  theme = 'base',
  onToggleTheme,
}) {
  const [muted, setMuted] = React.useState(isMuted());
  const isDark = theme === 'dark';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b px-6 md:px-12 py-3.5 transition-colors duration-400 ${
        isDark
          ? 'bg-[#07070a]/90 border-[#24242e] text-[#f3f1ea]'
          : 'bg-[#f2f2f2]/90 border-[#0d0d11]/15 text-[#0d0d11]'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Identity OS/26 */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl sm:text-3xl font-tall font-black tracking-widest leading-none">
            OS/26
          </span>
        </div>

        {/* Right: Controls & Theme Switcher */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Button (Studio vs Cinema) */}
          <button
            onClick={() => {
              playButtonSnap();
              onToggleTheme();
            }}
            className={`h-9 px-3 border transition-all text-xs font-mono-tech uppercase flex items-center justify-center space-x-1.5 ${
              isDark
                ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea] hover:border-[#8c8b94]'
                : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11] hover:border-[#0d0d11]'
            }`}
            title={`Switch to ${isDark ? 'Studio (Off-White)' : 'Cinema (Dark)'} Mode`}
          >
            {isDark ? <Sun size={14} className="shrink-0" /> : <Moon size={14} className="shrink-0" />}
            <span className="hidden sm:inline text-[10px] tracking-[0.16em]">
              {isDark ? 'STUDIO' : 'CINEMA'}
            </span>
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              const newMute = toggleMute();
              setMuted(newMute);
            }}
            className={`w-9 h-9 border flex items-center justify-center transition-all ${
              isDark
                ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea] hover:border-[#8c8b94]'
                : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11] hover:border-[#0d0d11]'
            }`}
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX size={15} className="shrink-0" /> : <Volume2 size={15} className="shrink-0" />}
          </button>
        </div>
      </div>
    </nav>
  );
}
