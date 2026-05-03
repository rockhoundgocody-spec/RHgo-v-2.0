import React, { useCallback, useEffect, useRef } from 'react';
import useReducedMotion from '@/lib/useReducedMotion';
import usePageVisible from '@/lib/usePageVisible';
import useDeviceOrientation from '@/lib/useDeviceOrientation';
import useMousePosition from '@/lib/useMousePosition';

/**
 * DepthWell — creates the illusion that the screen is a recessed 3D well
 * with the orb rising up OUT of it.
 *
 * Pure CSS: stacked concentric rings + perspective shading + parallax tilt
 * driven by SHARED device orientation / mouse listeners (no duplicate
 * window handlers). Skips animation when reduced-motion or tab hidden.
 */
export default function DepthWell({ children }) {
  const ref = useRef(null);
  const targetRef = useRef({ rx: 0, ry: 0 });
  const currentRef = useRef({ rx: 0, ry: 0 });
  const reduceMotion = useReducedMotion();
  const visible = usePageVisible();

  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    targetRef.current.ry = dx * 8;
    targetRef.current.rx = -dy * 8;
  }, []);
  const onOrient = useCallback((e) => {
    if (e.gamma == null || e.beta == null) return;
    targetRef.current.ry = Math.max(-10, Math.min(10, e.gamma / 4));
    targetRef.current.rx = Math.max(-10, Math.min(10, (e.beta - 45) / 4));
  }, []);

  useMousePosition(reduceMotion ? () => {} : onMove);
  useDeviceOrientation(reduceMotion ? () => {} : onOrient);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion || !visible) {
      el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
      return;
    }
    let raf;
    const tick = () => {
      currentRef.current.rx += (targetRef.current.rx - currentRef.current.rx) * 0.08;
      currentRef.current.ry += (targetRef.current.ry - currentRef.current.ry) * 0.08;
      el.style.transform = `perspective(1200px) rotateX(${currentRef.current.rx}deg) rotateY(${currentRef.current.ry}deg)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion, visible]);

  return (
    <div className="relative w-full" style={{ perspective: '1200px' }}>
      {/* The well — stacked recessed rings, going INTO the screen */}
      <div
        ref={ref}
        className="relative mx-auto"
        style={{
          width: 'min(92vw, 460px)',
          height: 'min(92vw, 460px)',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.05s linear',
          willChange: 'transform',
        }}
      >
        {/* deepest dark core — the bottom of the well */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at 50% 55%, hsla(265,70%,4%,1) 0%, hsla(260,80%,7%,0.9) 40%, hsla(255,60%,10%,0.5) 70%, transparent 100%)',
            transform: 'translateZ(-180px)',
            filter: 'blur(8px)',
          }}
        />
        {/* recessed ring shadows — increasing depth */}
        {[0, 1, 2, 3, 4].map((i) => {
          const s = 1 - i * 0.12;
          const z = -40 - i * 28;
          const op = 0.55 - i * 0.08;
          return (
            <div
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-full border"
              style={{
                transform: `translateZ(${z}px) scale(${s})`,
                borderColor: `hsla(280, 60%, ${20 + i * 4}%, ${op})`,
                boxShadow:
                  i === 0
                    ? 'inset 0 12px 30px hsla(265,90%,5%,0.95), inset 0 -8px 24px hsla(280,80%,30%,0.25)'
                    : `inset 0 ${6 + i * 2}px ${16 + i * 4}px hsla(265,90%,5%,0.7)`,
              }}
            />
          );
        })}

        {/* rim light — lip of the well catching glow */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            transform: 'translateZ(8px)',
            background:
              'radial-gradient(circle at 50% 32%, hsla(280,100%,75%,0.18) 0%, transparent 35%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* orb sits ABOVE the well, popping out */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'translateZ(80px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}