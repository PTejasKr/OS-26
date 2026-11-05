import React from 'react';
import { Calculator, ArrowRight, CheckCircle2, Bookmark } from 'lucide-react';
import BentoCard from './BentoCard';

export default function StepCalculationProof({ activeResult }) {
  if (!activeResult) return null;

  const formulaStr = activeResult.steps.map((s) => s.distance).join(' + ') || '0';

  return (
    <BentoCard
      title={`${activeResult.algorithmName} MATHEMATICAL PROOF & SEEK AUDIT`}
      subtitle="Step-by-step physical cylinder transition arithmetic"
      badge={`${activeResult.steps.length} TRANSITIONS`}
      badgeColor="amber"
      icon={Calculator}
    >
      <div className="space-y-4 font-mono text-xs">
        {/* Formal Equation Proof Box */}
        <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2">
          <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rigorous Mathematical Proof:</span>
          </div>

          <div className="text-amber-300 font-bold text-xs overflow-x-auto py-1">
            Total Head Movement = {formulaStr} ={' '}
            <strong className="text-cyan-400 text-sm">{activeResult.totalMovement} tracks</strong>
          </div>

          <div className="text-slate-300 text-[11px] pt-1 border-t border-slate-800 flex justify-between flex-wrap gap-2">
            <span>
              Average Seek per Request = {activeResult.totalMovement} / {activeResult.requestCount} ={' '}
              <strong className="text-emerald-400 font-bold">{activeResult.averageMovement} tracks/request</strong>
            </span>
            <span className="text-slate-400">
              Formula: Δ = |Track_(i) - Track_(i-1)|
            </span>
          </div>
        </div>

        {/* Step-by-Step Data Table */}
        <div className="overflow-x-auto no-scrollbar rounded-lg border border-cyan-500/20 bg-[#080d16] max-h-60 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-cyan-500/20 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="p-2">Step</th>
                <th className="p-2">From Track</th>
                <th className="p-2">To Track</th>
                <th className="p-2 text-right">Distance (Δ)</th>
                <th className="p-2 text-right">Cumulative</th>
                <th className="p-2">Action Type</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 text-[11px]">
              {activeResult.steps.map((s) => {
                const isWrap = s.stepType === 'WRAP_AROUND';
                const isBoundary = s.stepType === 'BOUNDARY';

                return (
                  <tr key={`step-${s.stepNumber}`} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-cyan-400">#{s.stepNumber}</td>
                    <td className="p-2 text-slate-300">Track {s.fromTrack}</td>
                    <td className="p-2 font-bold text-amber-300">Track {s.toTrack}</td>
                    <td className="p-2 text-right font-bold text-emerald-400">
                      {s.distance} trk
                    </td>
                    <td className="p-2 text-right text-slate-400">{s.cumulative} trk</td>
                    <td className="p-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${
                          isWrap
                            ? 'bg-red-950 text-red-400 border-red-500/40'
                            : isBoundary
                            ? 'bg-amber-950 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {s.stepType}
                      </span>
                    </td>
                    <td className="p-2 text-slate-400 text-[10px] max-w-xs truncate" title={s.description}>
                      {s.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Algorithm Behavior Notes */}
        {activeResult.notes && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold">
              Engineering Notes & Constraints:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
              {activeResult.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
