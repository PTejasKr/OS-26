import React, { useState } from 'react';
import {
  GraduationCap,
  ChevronDown,
  CheckCircle,
  XCircle,
  Award,
  BookOpen,
  Cpu,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import BentoCard from './BentoCard';
import { VIVA_QUESTIONS, QUIZ_QUESTIONS } from '../data/vivaData';
import { playKeyClick, playCacheHitSound, playButtonSnap } from '../utils/soundEffects';

/**
 * VivaExamTrainer
 * Operating Systems Laboratory Examination & Viva Voce Suite
 * Fully aligned with the A24 editorial aesthetic (a24.raviklaassens.com):
 * - Studio Off-White / Cinema Noir palettes
 * - Bebas Neue condensed headlines & Instrument Serif italics
 * - Archival roster table accordions with clean hairline dividers
 * - Interactive self-assessment quiz with high-contrast editorial feedback
 * - Physical HDD vs SSD architectural comparison guide
 */
export default function VivaExamTrainer({ theme }) {
  const isDark =
    theme === 'dark' ||
    (theme === undefined &&
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark');

  const [activeSubTab, setActiveSubTab] = useState('viva'); // 'viva', 'quiz', 'hardware'
  const [expandedVivaId, setExpandedVivaId] = useState(VIVA_QUESTIONS[0].id);

  // Quiz state
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQuiz = QUIZ_QUESTIONS[currentQuizIdx];

  const handleOptionSelect = (idx) => {
    if (isAnswerSubmitted) return;
    playKeyClick();
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQuiz.correctIndex;
    if (isCorrect) {
      playCacheHitSound();
      setScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    playButtonSnap();
    if (currentQuizIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIdx((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const handleRestartQuiz = () => {
    playButtonSnap();
    setCurrentQuizIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="space-y-6 select-text transition-colors duration-300">
      {/* Top Editorial Header & Mode Switcher */}
      <div
        className={`p-6 border flex flex-col md:flex-row md:items-end justify-between gap-6 transition-colors ${
          isDark
            ? 'bg-[#0c0c12] border-[#24242e]'
            : 'bg-[#f5f4ef] border-[#0d0d11]/15'
        }`}
      >
        <div>
          <span
            className={`text-[10px] font-mono-tech uppercase tracking-[0.25em] block mb-1 font-bold ${
              isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
            }`}
          >
            STUDIO 03 // ACADEMIC EXAMINATION SUITE
          </span>
          <h2
            className={`text-3xl sm:text-4xl font-tall font-bold uppercase tracking-tight ${
              isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
            }`}
          >
            OS LABORATORY VIVA VOCE & EXAMINATION SUITE
          </h2>
          <p
            className={`text-xs font-editorial italic mt-1 ${
              isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
            }`}
          >
            Curated oral examination questions, interactive technical assessments, and mechanical storage physics.
          </p>
        </div>

        {/* Segmented A24 Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'viva', label: 'Examiner Viva Q&A' },
            { id: 'quiz', label: 'Interactive Self-Quiz' },
            { id: 'hardware', label: 'HDD vs SSD Guide' },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playButtonSnap();
                  setActiveSubTab(tab.id);
                }}
                className={`px-4 py-2 border text-xs font-mono-tech uppercase tracking-[0.16em] transition-all font-semibold ${
                  isActive
                    ? isDark
                      ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] shadow-sm'
                      : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] shadow-sm'
                    : isDark
                    ? 'bg-transparent text-[#8c8b94] border-[#24242e] hover:border-[#8c8b94] hover:text-[#f3f1ea]'
                    : 'bg-transparent text-[#6b6a72] border-[#0d0d11]/20 hover:border-[#0d0d11] hover:text-[#0d0d11]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODE 1: VIVA QUESTIONS ACCORDION ROSTER */}
      {activeSubTab === 'viva' && (
        <div
          className={`border divide-y transition-colors ${
            isDark
              ? 'border-[#24242e] divide-[#24242e] bg-[#0c0c12]'
              : 'border-[#0d0d11]/15 divide-[#0d0d11]/15 bg-[#f5f4ef]'
          }`}
        >
          {VIVA_QUESTIONS.map((q, idx) => {
            const isExpanded = expandedVivaId === q.id;
            const numStr = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={q.id}
                className={`transition-colors ${
                  isExpanded
                    ? isDark
                      ? 'bg-[#12121b]'
                      : 'bg-[#eeece4]'
                    : ''
                }`}
              >
                {/* Accordion Row Header */}
                <button
                  onClick={() => {
                    playKeyClick();
                    setExpandedVivaId(isExpanded ? null : q.id);
                  }}
                  className={`w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 group cursor-pointer transition-colors ${
                    isDark
                      ? 'hover:bg-[#151520]'
                      : 'hover:bg-[#e8e6dd]'
                  }`}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center space-x-4 sm:space-x-6 min-w-0">
                    <span
                      className={`text-xs font-mono-tech tracking-[0.2em] font-bold px-2.5 py-1 border transition-colors shrink-0 ${
                        isDark
                          ? 'border-[#24242e] text-[#8c8b94] group-hover:text-[#f3f1ea] group-hover:border-[#8c8b94]'
                          : 'border-[#0d0d11]/20 text-[#6b6a72] group-hover:text-[#0d0d11] group-hover:border-[#0d0d11]'
                      }`}
                    >
                      {numStr}
                    </span>
                    <span
                      className={`font-sans font-semibold text-sm sm:text-base transition-colors leading-snug group-hover:underline ${
                        isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
                      }`}
                    >
                      {q.question}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                    <span
                      className={`hidden sm:inline text-[10px] font-mono-tech uppercase tracking-[0.16em] px-2.5 py-0.5 border ${
                        isDark
                          ? 'border-[#24242e] text-[#8c8b94] bg-[#14141c]'
                          : 'border-[#0d0d11]/20 text-[#6b6a72] bg-white'
                      }`}
                    >
                      {q.category}
                    </span>
                    <div
                      className={`p-1 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      <ChevronDown
                        size={18}
                        className={isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'}
                      />
                    </div>
                  </div>
                </button>

                {/* Expanded Answer Content */}
                {isExpanded && (
                  <div
                    className={`px-6 pb-6 pt-2 space-y-4 border-t transition-colors ${
                      isDark
                        ? 'border-[#24242e]/60 bg-[#0e0e16]/80'
                        : 'border-[#0d0d11]/10 bg-white/50'
                    }`}
                  >
                    <p
                      className={`text-sm leading-relaxed font-sans ${
                        isDark ? 'text-[#dedbd2]' : 'text-[#2b2a33]'
                      }`}
                    >
                      {q.answer}
                    </p>

                    {/* Archival Callout: Key Points to Quote in Viva Exam */}
                    <div
                      className={`border-l-2 pl-4 py-3 space-y-2 transition-colors ${
                        isDark
                          ? 'border-[#891a20] bg-[#891a20]/10 text-[#dedbd2]'
                          : 'border-[#891a20] bg-[#891a20]/5 text-[#2b2a33]'
                      }`}
                    >
                      <div className="text-[10px] font-mono-tech uppercase tracking-[0.2em] font-bold text-[#891a20]">
                        Key Points to Quote in Viva Exam:
                      </div>
                      <ul className="space-y-1 text-xs font-mono-tech">
                        {q.keyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <span className="text-[#891a20] font-bold">▪</span>
                            <span className={isDark ? 'text-[#c2c0b8]' : 'text-[#44424c]'}>
                              {pt}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: INTERACTIVE SELF-QUIZ */}
      {activeSubTab === 'quiz' && (
        <BentoCard
          title="OPERATING SYSTEMS VIVA SELF-ASSESSMENT"
          subtitle={`Question ${currentQuizIdx + 1} of ${QUIZ_QUESTIONS.length}`}
          badge={`CURRENT SCORE: ${score} / ${QUIZ_QUESTIONS.length}`}
          icon={Award}
          theme={theme}
        >
          {!quizFinished ? (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              {/* Question Banner */}
              <div
                className={`p-5 border transition-colors ${
                  isDark
                    ? 'bg-[#14141c] border-[#24242e]'
                    : 'bg-white border-[#0d0d11]/15'
                }`}
              >
                <span
                  className={`text-[10px] font-mono-tech uppercase tracking-[0.2em] block mb-1 font-bold ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  QUESTION {currentQuizIdx + 1} // {currentQuiz.category || 'STORAGE ARCHITECTURE'}
                </span>
                <p
                  className={`font-sans font-bold text-base sm:text-lg leading-relaxed ${
                    isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'
                  }`}
                >
                  {currentQuiz.question}
                </p>
              </div>

              {/* Options Roster */}
              <div className="space-y-2.5">
                {currentQuiz.options.map((opt, oIdx) => {
                  const isSelected = selectedOption === oIdx;
                  const isCorrect = oIdx === currentQuiz.correctIndex;
                  const letter = String.fromCharCode(65 + oIdx);

                  let optionStyles = isDark
                    ? 'border-[#24242e] bg-[#0c0c12] text-[#dedbd2] hover:border-[#8c8b94]'
                    : 'border-[#0d0d11]/15 bg-white text-[#2b2a33] hover:border-[#0d0d11]';

                  if (isAnswerSubmitted) {
                    if (isCorrect) {
                      optionStyles = isDark
                        ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300 font-semibold'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold';
                    } else if (isSelected) {
                      optionStyles = isDark
                        ? 'border-rose-500/80 bg-rose-950/40 text-rose-300'
                        : 'border-rose-600 bg-rose-50 text-rose-900';
                    }
                  } else if (isSelected) {
                    optionStyles = isDark
                      ? 'border-[#f3f1ea] bg-[#1a1a24] text-[#f3f1ea] font-semibold'
                      : 'border-[#0d0d11] bg-[#e4e2d8] text-[#0d0d11] font-semibold';
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleOptionSelect(oIdx)}
                      className={`p-4 border flex items-center justify-between cursor-pointer transition-all duration-200 ${optionStyles}`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span
                          className={`w-6 h-6 border flex items-center justify-center text-xs font-mono-tech font-bold shrink-0 ${
                            isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/20'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-xs sm:text-sm font-sans">{opt}</span>
                      </div>
                      {isAnswerSubmitted && isCorrect && (
                        <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {isAnswerSubmitted && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Note */}
              {isAnswerSubmitted && (
                <div
                  className={`p-4 border-l-2 border-[#891a20] space-y-1 transition-colors ${
                    isDark ? 'bg-[#891a20]/10 text-[#dedbd2]' : 'bg-[#891a20]/5 text-[#2b2a33]'
                  }`}
                >
                  <div className="text-[10px] font-mono-tech uppercase tracking-[0.2em] font-bold text-[#891a20]">
                    Examiner Explanation:
                  </div>
                  <p className="text-xs sm:text-sm font-editorial italic leading-relaxed">
                    "{currentQuiz.explanation}"
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className={`px-6 py-3 border font-mono-tech text-xs uppercase tracking-[0.2em] font-bold transition-all disabled:opacity-40 cursor-pointer ${
                      isDark
                        ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] hover:bg-white'
                        : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black'
                    }`}
                  >
                    Lock Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuiz}
                    className={`px-6 py-3 border font-mono-tech text-xs uppercase tracking-[0.2em] font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                      isDark
                        ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] hover:bg-white'
                        : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black'
                    }`}
                  >
                    <span>
                      {currentQuizIdx < QUIZ_QUESTIONS.length - 1
                        ? 'Next Question'
                        : 'Complete Examination'}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-5 max-w-md mx-auto">
              <div
                className={`w-16 h-16 mx-auto border flex items-center justify-center ${
                  isDark ? 'border-[#24242e] bg-[#14141c]' : 'border-[#0d0d11]/20 bg-white'
                }`}
              >
                <Award
                  className={`w-8 h-8 ${isDark ? 'text-[#f3f1ea]' : 'text-[#0d0d11]'}`}
                />
              </div>
              <h3 className="font-tall text-3xl font-bold uppercase tracking-tight">
                Viva Voce Assessment Complete
              </h3>
              <p
                className={`text-sm font-editorial italic ${
                  isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                }`}
              >
                Candidate score recorded: <strong className="font-mono-tech font-bold">{score}</strong> / {QUIZ_QUESTIONS.length} questions correctly answered ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%).
              </p>
              <button
                onClick={handleRestartQuiz}
                className={`px-6 py-3 border font-mono-tech text-xs uppercase tracking-[0.2em] font-bold transition-all inline-flex items-center space-x-2 cursor-pointer ${
                  isDark
                    ? 'bg-[#f3f1ea] text-[#07070a] border-[#f3f1ea] hover:bg-white'
                    : 'bg-[#0d0d11] text-[#f2f2f2] border-[#0d0d11] hover:bg-black'
                }`}
              >
                <RotateCcw size={14} />
                <span>Restart Exam Session</span>
              </button>
            </div>
          )}
        </BentoCard>
      )}

      {/* MODE 3: HARDWARE GUIDE (HDD vs SSD) */}
      {activeSubTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BentoCard
            title="MAGNETIC HARD DISK DRIVES (HDD)"
            subtitle="Mechanical Rotating Platter Physics"
            badge="MECHANICAL"
            icon={BookOpen}
            theme={theme}
          >
            <div className="space-y-4 text-xs font-sans leading-relaxed">
              <p className={isDark ? 'text-[#dedbd2]' : 'text-[#2b2a33]'}>
                Magnetic storage relies on physical voice-coil servo actuators, rotating spindle motors, and magnetic head suspensions:
              </p>
              <div
                className={`border divide-y text-xs font-mono-tech ${
                  isDark
                    ? 'border-[#24242e] divide-[#24242e] bg-[#14141c]'
                    : 'border-[#0d0d11]/15 divide-[#0d0d11]/15 bg-white'
                }`}
              >
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    PLATTERS & SPINDLE
                  </span>
                  <span>Constant rotational velocity at 5,400 to 15,000 RPM (2–4 ms average latency).</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    CYLINDERS & TRACKS
                  </span>
                  <span>Concentric magnetic tracks stacked vertically across dual-sided platters.</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    MECHANICAL SEEK ARM
                  </span>
                  <span>Radial head swing requires 3–9 ms (the primary bottleneck in computing systems).</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    SCHEDULING REASONING
                  </span>
                  <span>Elevator algorithms (SCAN, C-SCAN) prevent head thrashing and save mechanical actuator wear.</span>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard
            title="SOLID STATE DRIVES (SSD & NVME)"
            subtitle="Silicon NAND Flash Cell Architecture"
            badge="ELECTRONIC"
            icon={Cpu}
            theme={theme}
          >
            <div className="space-y-4 text-xs font-sans leading-relaxed">
              <p className={isDark ? 'text-[#dedbd2]' : 'text-[#2b2a33]'}>
                Solid state storage uses non-volatile floating-gate / charge-trap NAND flash memory cells with zero moving mechanical parts:
              </p>
              <div
                className={`border divide-y text-xs font-mono-tech ${
                  isDark
                    ? 'border-[#24242e] divide-[#24242e] bg-[#14141c]'
                    : 'border-[#0d0d11]/15 divide-[#0d0d11]/15 bg-white'
                }`}
              >
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    ZERO SEEK DELAY
                  </span>
                  <span>Direct electronic word-line lookup in 20–80 microseconds regardless of address.</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    NO DISK SCHEDULING
                  </span>
                  <span>SSTF and SCAN are obsolete for SSDs; sequential sorting adds pointless CPU overhead.</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    FTL (FLASH TRANSLATION LAYER)
                  </span>
                  <span>Handles logical-to-physical block mapping, wear leveling, and background TRIM garbage collection.</span>
                </div>
                <div className="p-3">
                  <span className="block font-bold text-[10px] uppercase tracking-[0.16em] opacity-60 mb-0.5">
                    NVME MASSIVE CONCURRENCY
                  </span>
                  <span>Up to 64,000 parallel I/O queues with 64,000 command depth each over PCIe lanes.</span>
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      )}
    </div>
  );
}
