import React, { useEffect, useRef } from 'react';

/**
 * Subtle animated caustic shimmer suggesting refracted light bouncing
 * around the inside of a glass sphere. Drifts with mouse parallax to
 * sell volumetric depth.
 */
export default function InnerCaustic() {
  const ref = useRef(null);

  useEffect(() => {
    let raf;
    const onMove = (e) => {
      if (!ref.current) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      ref.current.dataset.px = x;
      ref.current.dataset.py = y;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      const t = performance.now() * 0.0006;
      if (ref.current) {
        const px = parseFloat(ref.current.dataset.px || '0');
        const py = parseFloat(ref.current.dataset.py || '0');
        // counter-parallax — caustic moves opposite to viewer (refraction cue)
        const tx = -px * 8 + Math.sin(t * 1.3) * 4;
        const ty = -py * 6 + Math.cos(t * 1.1) * 4;
        ref.current.style.transform = `translate(${tx}px, ${ty}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none mix-blend-screen rounded-full"
      style={{
        willChange: 'transform',
        background:
          'radial-gradient(ellipse 40% 30% at 30% 30%, hsla(280,100%,80%,0.18) 0%, transparent 70%), radial-gradient(ellipse 25% 20% at 65% 60%, hsla(195,100%,70%,0.12) 0%, transparent 70%)',
      }}
    />
  );
}