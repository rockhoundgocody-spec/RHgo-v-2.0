/**
 * bannerMutex — ensures only one notification banner is visible at a time.
 * Banners register/release a slot. If a slot is taken, the requesting banner
 * silently stays hidden until the active one is dismissed.
 *
 * Usage:
 *   const { tryAcquire, release } = useBannerSlot('myBannerName');
 */
import { useState, useEffect, useRef, useCallback } from 'react';

let activeBanner = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(activeBanner));
}

export function useBannerSlot(name) {
  const [owner, setOwner] = useState(activeBanner);
  const mounted = useRef(true);

  useEffect(() => {
    const fn = (a) => { if (mounted.current) setOwner(a); };
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
      mounted.current = false;
    };
  }, []);

  const tryAcquire = useCallback(() => {
    if (activeBanner && activeBanner !== name) return false;
    activeBanner = name;
    notify();
    return true;
  }, [name]);

  const release = useCallback(() => {
    if (activeBanner === name) {
      activeBanner = null;
      notify();
    }
  }, [name]);

  const isOwner = owner === name;
  const slotFree = owner === null;

  return { tryAcquire, release, isOwner, slotFree };
}