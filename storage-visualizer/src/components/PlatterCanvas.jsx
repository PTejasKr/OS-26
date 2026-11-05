import React, { useRef, useEffect, useState } from 'react';
import { Disc, PlusCircle, Volume2, Move, Sparkles } from 'lucide-react';
import { playSeekTick, playReadPulse } from '../utils/soundEffects';

export default function PlatterCanvas({
  currentTrack,
  targetTrack,
  minTrack = 0,
  maxTrack = 199,
  pendingRequests = [],
  servicedRequests = [],
  initialHead = 53,
  direction = 'right',
  isSeeking = false,
  stepDescription = '',
  onTrackClick,
}) {
  const canvasRef = useRef(null);
  const [rpm, setRpm] = useState(7200);
  const [isRotating, setIsRotating] = useState(true);
  const [hoveredTrack, setHoveredTrack] = useState(null);

  // Arm position state for smooth physical seeking animation
  const armTrackRef = useRef(currentTrack);
  const angleRef = useRef(0);
  const lastTrackSoundRef = useRef(currentTrack);

  // Canvas dimensions
  const canvasWidth = 680;
  const canvasHeight = 440;

  useEffect(() => {
    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Smooth lerp arm movement towards targetTrack
      const diff = currentTrack - armTrackRef.current;
      if (Math.abs(diff) > 0.05) {
        armTrackRef.current += diff * 0.16;
        const curInt = Math.round(armTrackRef.current);
        if (curInt !== lastTrackSoundRef.current) {
          playSeekTick(1 + (curInt / maxTrack) * 0.5);
          lastTrackSoundRef.current = curInt;
        }
      } else {
        armTrackRef.current = currentTrack;
      }

      // Rotate platter
      if (isRotating) {
        const rotationSpeed = (rpm / 60) * 0.005;
        angleRef.current = (angleRef.current + rotationSpeed) % (Math.PI * 2);
      }

      // Center and Dimensions
      const centerX = canvasWidth * 0.45;
      const centerY = canvasHeight * 0.5;
      const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.42;
      const minRadius = maxRadius * 0.22;

      // Track to radial distance helper
      const trackToRadius = (trk) => {
        const norm = Math.max(0, Math.min(1, (trk - minTrack) / (maxTrack - minTrack)));
        return minRadius + norm * (maxRadius - minRadius);
      };

      // 1. Draw Outer Drive Enclosure Base
      ctx.save();
      ctx.fillStyle = '#070b13';
      ctx.fillRect(4, 4, canvasWidth - 8, canvasHeight - 8);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8);

      // Corner target brackets
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(10, 22);
      ctx.lineTo(10, 10);
      ctx.lineTo(22, 10);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(canvasWidth - 22, 10);
      ctx.lineTo(canvasWidth - 10, 10);
      ctx.lineTo(canvasWidth - 10, 22);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(10, canvasHeight - 22);
      ctx.lineTo(10, canvasHeight - 10);
      ctx.lineTo(22, canvasHeight - 10);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(canvasWidth - 22, canvasHeight - 10);
      ctx.lineTo(canvasWidth - 10, canvasHeight - 10);
      ctx.lineTo(canvasWidth - 10, canvasHeight - 22);
      ctx.stroke();
      ctx.restore();

      // 2. Draw Magnetic Platter (Platter Surface)
      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer platter shadow & edge bevel
      const platterGrad = ctx.createRadialGradient(0, 0, minRadius * 0.9, 0, 0, maxRadius + 12);
      platterGrad.addColorStop(0, '#0a101d');
      platterGrad.addColorStop(0.3, '#0d1527');
      platterGrad.addColorStop(0.7, '#132035');
      platterGrad.addColorStop(0.95, '#1e2d44');
      platterGrad.addColorStop(1, '#0f172a');

      ctx.beginPath();
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = platterGrad;
      ctx.fill();
      ctx.strokeStyle = '#38bdf855';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Platter Rotating Texture & Radial Spokes
      ctx.save();
      ctx.rotate(angleRef.current);

      // Sheen reflection
      const sheen = ctx.createLinearGradient(-maxRadius, -maxRadius, maxRadius, maxRadius);
      sheen.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
      sheen.addColorStop(0.5, 'rgba(0, 240, 255, 0.08)');
      sheen.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
      ctx.fillStyle = sheen;
      ctx.beginPath();
      ctx.arc(0, 0, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Sector dividing lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      for (let s = 0; s < 16; s++) {
        const rad = (s * Math.PI * 2) / 16;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * minRadius, Math.sin(rad) * minRadius);
        ctx.lineTo(Math.cos(rad) * maxRadius, Math.sin(rad) * maxRadius);
        ctx.stroke();
      }
      ctx.restore();

      // Concentric Cylinder Grid Lines
      const sampleTrackInterval = (maxTrack - minTrack) / 8;
      for (let t = minTrack; t <= maxTrack; t += sampleTrackInterval) {
        const r = trackToRadius(t);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 3. Draw Pending Request Track Rings (Pulsing Amber)
      pendingRequests.forEach((req) => {
        const r = trackToRadius(req);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 4. Draw Serviced Request Track Rings (Emerald)
      servicedRequests.forEach((req) => {
        const r = trackToRadius(req);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      });

      // 5. Highlight Hovered Track from Mouse
      if (hoveredTrack !== null) {
        const hRad = trackToRadius(hoveredTrack);
        ctx.beginPath();
        ctx.arc(0, 0, hRad, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 6. Active Target Cylinder Ring (Glowing Cyan)
      const currentRadius = trackToRadius(armTrackRef.current);
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Spindle Center Hub
      const spindleGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, minRadius);
      spindleGrad.addColorStop(0, '#475569');
      spindleGrad.addColorStop(0.6, '#1e293b');
      spindleGrad.addColorStop(1, '#0f172a');
      ctx.beginPath();
      ctx.arc(0, 0, minRadius, 0, Math.PI * 2);
      ctx.fillStyle = spindleGrad;
      ctx.fill();
      ctx.strokeStyle = '#00f0ff88';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Spindle screws
      ctx.fillStyle = '#94a3b8';
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI * 2) / 6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * (minRadius * 0.55), Math.sin(a) * (minRadius * 0.55), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore(); // Restore platter center

      // 7. Draw Mechanical Actuator Arm Assembly & Read Head
      const pivotX = canvasWidth * 0.86;
      const pivotY = canvasHeight * 0.22;

      // Position read head along angled sweep trajectory
      const headAngle = Math.PI * 0.95;
      const headX = centerX + Math.cos(headAngle) * currentRadius;
      const headY = centerY + Math.sin(headAngle) * currentRadius;

      // Voice coil magnet arc
      ctx.save();
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 44, -Math.PI * 0.25, Math.PI * 0.35);
      ctx.strokeStyle = '#f59e0b55';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Actuator Pivot Base
      const pivotGrad = ctx.createRadialGradient(pivotX, pivotY, 4, pivotX, pivotY, 28);
      pivotGrad.addColorStop(0, '#64748b');
      pivotGrad.addColorStop(0.5, '#334155');
      pivotGrad.addColorStop(1, '#0f172a');

      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 26, 0, Math.PI * 2);
      ctx.fillStyle = pivotGrad;
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Swing Arm Aluminum Beam
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(headX, headY);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flexure suspension tip
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(headX - 12, headY);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Read / Write Slider Head
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fillRect(headX - 7, headY - 5, 14, 10);
      ctx.shadowBlur = 0;

      // Magnetic read pulse wave when locked on track
      if (Math.abs(diff) < 0.8) {
        ctx.beginPath();
        ctx.arc(headX, headY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      // 8. Heads-Up Display (HUD) Telemetry Overlay
      ctx.save();
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`ACTUATOR ARM: CYLINDER ${Math.round(armTrackRef.current)}`, 16, 26);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`DISK BOUNDS: [${minTrack} .. ${maxTrack}] | SWEEP: ${direction.toUpperCase()}`, 16, 42);

      if (hoveredTrack !== null) {
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`HOVERED: CYLINDER ${hoveredTrack} (CLICK TO QUEUE)`, 16, 60);
      }

      if (stepDescription) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`STATUS: ${stepDescription}`, 16, canvasHeight - 16);
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [
    currentTrack,
    minTrack,
    maxTrack,
    pendingRequests,
    servicedRequests,
    direction,
    isRotating,
    rpm,
    stepDescription,
    hoveredTrack,
  ]);

  // Handle canvas mouse move to detect hovered cylinder
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const centerX = canvasWidth * 0.45;
    const centerY = canvasHeight * 0.5;
    const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.42;
    const minRadius = maxRadius * 0.22;

    const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    if (dist >= minRadius && dist <= maxRadius) {
      const norm = (dist - minRadius) / (maxRadius - minRadius);
      const track = Math.round(minTrack + norm * (maxTrack - minTrack));
      setHoveredTrack(Math.max(minTrack, Math.min(maxTrack, track)));
    } else {
      setHoveredTrack(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTrack(null);
  };

  // Click on canvas to directly inject request
  const handleCanvasClick = () => {
    if (hoveredTrack !== null && onTrackClick) {
      playReadPulse();
      onTrackClick(hoveredTrack);
    }
  };

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Platter Studio Viewport */}
      <div className="relative flex-1 bg-[#060a12] rounded-xl overflow-hidden border border-cyan-500/20 flex items-center justify-center shadow-inner">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain cursor-crosshair select-none"
        />

        {/* Floating Controls HUD */}
        <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/25 text-xs">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 transition-colors"
            title="Toggle Spindle Motor Rotation"
          >
            <Disc className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            <span className="font-bold">{isRotating ? `${rpm} RPM` : 'MOTOR OFF'}</span>
          </button>

          <span className="text-slate-600">|</span>

          <select
            value={rpm}
            onChange={(e) => setRpm(parseInt(e.target.value, 10))}
            className="bg-transparent text-slate-300 text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="5400" className="bg-slate-900">5400 RPM</option>
            <option value="7200" className="bg-slate-900">7200 RPM</option>
            <option value="10000" className="bg-slate-900">10k RPM</option>
            <option value="15000" className="bg-slate-900">15k RPM</option>
          </select>
        </div>

        {/* User-Friendly Click Help Banner */}
        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-slate-800 text-[10.5px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Click anywhere on platter to queue cylinder request</span>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="mt-3 pt-2 border-t border-cyan-500/10 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
            <span className="text-slate-200 font-semibold">Active Head (CYL {currentTrack})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Pending Requests ({pendingRequests.length})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Serviced ({servicedRequests.length})</span>
          </span>
        </div>

        <div className="text-[11px] text-cyan-400">
          REAL-TIME VOICE COIL SEEK DYNAMICS
        </div>
      </div>
    </div>
  );
}
