import React from 'react';

/**
 * A24PhysicalDisc
 * An authentic physical compact disc directly mirroring the visual craft of a24.raviklaassens.com:
 * - Dark lustrous acrylic / vinyl base with concentric optical grooves
 * - Prismatic holographic sheen (color-dodge conic diffraction)
 * - Translucent spindle hub with mirror chrome clamping ring & center hole
 * - Stark silkscreen typography with drop shadow
 * - Hand-drawn organic SVG ink scribble accent ring dynamically rendered when active
 * 
 * Hardware-Accelerated & Multi-Browser Clean:
 * - Strict GPU geometric circle clipping via clipPath and maskImage to prevent WebKit/Chromium
 *   square corner bleeding artifacts in 3D-transformed and hardware-composited deployment contexts.
 * - Stacking context isolation (isolation: isolate) to avoid blend mode bleed.
 */
export default function A24PhysicalDisc({
  item,
  isActive = false,
  isSpinning = false,
  size = 280, // diameter in px
  onClick,
  showScribble = true,
  showNumberTag = true,
  theme = 'base', // 'base' (light studio) or 'dark' (cinema)
  className = '',
}) {
  const isDark = theme === 'dark';
  const scribbleStroke = isDark ? '#f3f1ea' : '#111116';

  return (
    <div
      onClick={onClick}
      className={`relative select-none cursor-pointer group flex flex-col items-center transition-all duration-500 ${className}`}
      style={{
        width: `${size}px`,
        isolation: 'isolate',
      }}
    >
      {/* Aspect-Ratio Maintained Disc Container */}
      <div
        className="relative"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          isolation: 'isolate',
        }}
      >
        {/* Hand-Drawn Scribble Ring Accent (from a24.raviklaassens.com) */}
        {isActive && showScribble && (
          <div className="absolute -inset-5 pointer-events-none z-20 flex items-center justify-center">
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full animate-scribble"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 160 18 
                   C 232 12, 298 72, 302 152 
                   C 306 232, 244 302, 160 304 
                   C 78 306, 16 240, 18 160 
                   C 20 78, 86 18, 160 18
                   C 202 17, 262 42, 286 86
                   C 306 128, 301 186, 278 232
                   C 248 286, 168 306, 118 290
                   C 58 270, 24 208, 25 148"
                stroke={scribbleStroke}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
              />
            </svg>
          </div>
        )}

        {/* The Outer Shadow Carrier (rounded-full without overflow-hidden so soft shadow spreads naturally) */}
        <div
          className={`w-full h-full rounded-full transition-all duration-500 ease-out group-hover:scale-105`}
          style={{
            boxShadow: isActive
              ? isDark
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.95), 0 0 35px rgba(243, 241, 234, 0.2)'
                : '0 30px 60px -15px rgba(0, 0, 0, 0.45), 0 10px 25px -5px rgba(0, 0, 0, 0.3)'
              : isDark
              ? '0 20px 35px -10px rgba(0, 0, 0, 0.75)'
              : '0 16px 30px -8px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* The Physical Disc Body (Strictly GPU-Clipped to Circle to eliminate WebKit/Chromium square corner bleeding) */}
          <div
            className={`w-full h-full rounded-full relative overflow-hidden border border-[#3a3a46]/50 transition-transform duration-500 ${
              isSpinning ? 'animate-spin-disc' : ''
            }`}
            style={{
              backgroundColor: '#0c0c10',
              clipPath: 'circle(50% at 50% 50%)',
              WebkitClipPath: 'circle(50% at 50% 50%)',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)',
              maskImage: 'radial-gradient(circle, #000 99.5%, transparent 100%)',
              isolation: 'isolate',
            }}
          >
            {/* Layer 1: Concentric Grooves */}
            <div
              className="absolute inset-0 cd-grooves rounded-full opacity-60 pointer-events-none"
              style={{
                clipPath: 'circle(50% at 50% 50%)',
                WebkitClipPath: 'circle(50% at 50% 50%)',
              }}
            />

            {/* Layer 2: Iridescent Holographic Sheen */}
            <div
              className="absolute inset-0 cd-hologram rounded-full mix-blend-color-dodge opacity-75 pointer-events-none transition-opacity duration-300 group-hover:opacity-100"
              style={{
                clipPath: 'circle(50% at 50% 50%)',
                WebkitClipPath: 'circle(50% at 50% 50%)',
              }}
            />

            {/* Layer 3: Contrast Light Wedge Refraction */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-25"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.2) 100%)',
                clipPath: 'circle(50% at 50% 50%)',
                WebkitClipPath: 'circle(50% at 50% 50%)',
              }}
            />

            {/* Layer 4: Silkscreen Artwork & Rim Typography */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
              {/* Top Rim Text */}
              <div className="w-full flex justify-between items-center text-[9px] tracking-[0.2em] uppercase font-mono-tech text-[#f3f1ea]/85 px-4 pt-2">
                <span>{item.matrixCode}</span>
                <span>{item.year}</span>
              </div>

              {/* Central Title Bar Across Disc */}
              <div className="w-full flex flex-col items-center justify-center my-auto px-4 text-center z-10">
                <span className="text-[10px] tracking-[0.3em] font-mono-tech uppercase text-[#f3f1ea]/70 mb-0.5">
                  {item.category}
                </span>
                <h3
                  className="text-4xl md:text-5xl font-tall font-bold tracking-wider text-[#f3f1ea] drop-shadow-md leading-none"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.85)' }}
                >
                  {item.title}
                </h3>
                <span className="text-[10px] font-normal tracking-wide text-[#f3f1ea]/90 mt-1 max-w-[180px] truncate">
                  {item.aka}
                </span>
              </div>

              {/* Bottom Rim Text */}
              <div className="w-full flex justify-between items-center text-[8px] tracking-[0.16em] uppercase font-mono-tech text-[#f3f1ea]/75 px-4 pb-2">
                <span className="max-w-[110px] truncate">{item.category}</span>
                <span>{item.runtime}</span>
              </div>
            </div>

            {/* Layer 5: Disc Center Spindle Assembly */}
            {/* Outer Clear Plastic Ring */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 flex items-center justify-center pointer-events-none"
              style={{
                width: `${size * 0.36}px`,
                height: `${size * 0.36}px`,
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.65) 100%)',
              }}
            >
              {/* Mirror Clamping Ring */}
              <div
                className="rounded-full border border-[#f3f1ea]/40 flex items-center justify-center shadow-inner"
                style={{
                  width: `${size * 0.22}px`,
                  height: `${size * 0.22}px`,
                  background:
                    'conic-gradient(from 180deg, #555, #ccc, #777, #eee, #555)',
                }}
              >
                {/* Center Spindle Hole */}
                <div
                  className="rounded-full bg-[#07070a] border border-[#24242e] shadow-inner"
                  style={{
                    width: `${size * 0.1}px`,
                    height: `${size * 0.1}px`,
                  }}
                />
              </div>
            </div>

            {/* Outer Rim Silver Bevel */}
            <div className="absolute inset-0 rounded-full border-2 border-white/15 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Disc Number Tag below */}
      {showNumberTag && (
        <div className="mt-3 text-center pointer-events-none">
          <span
            className={`text-[11px] font-mono-tech tracking-[0.25em] transition-colors ${
              isDark
                ? 'text-[#8c8b94] group-hover:text-[#f3f1ea]'
                : 'text-[#6b6a72] group-hover:text-[#0d0d11]'
            }`}
          >
            DISC {item.num}
          </span>
        </div>
      )}
    </div>
  );
}
