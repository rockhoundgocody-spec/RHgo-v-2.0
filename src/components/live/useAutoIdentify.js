import { useEffect, useRef } from 'react';

/**
 * While a glasses stream is live, run an AI identification every few seconds so
 * viewers get a rolling live ID feed without the host tapping anything.
 */
export default function useAutoIdentify({ active, identifyNow, intervalMs = 15000 }) {
  const fnRef = useRef(identifyNow);
  fnRef.current = identifyNow;

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => { fnRef.current?.(); }, intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs]);
}