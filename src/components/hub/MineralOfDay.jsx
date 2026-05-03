import React, { useEffect, useMemo, useRef } from 'react';
import { useEntityList } from '@/lib/useEntityQuery';
import useReducedMotion from '@/lib/useReducedMotion';
import usePageVisible from '@/lib/usePageVisible';

/**
 * MineralOfDay — small companion gem that orbits the main orb daily.
 * Picks a deterministic mineral based on day-of-year, so it's the same
 * for everyone on a given day. Tap → invoke onIdentify(mineral) so the
 * orb voices it.
 */
export default function MineralOfDay({ onIdentify, active }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = usePageVisible();
  const { data: all } = useEntityList('Mineral');

  const mineral = useMemo(() => {
    if (!all?.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return all[day % all.length];
  }, [all]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion || !visible) {
      const r = 145;
      const x = Math.cos(1.6) * r;
      const y = Math.sin(1.6) * r * 0.5;
      el.style.transform = `translate3d(${x}px, ${y}px, 90px) scale(${active ? 1.15 : 1})`;
      return;
    }
    let raf;
    const tick = () => {
      const t = performance.now() * 0.0004;
      const r = 145;
      const x = Math.cos(t + 1.6) * r;
      const y = Math.sin(t + 1.6) * r * 0.5;
      el.style.transform = `translate3d(${x}px, ${y}px, 90px) scale(${active ? 1.15 : 1})`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [active, reduceMotion, visible]);

  if (!mineral) return null;

  return (
    <button
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onIdentify?.(mineral); }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 group"
      style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
      title={`Mineral of the day: ${mineral.name}`}
    >
      <div
        className="w-14 h-14 rounded-full border border-amethyst-glow/50 flex items-center justify-center backdrop-blur-md transition-transform group-hover:scale-110"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsla(50,100%,75%,0.45) 0%, hsla(280,80%,50%,0.45) 55%, hsla(265,85%,15%,0.6) 100%)',
          boxShadow:
            '0 0 28px hsla(280,100%,60%,0.6), 0 0 60px hsla(50,100%,60%,0.25), inset 0 0 18px hsla(0,0%,100%,0.25)',
        }}
      >
        {mineral.image_url ? (
          <img src={mineral.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <span className="text-white text-xl glow-amethyst">◈</span>
        )}
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-[0.25em] text-amber-200/80 whitespace-nowrap">
        Daily · {mineral.name}
      </div>
    </button>
  );
}