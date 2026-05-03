import { useEffect } from 'react';

/**
 * Singleton mouse-position broadcaster. Multiple components can listen
 * without each installing its own window mousemove listener.
 */
const subscribers = new Set();
let installed = false;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  let raf = null;
  let lastE = null;
  const flush = () => {
    raf = null;
    if (lastE) subscribers.forEach((cb) => cb(lastE));
  };
  window.addEventListener('mousemove', (e) => {
    lastE = e;
    if (raf == null) raf = requestAnimationFrame(flush);
  }, { passive: true });
}

export default function useMousePosition(cb) {
  useEffect(() => {
    install();
    subscribers.add(cb);
    return () => subscribers.delete(cb);
  }, [cb]);
}