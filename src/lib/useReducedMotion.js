import { useEffect, useState } from 'react';

/**
 * Respects user's `prefers-reduced-motion` setting AND auto-detects
 * low-power devices (low-mem mobile, deviceMemory < 4, hardwareConcurrency < 4).
 * Returns true → skip heavy animations / GPU shaders.
 */
export default function useReducedMotion() {
  const [reduce, setReduce] = useState(() => detectInitial());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduce(detectInitial());
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  return reduce;
}

function detectInitial() {
  if (typeof window === 'undefined') return false;
  const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (mq?.matches) return true;
  // Heuristic for low-power devices
  const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
  const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const saveData = navigator.connection?.saveData;
  return !!(lowMem || lowCores || saveData);
}