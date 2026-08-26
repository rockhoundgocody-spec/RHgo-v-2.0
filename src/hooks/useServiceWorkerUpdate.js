import { useCallback, useEffect, useState } from 'react';

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const serviceWorker = globalThis.navigator?.serviceWorker;
    if (!serviceWorker) return undefined;

    let registration;
    let installingWorker;
    const handleStateChange = () => {
      if (installingWorker?.state === 'installed' && serviceWorker.controller) {
        setUpdateAvailable(true);
      }
    };
    const handleUpdateFound = () => {
      installingWorker?.removeEventListener('statechange', handleStateChange);
      installingWorker = registration?.installing;
      installingWorker?.addEventListener('statechange', handleStateChange);
    };

    serviceWorker.getRegistration().then((current) => {
      registration = current;
      if (current?.waiting) setUpdateAvailable(true);
      current?.addEventListener('updatefound', handleUpdateFound);
    }).catch(() => {});

    return () => {
      registration?.removeEventListener('updatefound', handleUpdateFound);
      installingWorker?.removeEventListener('statechange', handleStateChange);
    };
  }, []);

  const applyUpdate = useCallback(async () => {
    const serviceWorker = globalThis.navigator?.serviceWorker;
    const registration = await serviceWorker?.getRegistration().catch(() => null);
    if (!registration?.waiting) return false;

    serviceWorker.addEventListener('controllerchange', () => globalThis.location?.reload(), { once: true });
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    return true;
  }, []);

  return { updateAvailable, applyUpdate };
}
