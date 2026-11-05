import React, { useState } from 'react';
import { Eye, Layers } from 'lucide-react';

const ALGO_COLORS = {
  FCFS: '#3b82f6', // Blue
  SSTF: '#10b981', // Emerald
  SCAN: '#f59e0b', // Amber
  'C-SCAN': '#d946ef', // Magenta
  LOOK: '#00f0ff', // Cyan
  'C-LOOK': '#a855f7', // Purple
};

export default function TrajectoryChart({
  activeResult,
  allResults = {},
  currentStepIndex = null,
  onStepSelect,
  minTrack = 0,
  maxTrack = 199,
}) {
  const [overlayMulti, setOverlayMulti] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!activeResult) return null;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 420;
  const padding = { top: 35, right: 35, bottom: 45, left: 55 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Scale functions
  const xScale = (track) => {
    return padding.left + ((track - minTrack) / (maxTrack - minTrack)) * plotWidth;
  };

  const maxSteps = Math.max(
    activeResult.movementPath.length - 1,
    ...Object.values(allResults).map((r) => r.movementPath.length - 1)
  );

  const yScale = (stepIdx) => {
    // Inverted Y: Step 0 at top, later steps descending downwards
    return padding.top + (stepIdx / (maxSteps || 1)) * plotHeight;
  };

  // Generate ticks for X-axis
  const trackTicks = [];
  const tickCount = 8;
  const stepSize = Math.round((maxTrack - minTrack) / tickCount);
  for (let t = minTrack; t <= maxTrack; t += stepSize) {
    trackTicks.push(t);
  }
  if (!trackTicks.includes(maxTrack)) trackTicks.push(maxTrack);

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Controls Strip */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/10 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">ACTIVE:</span>
          <span
            className="font-bold px-2 py-0.5 rounded text-[11px]"
            style={{
              backgroundColor: `${ALGO_COLORS[activeResult.shortName] || '#00f0ff'}20`,
              color: ALGO_COLORS[activeResult.shortName] || '#00f0ff',
              border: `1px solid ${ALGO_COLORS[activeResult.shortName] || '#00f0ff'}40`,
            }}
          >
            {activeResult.algorithmName}
          </span>
          <span className="text-slate-400">({activeResult.totalMovement} Tracks)</span>
        </div>

        <button
          onClick={() => setOverlayMulti(!overlayMulti)}
          className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-colors ${
            overlayMulti
              ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-500/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Compare All 6 Overlaid</span>
        </button>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 bg-[#070b13] rounded-lg border border-cyan-500/20 overflow-hidden flex items-center justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full select-none"
        >
          {/* Background Grid Lines */}
          {trackTicks.map((tick) => (
            <g key={`xtick-${tick}`}>
              <line
                x1={xScale(tick)}
                y1={padding.top}
                x2={xScale(tick)}
                y2={svgHeight - padding.bottom}
                stroke="#1e293b"
                strokeDasharray="2,3"
                strokeWidth="1"
              />
              <text
                x={xScale(tick)}
                y={svgHeight - padding.bottom + 16}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Y-axis Step guideline markers */}
          {Array.from({ length: maxSteps + 1 }).map((_, stepIdx) => (
            <g key={`ytick-${stepIdx}`}>
              <line
                x1={padding.left}
                y1={yScale(stepIdx)}
                x2={svgWidth - padding.right}
                y2={yScale(stepIdx)}
                stroke="#0f172a"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={yScale(stepIdx) + 3}
                fill="#475569"
                fontSize="9"
                textAnchor="end"
              >
                S{stepIdx}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          <text
            x={svgWidth / 2}
            y={svgHeight - 10}
            fill="#94a3b8"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            CYLINDER / TRACK NUMBER [X-AXIS]
          </text>
          <text
            x={16}
            y={svgHeight / 2}
            fill="#94a3b8"
            fontSize="10"
            fontWeight="bold"
            transform={`rotate(-90 16 ${svgHeight / 2})`}
            textAnchor="middle"
          >
            STEP PROGRESSION (DOWNWARD TIME ↓)
          </text>

          {/* Overlaid Other Algorithms (Ghost Paths) */}
          {overlayMulti &&
            Object.entries(allResults).map(([algoKey, res]) => {
              if (algoKey === activeResult.shortName) return null;
              const pathD = res.movementPath
                .map((trk, idx) => `${idx === 0 ? 'M' : 'L'} ${xScale(trk)} ${yScale(idx)}`)
                .join(' ');
              return (
                <path
                  key={algoKey}
                  d={pathD}
                  fill="none"
                  stroke={ALGO_COLORS[algoKey] || '#64748b'}
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                  opacity="0.45"
                />
              );
            })}

          {/* Active Algorithm Main Path Segments */}
          {activeResult.steps.map((s, idx) => {
            const x1 = xScale(s.fromTrack);
            const y1 = yScale(s.stepNumber - 1);
            const x2 = xScale(s.toTrack);
            const y2 = yScale(s.stepNumber);

            const isWrap = s.stepType === 'WRAP_AROUND';
            const isBoundary = s.stepType === 'BOUNDARY';

            return (
              <g key={`seg-${s.stepNumber}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isWrap ? '#ef4444' : isBoundary ? '#f59e0b' : ALGO_COLORS[activeResult.shortName] || '#00f0ff'}
                  strokeWidth={isWrap ? '2.5' : '2.2'}
                  strokeDasharray={isWrap ? '6,4' : undefined}
                  className="transition-all"
                />
              </g>
            );
          })}

          {/* Active Algorithm Points / Markers */}
          {activeResult.movementPath.map((trk, stepIdx) => {
            const cx = xScale(trk);
            const cy = yScale(stepIdx);
            const isStart = stepIdx === 0;
            const currentStepObj = stepIdx > 0 ? activeResult.steps[stepIdx - 1] : null;
            const isWrap = currentStepObj?.stepType === 'WRAP_AROUND';
            const isBoundary = currentStepObj?.stepType === 'BOUNDARY';
            const isCurrentScrub = currentStepIndex === stepIdx;

            return (
              <g
                key={`point-${stepIdx}`}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredPoint({
                    step: stepIdx,
                    track: trk,
                    delta: currentStepObj ? currentStepObj.distance : 0,
                    type: isStart ? 'INITIAL_HEAD' : currentStepObj?.stepType,
                    desc: currentStepObj ? currentStepObj.description : `Initial Head Position: Cylinder ${trk}`,
                    x: cx,
                    y: cy,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onStepSelect?.(stepIdx)}
              >
                {/* Active Scrubber Glow Halo */}
                {isCurrentScrub && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="none"
                    stroke="#00f0ff"
                    strokeWidth="2"
                    className="animate-ping"
                  />
                )}

                {isStart ? (
                  // Initial Head Diamond
                  <polygon
                    points={`${cx},${cy - 7} ${cx + 7},${cy} ${cx},${cy + 7} ${cx - 7},${cy}`}
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ) : isWrap ? (
                  // Wrap-around Triangle
                  <polygon
                    points={`${cx},${cy - 6} ${cx + 6},${cy + 6} ${cx - 6},${cy + 6}`}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ) : isBoundary ? (
                  // Boundary Square
                  <rect
                    x={cx - 5}
                    y={cy - 5}
                    width="10"
                    height="10"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                ) : (
                  // Serviced Request Circle
                  <circle
                    cx={cx}
                    cy={cy}
                    r="5.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* Cylinder Label tag */}
                <text
                  x={cx}
                  y={cy - 9}
                  fill="#f1f5f9"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {trk}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-950/95 border border-cyan-400 text-slate-100 p-2.5 rounded-lg text-xs shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            style={{
              left: Math.min(hoveredPoint.x + 15, svgWidth - 190),
              top: Math.max(hoveredPoint.y - 45, 10),
            }}
          >
            <div className="font-bold text-cyan-300">
              STEP {hoveredPoint.step}: CYLINDER {hoveredPoint.track}
            </div>
            <div className="text-[11px] text-amber-300">
              Seek Distance: {hoveredPoint.delta} Tracks
            </div>
            <div className="text-[10px] text-slate-400 mt-1 max-w-[180px]">
              {hoveredPoint.desc}
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Legend */}
      <div className="mt-2 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rotate-45 bg-blue-500" />
            <span>Start</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Serviced Request</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-500" />
            <span>Boundary Turnaround</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-red-500" />
            <span>Wrap-Around Jump</span>
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          *Standard textbook inverted Y-axis convention (Time downward)
        </div>
      </div>
    </div>
  );
}
