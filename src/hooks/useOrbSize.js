import { useEffect, useState } from 'react';

// Dominant hero: Clover fills most of the available center space.
function compute(isDesktop) {
  const w = window.innerWidth, h = window.innerHeight;
  if (isDesktop) return Math.round(Math.min((w - 300) * 0.7, (h - 260) * 0.85, 560));
  const railSpace = w >= 768 ? 200 : 0;
  return Math.round(Math.min((w - railSpace) * 0.82, (h - 180) * 0.7, 520));
}

export default function useOrbSize(isDesktop) {
  const [size, setSize] = useState(() => compute(isDesktop));
  useEffect(() => {
    const on = () => setSize(compute(isDesktop));
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [isDesktop]);
  return size;
}