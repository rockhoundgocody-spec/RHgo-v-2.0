import { useRef, useEffect, useCallback } from 'react';

/**
 * useLiquidInteraction — tracks pointer position, velocity, and scroll
 * across the whole screen so the orb can react fluidly to user interaction.
 *
 * Returns { getInteraction, injectTap }.
 *   getInteraction() — read-only snapshot the orb consumes each frame:
 *     { pointerX, pointerY, velocity, scrollV, tapImpulse, tapClientX, tapClientY }
 *   injectTap(clientX, clientY) — fire a liquid squish impulse (call on orb tap)
 *
 * Values decay naturally inside the orb's existing RAF tick (no extra loops).
 */
export default function useLiquidInteraction() {
  const state = useRef({
    pointerX: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    pointerY: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    velocity: 0,
    scrollV: 0,
    tapImpulse: 0,
    tapClientX: 0,
    tapClientY: 0,
  });
  const lastPointer = useRef({ x: 0, y: 0, t: 0 });
  const lastScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now();
      const dt = Math.max(1, now - lastPointer.current.t);
      const ddx = e.clientX - lastPointer.current.x;
      const ddy = e.clientY - lastPointer.current.y;
      const speed = (Math.sqrt(ddx * ddx + ddy * ddy) / dt) * 16;
      state.current.velocity = Math.min(1, speed / 15);
      state.current.pointerX = e.clientX;
      state.current.pointerY = e.clientY;
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now };
    };

    const onScroll = () => {
      const dy = window.scrollY - lastScrollY.current;
      lastScrollY.current = window.scrollY;
      state.current.scrollV = Math.max(-1, Math.min(1, dy / 25));
    };

    // Touchstarted anywhere — a gentle attention nudge toward the touch point
    const onDown = (e) => {
      state.current.pointerX = e.clientX;
      state.current.pointerY = e.clientY;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointerdown', onDown);
    };
  }, []);

  const injectTap = useCallback((clientX, clientY) => {
    state.current.tapImpulse = 1;
    state.current.tapClientX = clientX;
    state.current.tapClientY = clientY;
  }, []);

  const getInteraction = useCallback(() => state.current, []);

  return { getInteraction, injectTap };
}