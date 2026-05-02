import React from 'react';
import { Check } from 'lucide-react';

/**
 * AngleGuide — shows progress of multi-angle capture. Each angle is a
 * small node around the perimeter of a circle. Captured nodes glow green.
 */
export default function AngleGuide({ angles, currentIndex }) {
  const radius = 58;
  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-amethyst/70">
          Angle {currentIndex + 1}/{angles.length}
        </div>
        <div className="text-white text-sm font-semibold mt-1 max-w-[100px] leading-tight">
          {angles[currentIndex]?.label}
        </div>
      </div>

      {/* orbital ring */}
      <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="hsla(280,60%,50%,0.25)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      </svg>

      {/* angle nodes */}
      {angles.map((a, i) => {
        const angle = (i / angles.length) * Math.PI * 2 - Math.PI / 2;
        const x = 80 + Math.cos(angle) * radius;
        const y = 80 + Math.sin(angle) * radius;
        const captured = a.captured;
        const current = i === currentIndex;
        return (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{ left: x, top: y }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: captured
                  ? 'radial-gradient(circle, hsl(145 90% 55%), hsl(145 90% 30%))'
                  : current
                    ? 'radial-gradient(circle, hsl(280 100% 70%), hsl(265 80% 35%))'
                    : 'hsla(220,40%,8%,0.7)',
                border: `1px solid ${captured ? 'hsl(145 90% 60%)' : current ? 'hsl(280 100% 75%)' : 'hsla(280,40%,50%,0.4)'}`,
                boxShadow: current
                  ? '0 0 14px hsla(280,100%,65%,0.7)'
                  : captured
                    ? '0 0 8px hsla(145,90%,55%,0.5)'
                    : 'none',
              }}
            >
              {captured && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}