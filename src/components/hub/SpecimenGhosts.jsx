import React, { useEffect, useMemo, useRef } from 'react';
import { useEntityList } from '@/lib/useEntityQuery';
import useReducedMotion from '@/lib/useReducedMotion';
import usePageVisible from '@/lib/usePageVisible';

/**
 * SpecimenGhosts — translucent 3D-feeling crystal silhouettes that
 * orbit and drift around the orb at varying parallax depths. Pulled
 * from user's actual Specimen collection (or fallback gem icons).
 *
 * Pure CSS transforms — no WebGL. Uses requestAnimationFrame for orbit math.
 */
const FALLBACK = [
  { name: 'Quartz', glyph: '◆' },
  { name: 'Amethyst', glyph: '◈' },
  { name: 'Pyrite', glyph: '◇' },
  { name: 'Tourmaline', glyph: '◉' },
  { name: 'Opal', glyph: '⬡' },
];

export default function SpecimenGhosts({ active, onTap }) {
  const containerRef = useRef(null);
  const { data: list } = useEntityList('Specimen', '-created_date');

  const ghosts = useMemo(() => {
    const top = (list || []).slice(0, 4);
    if (!top.length) return FALLBACK.slice(0, 4);
    return top.map((s, i) => ({
      name: s.mineral_name || s.common_name || 'Specimen',
      glyph: FALLBACK[i % FALLBACK.length].glyph,
      image: s.image_url,
    }));
  }, [list]);

  if (!ghosts.length) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" aria-hidden>
      {ghosts.map((g, i) => (
        <Ghost key={`${g.name}-${i}`} ghost={g} index={i} total={ghosts.length} active={active} onTap={onTap} />
      ))}
    </div>
  );
}

function Ghost({ ghost, index, total, active, onTap }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const visible = usePageVisible();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const baseAngle = (index / total) * Math.PI * 2;
    const radius = 195 + (index % 3) * 14;
    const depth = (index % 3) - 1;
    const speed = 0.00012 + (index % 4) * 0.00004;
    // Reduced-motion: pin to a static orbital position; no rAF loop
    if (reduceMotion || !visible) {
      const x = Math.cos(baseAngle) * radius;
      const y = Math.sin(baseAngle) * radius * 0.55;
      const z = depth * 60;
      const scale = 0.8 + depth * 0.18;
      const opacity = active ? 0.55 + depth * 0.15 : 0.22 + depth * 0.08;
      el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      return;
    }
    let raf;
    const tick = () => {
      const t = performance.now();
      const a = baseAngle + t * speed;
      const x = Math.cos(a) * radius;
      const y = Math.sin(a) * radius * 0.55; // ellipse — feels like orbit on tilted plane
      const z = depth * 60 + Math.sin(t * 0.0008 + index) * 18;
      const scale = 0.8 + depth * 0.18;
      const opacity = active ? 0.55 + depth * 0.15 : 0.22 + depth * 0.08;
      el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) scale(${scale})`;
      el.style.opacity = String(opacity);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [index, total, active, reduceMotion, visible]);

  return (
    <button
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onTap?.(ghost); }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      style={{
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
      }}
      title={ghost.name}
    >
      <div
        className="w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border border-amethyst-glow/30"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, hsla(280,100%,75%,0.35) 0%, hsla(265,80%,40%,0.25) 50%, transparent 80%)',
          boxShadow: '0 0 18px hsla(280,100%,60%,0.4), inset 0 0 12px hsla(280,100%,80%,0.25)',
        }}
      >
        {ghost.image ? (
          <img src={ghost.image} alt="" className="w-7 h-7 rounded-full object-cover opacity-80" />
        ) : (
          <span className="text-amethyst-glow text-base glow-amethyst">{ghost.glyph}</span>
        )}
      </div>
    </button>
  );
}