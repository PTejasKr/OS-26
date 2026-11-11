"use client";

// Halftone Wordmark Footer — a site footer whose wordmark is set enormous and
// cropped by the bottom edge, printed as a field of halftone dots. Each dot is
// sized by how much of the letter covers its cell, so the type keeps its edges
// at any scale. Move across it and the dots part around the pointer on springs,
// warming in colour as they are pushed off their place; click and a shock ring
// runs through the word. Above it sit the studio line, tracked link columns and
// a back-to-top, separated by a hairline, all over a fine print grain.
//
// One file, React only. A 2D canvas for the dots and the grain, real anchors
// for the links. Every rule in the scoped <style> is .hwf- prefixed and nothing
// is fetched: the faces come from the host page or the fallback stacks.

import * as React from "react";

const PRESETS = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
};

const DEFAULT_COLUMNS = [
  {
    title: "Algorithms",
    links: [
      { label: "SCAN / Elevator", href: "#catalog" },
      { label: "C-SCAN Unidirectional", href: "#catalog" },
      { label: "LOOK & C-LOOK", href: "#catalog" },
      { label: "SSTF Greedy", href: "#catalog" },
      { label: "FCFS Sequential", href: "#catalog" },
    ],
  },
  {
    title: "Studios",
    links: [
      { label: "File Allocation", href: "#studios" },
      { label: "Buffer Cache", href: "#studios" },
      { label: "ASCII Blueprint", href: "#studios" },
      { label: "Hardware Physics", href: "#" },
    ],
  },
  {
    title: "Archive",
    links: [
      { label: "Physical 3D Platter", href: "#" },
      { label: "Mathematical Proofs", href: "#" },
      { label: "A24 Disc Crate", href: "#" },
      { label: "IEEE OS Standards", href: "#" },
    ],
  },
];

const SANS_STACK =
  '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif';
const MONO_STACK =
  '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace';

// #region halftone
// Pure helpers

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
export function hwfHex(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h =
    m[1].length === 3
      ? m[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : m[1];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
export function hwfRadius(coverage, gap) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
  return Math.sqrt(c) * gap * 0.56;
}

/**
 * One step of a dot's spring back to home, plus the push from a pointer at
 * (px, py) within radius r. Returns [x, y, vx, vy].
 * Tuned for 2x scatter area and 5x slower reassembly time with ultra-smooth float return.
 */
export function hwfStep(x, y, vx, vy, hx, hy, px, py, r) {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    // Impulse and falloff for wide scatter area
    const f = Math.pow(1 - d / r, 1.2) * 5.2;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  // Soft spring constant (~0.0038 vs 0.019) with 0.965 damping
  // slows down particle return by 5x into a mesmerizing slow-motion float
  vx = (vx + (hx - x) * 0.0038) * 0.965;
  vy = (vy + (hy - y) * 0.0038) * 0.965;
  return [x + vx, y + vy, vx, vy];
}

/** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
export function hwfWarmth(x, y, hx, hy, span) {
  const d = Math.hypot(x - hx, y - hy);
  return span > 0 ? Math.min(1, d / span) : 0;
}

/** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
export function hwfFitSize(measured, width) {
  return measured > 0 ? (width / measured) * 100 : 0;
}

// Cache the 256x256 grain tile once per session rather than regenerating 65k random pixels on resize/theme change.
let sharedGrainTile = null;
function getGrainTile() {
  if (sharedGrainTile || typeof document === "undefined") return sharedGrainTile;
  const tile = document.createElement("canvas");
  tile.width = 256;
  tile.height = 256;
  const g = tile.getContext("2d");
  if (g) {
    const id = g.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
      id.data[i + 3] = Math.random() < 0.5 ? 0 : 255;
    }
    g.putImageData(id, 0, 0);
  }
  sharedGrainTile = tile;
  return sharedGrainTile;
}
// #endregion

const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: var(--hwf-bg); color: var(--hwf-ink); -webkit-font-smoothing: antialiased;
  transition: background-color .5s cubic-bezier(.4, 0, .2, 1), color .5s cubic-bezier(.4, 0, .2, 1);
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
  gap: 24px; padding: clamp(22px, 3.4vw, 40px) clamp(20px, 3.4vw, 44px) 0;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase; line-height: 1.75;
}
.hwf-brand strong { display: block; font-weight: 500; }
.hwf-brand span { opacity: .45; }
.hwf-col h3 { margin: 0; font: inherit; opacity: .4; font-weight: 500; }
.hwf-col ul { list-style: none; margin: 0; padding: 0; }
.hwf-col a, .hwf-up {
  color: inherit; text-decoration: none; opacity: .78; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
.hwf-col a:hover, .hwf-up:hover { opacity: 1; background-size: 100% 1px; }
.hwf-col a:focus-visible, .hwf-up:focus-visible { outline: 1px solid currentColor; outline-offset: 3px; opacity: 1; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: flex-end; align-items: center; gap: 16px;
  margin: clamp(18px, 2.6vw, 30px) clamp(20px, 3.4vw, 44px) 0; padding-top: 12px;
  border-top: none;
  font-family: var(--hwf-mono); font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
}
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 720px) {
  .hwf-top { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); row-gap: 18px; }
  .hwf-brand { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-col a, .hwf-up { transition: none; }
}
`;

const rgbStr = (c) =>
  `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

const HalftoneWordmarkFooter = React.memo(function HalftoneWordmarkFooter({
  wordmark = "OS/26",
  label = "OS/26",
  meta = "THE PHYSICAL STORAGE ALGORITHM ARCHIVE · 2026",
  columns = [],
  backToTop = true,
  preset = "night",
  palette,
  dotGap = 6,
  radius = 80,
  crop = 0.2,
  grain = 0.5,
  interactive = true,
  fontFamily = SANS_STACK,
  fontWeight = 800,
  monoFamily = MONO_STACK,
  height = "560px",
  className = "",
}) {
  const colors = { ...(PRESETS[preset] || PRESETS.night), ...(palette || {}) };
  const rootRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const wakeRef = React.useRef(() => {});

  const initialBg = hwfHex(colors.background) || [12, 12, 11];
  const initialInk = hwfHex(colors.ink) || [233, 228, 218];
  const initialWarm = hwfHex(colors.warm) || [233, 118, 43];

  const colorStateRef = React.useRef({
    currBg: initialBg,
    currInk: initialInk,
    currWarm: initialWarm,
    fromBg: initialBg,
    fromInk: initialInk,
    fromWarm: initialWarm,
    targetBg: initialBg,
    targetInk: initialInk,
    targetWarm: initialWarm,
    animStart: -1,
  });

  const opts = React.useRef({
    colors,
    dotGap,
    radius,
    crop,
    grain,
    interactive,
    fontFamily,
    fontWeight,
    wordmark,
  });
  opts.current = {
    colors,
    dotGap,
    radius,
    crop,
    grain,
    interactive,
    fontFamily,
    fontWeight,
    wordmark,
  };

  // Only geometric props require re-measuring text and regenerating the dot field.
  // Theme color updates happen in-place without stalling the main thread or calling getImageData().
  const layoutKey = [
    wordmark,
    dotGap,
    crop,
    fontFamily,
    fontWeight,
  ].join("|");

  React.useEffect(() => {
    const cs = colorStateRef.current;
    const nextBg = hwfHex(colors.background) || [12, 12, 11];
    const nextInk = hwfHex(colors.ink) || [233, 228, 218];
    const nextWarm = hwfHex(colors.warm) || [233, 118, 43];

    const same =
      cs.targetBg[0] === nextBg[0] &&
      cs.targetBg[1] === nextBg[1] &&
      cs.targetBg[2] === nextBg[2] &&
      cs.targetInk[0] === nextInk[0] &&
      cs.targetInk[1] === nextInk[1] &&
      cs.targetInk[2] === nextInk[2] &&
      cs.targetWarm[0] === nextWarm[0] &&
      cs.targetWarm[1] === nextWarm[1] &&
      cs.targetWarm[2] === nextWarm[2];
    if (same) return;

    cs.fromBg = [cs.currBg[0], cs.currBg[1], cs.currBg[2]];
    cs.fromInk = [cs.currInk[0], cs.currInk[1], cs.currInk[2]];
    cs.fromWarm = [cs.currWarm[0], cs.currWarm[1], cs.currWarm[2]];
    cs.targetBg = nextBg;
    cs.targetInk = nextInk;
    cs.targetWarm = nextWarm;
    cs.animStart = performance.now();
    wakeRef.current();
  }, [colors.background, colors.ink, colors.warm]);

  React.useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let awake = true;
    let ring = { x: 0, y: 0, t: -1 };
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0);
    let warmIdx = new Uint32Array(0);
    let warmK = new Float32Array(0);
    let count = 0;
    let grainPattern = null;

    const layout = () => {
      const o = opts.current;
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Set the word once, at a size that fills the width, on a 1x mask.
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return;
      const face = o.fontWeight + " 100px " + o.fontFamily;
      m.font = face;
      const word = o.wordmark || " ";
      const fit = hwfFitSize(m.measureText(word).width, w * 1.02);
      m.font = o.fontWeight + " " + fit + "px " + o.fontFamily;
      const box = m.measureText(word);
      const cap = box.actualBoundingBoxAscent || fit * 0.72;
      const c = Math.max(0, Math.min(0.6, o.crop));
      m.fillStyle = "#000";
      m.textBaseline = "alphabetic";
      m.fillText(word, (w - box.width) / 2, h + cap * c);
      const img = m.getImageData(0, 0, w, h).data;

      const gap = Math.max(3, o.dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const tmp = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3×3 sample of the cell.
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(
                w - 1,
                Math.floor(gx * gap + ((sx + 0.5) * gap) / 3)
              );
              const y = Math.min(
                h - 1,
                Math.floor(gy * gap + ((sy + 0.5) * gap) / 3)
              );
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          const cov = sum / (9 * 255);
          if (cov < 0.06) continue;
          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap));
        }
      }
      dots = new Float32Array(tmp);
      count = tmp.length / 7;
      warmIdx = new Uint32Array(count);
      warmK = new Float32Array(count);

      // Reuse shared grain tile and cache the CanvasPattern once per context layout.
      const tile = getGrainTile();
      grainPattern = tile ? ctx.createPattern(tile, "repeat") : null;
      awake = true;
    };

    const draw = (now) => {
      const o = opts.current;
      const cs = colorStateRef.current;

      // Smoothly track color crossfade synced with the site's 500ms theme transition.
      let colorTransitioning = false;
      if (cs.animStart >= 0) {
        const rawT = reduced ? 1 : Math.min(1, Math.max(0, (now - cs.animStart) / 500));
        if (rawT >= 1) {
          cs.currBg = [cs.targetBg[0], cs.targetBg[1], cs.targetBg[2]];
          cs.currInk = [cs.targetInk[0], cs.targetInk[1], cs.targetInk[2]];
          cs.currWarm = [cs.targetWarm[0], cs.targetWarm[1], cs.targetWarm[2]];
          cs.animStart = -1;
        } else {
          // Matches CSS cubic-bezier(0.4, 0, 0.2, 1) feel cleanly
          const t =
            rawT < 0.5
              ? 4 * rawT * rawT * rawT
              : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
          cs.currBg[0] = cs.fromBg[0] + (cs.targetBg[0] - cs.fromBg[0]) * t;
          cs.currBg[1] = cs.fromBg[1] + (cs.targetBg[1] - cs.fromBg[1]) * t;
          cs.currBg[2] = cs.fromBg[2] + (cs.targetBg[2] - cs.fromBg[2]) * t;
          cs.currInk[0] = cs.fromInk[0] + (cs.targetInk[0] - cs.fromInk[0]) * t;
          cs.currInk[1] = cs.fromInk[1] + (cs.targetInk[1] - cs.fromInk[1]) * t;
          cs.currInk[2] = cs.fromInk[2] + (cs.targetInk[2] - cs.fromInk[2]) * t;
          cs.currWarm[0] = cs.fromWarm[0] + (cs.targetWarm[0] - cs.fromWarm[0]) * t;
          cs.currWarm[1] = cs.fromWarm[1] + (cs.targetWarm[1] - cs.fromWarm[1]) * t;
          cs.currWarm[2] = cs.fromWarm[2] + (cs.targetWarm[2] - cs.fromWarm[2]) * t;
          colorTransitioning = true;
        }
      }

      const ink = cs.currInk;
      const warm = cs.currWarm;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colorTransitioning ? rgbStr(cs.currBg) : o.colors.background;
      ctx.fillRect(0, 0, w, h);

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0;
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = ringAge * 0.9;
      let moving = false;
      let warmCount = 0;

      // Batch all resting dots into a single canvas fill path for >10x faster 2D canvas draws.
      ctx.fillStyle = colorTransitioning ? rgbStr(ink) : o.colors.ink;
      ctx.beginPath();

      for (let i = 0; i < count; i++) {
        const j = i * 7;
        let x = dots[j];
        let y = dots[j + 1];
        let vx = dots[j + 2];
        let vy = dots[j + 3];
        const hx = dots[j + 4];
        const hy = dots[j + 5];
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x;
            const dy = hy - ring.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }
          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r);
          x = s[0];
          y = s[1];
          vx = s[2];
          vy = s[3];
          if (
            Math.abs(vx) + Math.abs(vy) > 0.005 ||
            Math.abs(x - hx) + Math.abs(y - hy) > 0.02
          )
            moving = true;
          else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }
          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }
        const k = hwfWarmth(x, y, hx, hy, 28);
        if (k > 0.02) {
          warmIdx[warmCount] = j;
          warmK[warmCount] = k;
          warmCount++;
        } else {
          const rad = dots[j + 6];
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, 6.2832);
        }
      }
      ctx.fill();

      // Draw only actively displaced warm dots individually.
      for (let wIdx = 0; wIdx < warmCount; wIdx++) {
        const j = warmIdx[wIdx];
        const k = warmK[wIdx];
        ctx.fillStyle =
          "rgb(" +
          Math.round(ink[0] + (warm[0] - ink[0]) * k) +
          "," +
          Math.round(ink[1] + (warm[1] - ink[1]) * k) +
          "," +
          Math.round(ink[2] + (warm[2] - ink[2]) * k) +
          ")";
        ctx.beginPath();
        ctx.arc(dots[j], dots[j + 1], dots[j + 6], 0, 6.2832);
        ctx.fill();
      }

      if (grainPattern && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }
      // Sleep once everything is home, nothing is pushing, and color transition completed.
      awake = moving || colorTransitioning || ringAge < 900 || px > -1e4;
    };

    const loop = (now) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };
    wakeRef.current = wake;

    const toLocal = (e) => {
      const b = canvas.getBoundingClientRect();
      return [e.clientX - b.left, e.clientY - b.top];
    };
    const onMove = (e) => {
      if (!opts.current.interactive) return;
      const p = toLocal(e);
      px = p[0];
      py = p[1];
      wake();
    };
    const onLeave = () => {
      px = -1e5;
      py = -1e5;
      wake();
    };
    const onDown = (e) => {
      if (!opts.current.interactive || reduced) return;
      if (e.target && e.target.closest && e.target.closest("a,button")) return;
      const p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);
    // A web font that lands late re-sets the word in its real face.
    let alive = true;
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return;
        layout();
        wake();
      });
    }

    return () => {
      alive = false;
      wakeRef.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, [layoutKey]);

  const toTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      ref={rootRef}
      className={"hwf-root " + className}
      style={{
        height,
        "--hwf-bg": colors.background,
        "--hwf-ink": colors.ink,
        "--hwf-mono": monoFamily,
      }}
    >
      <style>{HWF_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns && columns.length > 0 && columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href || "#"}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        {backToTop ? (
          <button type="button" className="hwf-up" onClick={toTop}>
            Back to top ↑
          </button>
        ) : null}
      </div>
    </footer>
  );
});

export default HalftoneWordmarkFooter;
