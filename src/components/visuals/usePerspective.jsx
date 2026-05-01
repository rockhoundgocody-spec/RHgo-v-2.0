import { useEffect, useRef } from 'react';

/**
 * Tracks viewer perspective for stereoscopic 4D effect.
 * Returns refs that update each frame with normalized (-1..1) x/y offset
 * based on cursor position (desktop) or device tilt (mobile).
 *
 * Inspired by After Effects stereoscopic 3D camera offset:
 * https://helpx.adobe.com/after-effects/kb/stereoscopic-3d-effects.html
 */
export function usePerspective() {
  const xRef = useRef(0);
  const yRef = useRef(0);
  const targetX = useRef(0);
  const targetY = useRef(0);

  useEffect(() => {
    const handleMouse = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // -1..1 range, centered
      targetX.current = (e.clientX / w) * 2 - 1;
      targetY.current = (e.clientY / h) * 2 - 1;
    };

    const handleOrient = (e) => {
      // gamma = left-right tilt (-90..90), beta = front-back (-180..180)
      if (e.gamma == null || e.beta == null) return;
      targetX.current = Math.max(-1, Math.min(1, e.gamma / 30));
      targetY.current = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('deviceorientation', handleOrient, { passive: true });

    let raf;
    const tick = () => {
      // smooth easing toward target
      xRef.current += (targetX.current - xRef.current) * 0.08;
      yRef.current += (targetY.current - yRef.current) * 0.08;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('deviceorientation', handleOrient);
      cancelAnimationFrame(raf);
    };
  }, []);

  return { xRef, yRef };
}