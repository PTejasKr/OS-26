import React from 'react';

/**
 * BentoCard
 * Refined editorial bento card component tailored to the A24 design language:
 * - Adapts seamlessly to Light Studio (#f5f4ef) and Dark Cinema (#0c0c12) modes
 * - Architectural hairline borders (border-[#0d0d11]/15 or border-[#24242e])
 * - Bebas Neue tall headers, Instrument Serif italic subtitles, and JetBrains Mono badges
 */
export default function BentoCard({
  title,
  subtitle,
  badge,
  badgeColor = 'default',
  icon: Icon,
  children,
  className = '',
  headerAction,
  theme,
}) {
  const isDark =
    theme === 'dark' ||
    (theme === undefined &&
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark');

  return (
    <div
      className={`relative group border p-6 transition-colors duration-300 flex flex-col ${
        isDark
          ? 'bg-[#0c0c12] border-[#24242e] text-[#f3f1ea]'
          : 'bg-[#f5f4ef] border-[#0d0d11]/15 text-[#0d0d11]'
      } ${className}`}
    >
      {/* Editorial Card Header */}
      {(title || badge || Icon || headerAction) && (
        <div
          className={`flex items-center justify-between pb-4 mb-5 border-b gap-4 flex-wrap ${
            isDark ? 'border-[#24242e]' : 'border-[#0d0d11]/15'
          }`}
        >
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            {Icon && (
              <div
                className={`w-10 h-10 flex items-center justify-center p-2.5 border transition-colors shrink-0 mt-0.5 ${
                  isDark
                    ? 'border-[#24242e] bg-[#14141c] text-[#f3f1ea]'
                    : 'border-[#0d0d11]/20 bg-white text-[#0d0d11]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                {title && (
                  <h3 className="font-tall text-xl sm:text-2xl font-bold uppercase tracking-wide leading-tight break-words">
                    {title}
                  </h3>
                )}
                {badge && (
                  <span
                    className={`font-mono-tech text-[10px] uppercase tracking-[0.18em] px-2.5 py-0.5 border font-semibold shrink-0 mt-0.5 ${
                      isDark
                        ? 'border-[#24242e] bg-[#14141c] text-[#8c8b94]'
                        : 'border-[#0d0d11]/20 bg-white text-[#6b6a72]'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && (
                <p
                  className={`text-[14px] font-normal mt-0.5 ${
                    isDark ? 'text-[#8c8b94]' : 'text-[#6b6a72]'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
