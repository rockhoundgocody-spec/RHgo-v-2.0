import { useEffect, useRef } from 'react';

/**
 * useHaptic — mirrors orb amplitude as soft device vibration when supported.
 * Throttled to once every ~250ms; only fires if amplitude > threshold.
 * No-op on devices without navigator.vibrate.
 */
export default function useHaptic({ active, getAmplitude }) {
  const lastRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    let raf;
    const tick = () => {
      const amp = getAmplitude ? getAmplitude() || 0 : 0;
      const now = performance.now();
      if (amp > 0.45 && now - lastRef.current > 250) {
        const ms = Math.min(40, Math.round(amp * 50));
        try { navigator.vibrate(ms); } catch {}
        lastRef.current = now;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      try { navigator.vibrate(0); } catch {}
    };
  }, [active, getAmplitude]);
}