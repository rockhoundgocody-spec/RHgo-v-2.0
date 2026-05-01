import React, { useEffect, useRef } from 'react';

/**
 * TiltContainer — applies subtle 3D parallax to children based on pointer
 * or device orientation. Used to wrap mission cards and stat strip so the
 * whole Hub feels like one recessed control surface.
 */
export default function TiltContainer({ children, max = 5, className = '' }) {
  const ref = useRef(null);
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      target.current.ry = ((e.clientX - cx) / rect.width) * max;
      target.current.rx = -((e.clientY - cy) / rect.height) * max;
    };
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null) return;
      target.current.ry = Math.max(-max, Math.min(max, e.gamma / 8));
      target.current.rx = Math.max(-max, Math.min(max, (e.beta - 45) / 8));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('deviceorientation', onOrient);
    let raf;
    const tick = () => {
      current.current.rx += (target.current.rx - current.current.rx) * 0.07;
      current.current.ry += (target.current.ry - current.current.ry) * 0.07;
      el.style.transform = `perspective(1400px) rotateX(${current.current.rx}deg) rotateY(${current.current.ry}deg)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('deviceorientation', onOrient);
      cancelAnimationFrame(raf);
    };
  }, [max]);

  return (
    <div className={className} style={{ perspective: '1400px' }}>
      <div ref={ref} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
        {children}
      </div>
    </div>
  );
}