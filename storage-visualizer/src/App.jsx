import React, { useState, useEffect, useMemo } from 'react';
import A24NavBar from './components/A24NavBar';
import A24CrateGallery from './components/A24CrateGallery';
import A24FocalDeepDive from './components/A24FocalDeepDive';
import FileAllocationStudio from './components/FileAllocationStudio';
import FreeSpaceCacheStudio from './components/FreeSpaceCacheStudio';
import AsciiDiagrams from './components/AsciiDiagrams';
import PerformanceComparison from './components/PerformanceComparison';
import HalftoneWordmarkFooter from './components/HalftoneWordmarkFooter';
import { A24_CATALOG } from './data/a24StorageCatalog';
import { runAllAlgorithms } from './algorithms/diskScheduling';
import { ArrowRight } from 'lucide-react';
import { playVinylClick, playButtonSnap } from './utils/soundEffects';

export default function App() {
  const [theme, setTheme] = useState('base'); // 'base' (studio off-white matching a24.raviklaassens.com) or 'dark' (cinema noir)
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeDiscIndex, setActiveDiscIndex] = useState(0);
  const [focalItem, setFocalItem] = useState(null); // When non-null, focal deep-dive view is active
  const [activeStudioTab, setActiveStudioTab] = useState('none'); // 'none', 'allocation', 'cache', 'ascii'

  const isDark = theme === 'dark';

  // Synchronize data-theme on html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Filter catalog based on active category
  const filteredCatalog = useMemo(() => {
    if (selectedCategory === 'ALL') return A24_CATALOG;
    return A24_CATALOG.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const activeDisc = filteredCatalog[activeDiscIndex] || filteredCatalog[0] || A24_CATALOG[0];

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'base' ? 'dark' : 'base'));
  };

  return (
    <div
      className={`min-h-screen relative font-sans transition-colors duration-500 ${
        isDark
          ? 'bg-[#07070a] text-[#f3f1ea] selection:bg-[#f3f1ea] selection:text-[#07070a]'
          : 'bg-[#f2f2f2] text-[#0d0d11] selection:bg-[#0d0d11] selection:text-[#f2f2f2]'
      }`}
    >
      {/* AUTHENTIC A24 INDIE CINEMA FILM GRAIN OVERLAY */}
      <div className="film-grain" />

      {/* TOP EDITORIAL NAVIGATION BAR */}
      <A24NavBar
        activeMatrix={activeDisc.matrixCode}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* CONDITIONAL RENDER: FOCAL DEEP-DIVE TAKEOVER OR HORIZONTAL RECORD CRATE */}
      {focalItem ? (
        <A24FocalDeepDive
          item={focalItem}
          catalog={A24_CATALOG}
          onClose={() => setFocalItem(null)}
          onSelectNext={(next) => setFocalItem(next)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        <main className="transition-opacity duration-500">
          {/* THE PHYSICAL RECORD CRATE HERO STAGE */}
          <A24CrateGallery
            catalog={filteredCatalog}
            activeIndex={activeDiscIndex}
            onSelectIndex={setActiveDiscIndex}
            onOpenFocalView={(item) => setFocalItem(item)}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveDiscIndex(0);
            }}
            theme={theme}
          />

          {/* EDITORIAL CATALOG ROSTER // ARCHIVAL FILMOGRAPHY */}
          <section
            className={`px-6 md:px-16 lg:px-24 py-20 border-t transition-colors duration-500 ${
              isDark
                ? 'border-[#24242e] bg-[#09090e]'
                : 'border-[#0d0d11]/15 bg-[#eae9e3]'
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                  <span
                    className={`text-xs font-mono-tech uppercase tracking-[0.25em] block mb-2 ${
                      isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                    }`}
                  >
                    ARCHIVAL CATALOGUE RAISONNÉ
                  </span>
                  <h2 className="text-5xl md:text-7xl font-tall font-bold uppercase tracking-tight">
                    COMPLETE ALGORITHMIC DISCOGRAPHY
                  </h2>
                </div>
                <p
                  className={`text-[14px] font-normal max-w-md leading-relaxed ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  Every storage access strategy preserved in chronological order. Click any entry to inspect its mechanical arm trajectory, mathematical calculation proof, and physical disc imprint.
                </p>
              </div>

              {/* Editorial Roster Table */}
              <div
                className={`border divide-y transition-colors ${
                  isDark
                    ? 'border-[#24242e] divide-[#24242e] bg-[#0c0c12]'
                    : 'border-[#0d0d11]/15 divide-[#0d0d11]/15 bg-[#f5f4ef]'
                }`}
              >
                {A24_CATALOG.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        playVinylClick();
                        setFocalItem(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group transition-all cursor-pointer ${
                        isDark ? 'hover:bg-[#14141c]' : 'hover:bg-[#e4e2d9]'
                      }`}
                    >
                      <div className="flex items-center space-x-6">
                        <span
                          className={`text-sm font-mono-tech tracking-[0.2em] transition-colors ${
                            isDark
                              ? 'text-[#8c8b94] group-hover:text-[#f3f1ea]'
                              : 'text-[#6b6a72] group-hover:text-[#0d0d11]'
                          }`}
                        >
                          {item.num}
                        </span>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-3xl md:text-4xl font-tall font-bold uppercase group-hover:underline">
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
                            className={`text-[14px] font-normal transition-colors mt-0.5 ${
                              isDark
                                ? 'text-[#8c8b94] group-hover:text-[#f3f1ea]'
                                : 'text-[#6b6a72] group-hover:text-[#0d0d11]'
                            }`}
                          >
                            {item.aka}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex flex-wrap items-center gap-6 md:gap-12 text-xs font-mono-tech ${
                          isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                        }`}
                      >
                        <div>
                          <span className="block text-[9px] uppercase tracking-[0.2em]">
                            DOMAIN
                          </span>
                          <span
                            className={`font-medium ${
                              isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-[0.2em]">
                            YEAR
                          </span>
                          <span
                            className={isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}
                          >
                            {item.year}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase tracking-[0.2em]">
                            COMPLEXITY
                          </span>
                          <span
                            className={isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}
                          >
                            {item.runtime}
                          </span>
                        </div>
                        <div className="transform group-hover:translate-x-2 transition-transform">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* DEDICATED OS WORKSHOPS & STUDIOS SECTION */}
          <section
            className={`px-6 md:px-16 lg:px-24 py-20 border-t transition-colors duration-500 ${
              isDark
                ? 'border-[#24242e] bg-[#07070a]'
                : 'border-[#0d0d11]/15 bg-[#f2f2f2]'
            }`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="mb-10">
                <span
                  className={`text-xs font-mono-tech uppercase tracking-[0.25em] block mb-2 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  INTERACTIVE OS WORKSHOPS
                </span>
                <h2 className="text-5xl md:text-7xl font-tall font-bold uppercase tracking-tight">
                  DEEP SYSTEM STUDIOS
                </h2>
              </div>

              {/* Studio Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  {
                    id: 'allocation',
                    num: '01',
                    title: 'FILE ALLOCATION',
                    subtitle: 'Contiguous, Linked FAT & Inode Trees',
                  },
                  {
                    id: 'cache',
                    num: '02',
                    title: 'BUFFER CACHE',
                    subtitle: 'FIFO, LRU, LFU & Clock Page Hits',
                  },
                  {
                    id: 'ascii',
                    num: '03',
                    title: 'ASCII BLUEPRINTS',
                    subtitle: 'Textual System Architecture Schematics',
                  },
                ].map((studio) => {
                  const isSelected = activeStudioTab === studio.id;
                  return (
                    <div
                      key={studio.id}
                      onClick={() => {
                        playButtonSnap();
                        setActiveStudioTab(isSelected ? 'none' : studio.id);
                      }}
                      className={`p-6 border transition-all cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea]'
                            : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11]'
                          : isDark
                          ? 'bg-[#0c0c12] text-[#f3f1ea] border-[#24242e] hover:border-[#8c8b94]'
                          : 'bg-[#e8e7e1] text-[#0d0d11] border-[#0d0d11]/20 hover:border-[#0d0d11]'
                      }`}
                    >
                      <span className="text-xs font-mono-tech tracking-[0.2em] font-bold block mb-2 opacity-60">
                        [{studio.num}]
                      </span>
                      <h3 className="text-2xl font-tall font-bold uppercase tracking-wide mb-1">
                        {studio.title}
                      </h3>
                      <p
                        className={`text-xs ${
                          isSelected
                            ? isDark
                              ? 'text-[#333]'
                              : 'text-[#ccc]'
                            : isDark
                            ? 'text-[#8c8b94]'
                            : 'text-[#6b6a72]'
                        }`}
                      >
                        {studio.subtitle}
                      </p>
                      <div className="mt-4 flex items-center space-x-1 text-[10px] font-mono-tech uppercase tracking-[0.16em]">
                        <span>{isSelected ? 'COLLAPSE STUDIO' : 'LAUNCH STUDIO'}</span>
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Embedded Studio Viewer */}
              {activeStudioTab === 'allocation' && (
                <div
                  className={`border p-6 animate-fade-in ${
                    isDark
                      ? 'bg-[#0c0c12] border-[#24242e]'
                      : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                  }`}
                >
                  <FileAllocationStudio theme={theme} />
                </div>
              )}
              {activeStudioTab === 'cache' && (
                <div
                  className={`border p-6 animate-fade-in ${
                    isDark
                      ? 'bg-[#0c0c12] border-[#24242e]'
                      : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                  }`}
                >
                  <FreeSpaceCacheStudio theme={theme} />
                </div>
              )}
              {activeStudioTab === 'ascii' && (
                <div
                  className={`border p-6 animate-fade-in ${
                    isDark
                      ? 'bg-[#0c0c12] border-[#24242e]'
                      : 'bg-[#e8e7e1] border-[#0d0d11]/15'
                  }`}
                >
                  <AsciiDiagrams theme={theme} />
                </div>
              )}
            </div>
          </section>

          {/* HALFTONE WORDMARK FOOTER // OS/26 */}
          <HalftoneWordmarkFooter
            wordmark="OS/26"
            label="OS/26"
            meta="THE PHYSICAL STORAGE ALGORITHM ARCHIVE · 2026"
            preset={isDark ? "night" : "paper"}
            palette={
              isDark
                ? { background: "#07070a", ink: "#f3f1ea", warm: "#e9762b" }
                : { background: "#f2f2f2", ink: "#0d0d11", warm: "#c2361c" }
            }
            dotGap={6}
            radius={85}
            crop={0.18}
            grain={0.45}
            height="540px"
            className="border-t border-[#0d0d11]/15 dark:border-[#24242e]"
          />
        </main>
      )}
    </div>
  );
}
