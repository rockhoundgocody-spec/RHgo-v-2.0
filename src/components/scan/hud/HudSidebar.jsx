import React from 'react';

/**
 * HudSidebar — vertical strip with axis ticks + readouts.
 * Decorative; lives at the left/right edges of the scanner viewport.
 */
export default function HudSidebar({ side = 'left', label = 'Y·AXIS' }) {
  const isLeft = side === 'left';
  return (
    <div
      className={`absolute top-0 bottom-0 ${isLeft ? 'left-0' : 'right-0'} flex flex-col items-center justify-between py-6`}
      style={{ width: 22 }}
    >
      {/* label */}
      <div
        className="text-[8px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70"
        style={{
          writingMode: 'vertical-rl',
          transform: isLeft ? 'rotate(180deg)' : 'none',
        }}
      >
        {label}
      </div>

      {/* tick column */}
      <div className="flex-1 flex flex-col justify-around items-center w-full py-2">
        {Array.from({ length: 12 }).map((_, i) => {
          const major = i % 3 === 0;
          return (
            <div
              key={i}
              className="flex items-center gap-1"
              style={{ flexDirection: isLeft ? 'row' : 'row-reverse' }}
            >
              <div
                style={{
                  width: major ? 8 : 4,
                  height: 1,
                  background: 'hsla(195,100%,60%,0.6)',
                  boxShadow: '0 0 4px hsla(195,100%,60%,0.4)',
                }}
              />
              {major && (
                <div className="text-[7px] font-mono text-hud-cyan/50">
                  {String(i * 8).padStart(2, '0')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* end cap */}
      <div className="text-[7px] font-mono text-hud-cyan/40">·{isLeft ? '01' : '02'}·</div>
    </div>
  );
}