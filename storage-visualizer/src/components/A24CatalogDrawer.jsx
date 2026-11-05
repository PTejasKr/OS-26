import React from 'react';
import { X, ArrowRight, Disc } from 'lucide-react';
import { playVinylClick, playButtonSnap } from '../utils/soundEffects';

/**
 * A24CatalogDrawer
 * Full-screen or sliding drawer listing the entire 10-disc catalog with
 * fast jumping, category badges, year, and director metadata.
 */
export default function A24CatalogDrawer({
  isOpen,
  onClose,
  catalog,
  onSelectDisc,
  theme = 'base',
}) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto animate-fade-in p-6 md:p-16 backdrop-blur-xl transition-colors duration-400 ${
        isDark ? 'bg-[#07070a]/95 text-[#f3f1ea]' : 'bg-[#f2f2f2]/95 text-[#0d0d11]'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-6 mb-8 ${
            isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-mono-tech uppercase tracking-[0.25em] ${
                isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
              }`}
            >
              CATALOG INDEX
            </span>
            <h2 className="text-4xl md:text-6xl font-tall font-bold uppercase tracking-tight">
              COMPLETE STORAGE ARCHIVE // 10 EDITIONS
            </h2>
          </div>
          <button
            onClick={() => {
              playButtonSnap();
              onClose();
            }}
            className={`p-3 border transition-all ${
              isDark
                ? 'border-[#24242e] text-[#8c8b94] hover:text-[#f3f1ea] hover:border-[#f3f1ea]'
                : 'border-[#0d0d11]/20 text-[#6b6a72] hover:text-[#0d0d11] hover:border-[#0d0d11]'
            }`}
            aria-label="Close Archive Drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Catalog List */}
        <div
          className={`divide-y ${
            isDark ? 'divide-[#24242e]' : 'divide-[#0d0d11]/15'
          }`}
        >
          {catalog.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                playVinylClick();
                onSelectDisc(index);
                onClose();
              }}
              className={`py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer px-4 transition-all ${
                isDark ? 'hover:bg-[#0c0c12]' : 'hover:bg-[#e4e3dd]'
              }`}
            >
              <div className="flex items-center space-x-6">
                <span
                  className={`text-xs font-mono-tech tracking-[0.2em] transition-colors ${
                    isDark
                      ? 'text-[#8c8b94] group-hover:text-[#f3f1ea]'
                      : 'text-[#6b6a72] group-hover:text-[#0d0d11]'
                  }`}
                >
                  {item.num}
                </span>
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-3xl md:text-4xl font-tall font-bold uppercase tracking-wide group-hover:underline">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[10px] font-mono-tech uppercase tracking-[0.16em] px-2 py-0.5 border ${
                        isDark
                          ? 'border-[#24242e] text-[#8c8b94]'
                          : 'border-[#0d0d11]/20 text-[#6b6a72]'
                      }`}
                    >
                      {item.category}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-editorial italic transition-colors ${
                      isDark
                        ? 'text-[#8c8b94] group-hover:text-[#dedbd2]'
                        : 'text-[#6b6a72] group-hover:text-[#222]'
                    }`}
                  >
                    {item.aka}
                  </p>
                </div>
              </div>

              <div
                className={`flex items-center space-x-8 text-xs font-mono-tech ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                <div className="hidden sm:block text-right">
                  <span className="block text-[9px] uppercase tracking-[0.2em]">
                    COMPLEXITY
                  </span>
                  <span className={isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}>
                    {item.runtime}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] uppercase tracking-[0.2em]">
                    YEAR
                  </span>
                  <span className={isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}>
                    {item.year}
                  </span>
                </div>
                <div className="transform group-hover:translate-x-2 transition-transform">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
