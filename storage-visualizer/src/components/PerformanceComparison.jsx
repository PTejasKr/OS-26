import React from 'react';
import {
  Trophy,
  TrendingDown,
  Activity,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import BentoCard from './BentoCard';
import { playKeyClick } from '../utils/soundEffects';

const ALGO_COLORS = {
  FCFS: '#3b82f6',
  SSTF: '#10b981',
  SCAN: '#f59e0b',
  'C-SCAN': '#d946ef',
  LOOK: '#00f0ff',
  'C-LOOK': '#a855f7',
};

export default function PerformanceComparison({
  comparisonData = [],
  activeAlgorithmKey = 'SSTF',
  onSelectAlgorithm,
}) {
  if (!comparisonData.length) return null;

  const winner = comparisonData[0];
  const maxMovement = Math.max(...comparisonData.map((c) => c.totalMovement));

  return (
    <BentoCard
      title="ALGORITHMIC PERFORMANCE MATRIX & RANKING"
      subtitle="Ranked by Total Mechanical Cylinder Seek Distance"
      badge={`OPTIMAL: ${winner.name} (${winner.totalMovement} Trk)`}
      badgeColor="emerald"
      icon={Trophy}
    >
      <div className="space-y-4 font-mono text-xs">
        {/* Ranked Data Table */}
        <div className="overflow-x-auto no-scrollbar rounded-lg border border-cyan-500/20 bg-[#080d16]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyan-500/20 bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="p-2.5">Rank</th>
                <th className="p-2.5">Algorithm</th>
                <th className="p-2.5 text-right">Total Seek</th>
                <th className="p-2.5 text-right">Avg Seek/Req</th>
                <th className="p-2.5 text-right">Savings vs FCFS</th>
                <th className="p-2.5 text-center">Starvation Risk</th>
                <th className="p-2.5 text-center">Arm Wear</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {comparisonData.map((row) => {
                const isSelected = row.name === activeAlgorithmKey;
                const isWinner = row.rank === 1;

                return (
                  <tr
                    key={row.name}
                    onClick={() => {
                      playKeyClick();
                      onSelectAlgorithm(row.name);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/60 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-2.5 font-bold">
                      {isWinner ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                          #1
                        </span>
                      ) : (
                        <span className="text-slate-400">#{row.rank}</span>
                      )}
                    </td>
                    <td className="p-2.5 font-semibold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ALGO_COLORS[row.name] || '#00f0ff' }}
                      />
                      <span>{row.name}</span>
                    </td>
                    <td className="p-2.5 text-right font-bold text-amber-400">
                      {row.totalMovement} <span className="text-[10px] text-slate-400">tracks</span>
                    </td>
                    <td className="p-2.5 text-right text-slate-300">
                      {row.averageMovement} <span className="text-[10px] text-slate-400">t/r</span>
                    </td>
                    <td className="p-2.5 text-right">
                      {row.savingsVsFcfs > 0 ? (
                        <span className="text-emerald-400 font-bold">
                          -{row.savingsVsFcfs}%
                        </span>
                      ) : (
                        <span className="text-slate-400">0% (Baseline)</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                          row.starvationRisk === 'HIGH'
                            ? 'bg-red-950 text-red-400 border-red-500/40'
                            : row.starvationRisk === 'NONE'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {row.starvationRisk}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="w-16 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, (row.totalMovement / maxMovement) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-cyan-950 hover:text-cyan-300'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-2 pt-2 border-t border-cyan-500/10">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Seek Distance Efficiency Comparison (Lower is Better):
          </div>
          <div className="space-y-2">
            {comparisonData.map((item) => {
              const pct = maxMovement > 0 ? (item.totalMovement / maxMovement) * 100 : 0;
              const isSelected = item.name === activeAlgorithmKey;
              return (
                <div key={`bar-${item.name}`} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <strong className={isSelected ? 'text-cyan-300' : 'text-slate-300'}>
                        {item.name}
                      </strong>
                      <span className="text-slate-400 text-[10px]">{item.serviceOrder}</span>
                    </span>
                    <span className="font-bold text-amber-400">
                      {item.totalMovement} tracks
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ALGO_COLORS[item.name] || '#00f0ff',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
