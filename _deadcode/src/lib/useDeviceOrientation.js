import { useEffect } from 'react';

/**
 * Singleton device-orientation broadcaster — multiple listeners share a
 * SINGLE window listener. Avoids stacking expensive sensor handlers
 * (DepthWell + CompassRing previously each had their own).
 */
const subscribers = new Set();
let installed = false;
let lastEvent = null;

function install() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const handler = (e) => {
    lastEvent = e;
    subscribers.forEach((cb) => cb(e));
  };
  window.addEventListener('deviceorientation', handler);
  window.addEventListener('deviceorientationabsolute', handler);
}

export default function useDeviceOrientation(cb) {
  useEffect(() => {
    install();
    subscribers.add(cb);
    if (lastEvent) cb(lastEvent);
    return () => subscribers.delete(cb);
  }, [cb]);
}