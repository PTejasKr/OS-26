import React, { useState } from 'react';
import {
  FileDown,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  FileCode,
  Printer,
} from 'lucide-react';
import { playKeyClick } from '../utils/soundEffects';

export default function ReportExporter({
  isOpen,
  onClose,
  allResults,
  comparisonData,
  queue,
  head,
  minTrack,
  maxTrack,
  direction,
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const winner = comparisonData?.[0];

  const generateMarkdownReport = () => {
    return `# 💽 Operating Systems Storage & Disk Scheduling Laboratory Report
Generated on: ${new Date().toUTCString()}

## 1. Input Workload Specification
- **Request Queue:** \`[${queue}]\` (${queue.split(',').length} requests)
- **Initial Head Position:** Cylinder ${head}
- **Physical Disk Range:** [${minTrack} .. ${maxTrack}]
- **Initial Direction:** ${direction.toUpperCase()}

---

## 2. Algorithm Performance Benchmark Ranking
| Rank | Algorithm | Total Head Movement | Average Seek (tracks/req) | Savings vs FCFS | Starvation Risk |
| :---: | :--- | :---: | :---: | :---: | :---: |
${comparisonData
  .map(
    (c) =>
      `| **#${c.rank}** | **${c.name}** | **${c.totalMovement} tracks** | **${c.averageMovement}** | ${c.savingsVsFcfs}% | ${c.starvationRisk} |`
  )
  .join('\n')}

---

## 3. Executive Analysis
- **Winning Algorithm:** **${winner?.name}** minimized mechanical seek overhead by traversing only **${winner?.totalMovement} tracks**.
- **FCFS Baseline:** Required **${allResults.FCFS?.totalMovement} tracks**.
- **Percentage Improvement:** ${winner?.savingsVsFcfs}% seek distance reduction achieved.

---

## 4. Step-by-Step Transition Proof (${winner?.name})
${allResults[winner?.name]?.steps
  .map(
    (s) =>
      `- Step ${s.stepNumber}: Track ${s.fromTrack} ➔ Track ${s.toTrack} | Seek Distance = ${s.distance} tracks (${s.stepType})`
  )
  .join('\n')}

Total Movement Sum: ${allResults[winner?.name]?.steps.map((s) => s.distance).join(' + ')} = ${winner?.totalMovement} tracks.
`;
  };

  const handleCopyMarkdown = () => {
    playKeyClick();
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    playKeyClick();
    const data = {
      timestamp: new Date().toISOString(),
      parameters: { queue, head, minTrack, maxTrack, direction },
      comparison: comparisonData,
      simulations: allResults,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    playKeyClick();
    const headers = 'Rank,Algorithm,Total Seek (tracks),Average Seek,Savings vs FCFS (%),Starvation Risk\n';
    const rows = comparisonData
      .map(
        (c) =>
          `#${c.rank},${c.name},${c.totalMovement},${c.averageMovement},${c.savingsVsFcfs}%,${c.starvationRisk}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disk_benchmark_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    playKeyClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
      <div className="relative w-full max-w-2xl rounded-xl border border-cyan-500/40 bg-[#0a0f18] p-5 shadow-[0_0_40px_rgba(0,240,255,0.2)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">
              EXPORT STORAGE BENCHMARK REPORT
            </h3>
          </div>
          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopyMarkdown}
            className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 flex flex-col items-center gap-1.5 transition-all text-center"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span className="font-bold text-xs">
              {copied ? 'Copied to Clipboard!' : 'Copy Markdown Report'}
            </span>
            <span className="text-[10px] text-slate-400">For viva reports & docs</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 flex flex-col items-center gap-1.5 transition-all text-center"
          >
            <FileCode className="w-5 h-5" />
            <span className="font-bold text-xs">Export Raw JSON</span>
            <span className="text-[10px] text-slate-400">Full step telemetry</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 flex flex-col items-center gap-1.5 transition-all text-center"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-bold text-xs">Export CSV Table</span>
            <span className="text-[10px] text-slate-400">For Excel & Pandas</span>
          </button>
        </div>

        {/* Markdown Preview */}
        <div className="space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Report Preview:
          </div>
          <textarea
            readOnly
            rows={8}
            value={generateMarkdownReport()}
            className="w-full p-2.5 rounded-lg bg-black/70 border border-slate-800 text-slate-300 text-[11px] font-mono resize-none focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <button
            onClick={handlePrint}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report View</span>
          </button>

          <button
            onClick={() => {
              playKeyClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
