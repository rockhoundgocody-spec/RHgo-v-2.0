import { useCallback, useEffect, useState } from 'react';

/**
 * Lists available video input devices. AI glasses that expose themselves as a
 * standard camera (UVC over USB, or via their companion app's virtual camera)
 * appear in this list and can be selected as the broadcast source.
 */
export default function useCameraDevices() {
  const [devices, setDevices] = useState([]);
  const [permission, setPermission] = useState('unknown'); // unknown | granted | denied

  const enumerate = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((d) => d.kind === 'videoinput'));
  }, []);

  const requestAccess = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
      setPermission('granted');
      await enumerate();
    } catch {
      setPermission('denied');
    }
  }, [enumerate]);

  useEffect(() => {
    if (!navigator.mediaDevices) return;
    enumerate();
    navigator.mediaDevices.addEventListener?.('devicechange', enumerate);
    return () => navigator.mediaDevices.removeEventListener?.('devicechange', enumerate);
  }, [enumerate]);

  return { devices, permission, requestAccess, refresh: enumerate };
}