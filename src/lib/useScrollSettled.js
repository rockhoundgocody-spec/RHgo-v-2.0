import { useEffect, useState } from 'react';

/**
 * useScrollSettled — returns false while the user is actively scrolling and
 * flips to true after `settleMs` of inactivity. Use this to pause expensive
 * shaders, particle systems, and parallax tilts during scroll, then resume
 * them when the user stops — eliminating jank without sacrificing immersion.
 */
export default function useScrollSettled(settleMs = 180) {
  const [settled, setSettled] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let timer = null;

    const onScroll = () => {
      if (settled) setSettled(false);
      clearTimeout(timer);
      timer = setTimeout(() => setSettled(true), settleMs);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [settleMs, settled]);

  return settled;
}