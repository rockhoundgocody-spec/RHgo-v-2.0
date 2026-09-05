import { useEffect, useRef, useState, useCallback } from 'react';

const TAP_LOCK_MS = 2500;

function trackOf(stream) {
  return stream?.getVideoTracks?.()[0] || null;
}

function readCaps(track) {
  try {
    return track?.getCapabilities?.() || {};
  } catch {
    return {};
  }
}

async function applyFocus(track, mode, point) {
  if (!track) return false;
  const caps = readCaps(track);
  const modes = caps.focusMode;
  const hasMode = Array.isArray(modes) ? modes.includes(mode) : false;
  const advanced = {};
  if (hasMode) advanced.focusMode = mode;
  if (point && Array.isArray(caps.pointsOfInterest)) {
    advanced.pointsOfInterest = [point];
  }
  if (!Object.keys(advanced).length) return false;
  try {
    await track.applyConstraints({ advanced: [advanced] });
    return true;
  } catch {
    try {
      if (hasMode) {
        await track.applyConstraints({ focusMode: mode });
        return true;
      }
    } catch {
      /* device rejected */
    }
    return false;
  }
}

/**
 * useCameraStream — rear camera + continuous AF + tap-to-focus.
 * focusAt(clientX, clientY, videoEl) uses ImageCapture pointsOfInterest when present.
 */
export default function useCameraStream({ active = true, facing = 'environment' } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lockTimerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [focusSupported, setFocusSupported] = useState(false);
  const [focusMode, setFocusMode] = useState('none');
  const [focusPoint, setFocusPoint] = useState(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: { ideal: 'continuous' },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const track = trackOf(stream);
        const caps = readCaps(track);
        setTorchSupported(!!caps && 'torch' in caps);
        const modes = caps.focusMode;
        const canFocus = Array.isArray(modes) && (modes.includes('continuous') || modes.includes('single-shot') || modes.includes('manual'));
        setFocusSupported(canFocus || Array.isArray(caps.pointsOfInterest));
        await applyFocus(track, modes?.includes('continuous') ? 'continuous' : (modes?.[0] || 'continuous'));
        if (!cancelled) setFocusMode('continuous');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setReady(true);
          };
        }
      } catch (e) {
        setError(e.message || 'Camera unavailable');
      }
    })();

    return () => {
      cancelled = true;
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setReady(false);
      setTorchOn(false);
      setTorchSupported(false);
      setFocusSupported(false);
      setFocusMode('none');
      setFocusPoint(null);
    };
  }, [active, facing]);

  const toggleTorch = async () => {
    const track = trackOf(streamRef.current);
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

  const resumeContinuous = useCallback(async () => {
    const track = trackOf(streamRef.current);
    const ok = await applyFocus(track, 'continuous');
    if (ok) setFocusMode('continuous');
    setFocusPoint(null);
  }, []);

  /** Tap video. x/y are event client coords. */
  const focusAt = useCallback(async (clientX, clientY, el) => {
    const node = el || videoRef.current;
    const track = trackOf(streamRef.current);
    if (!node || !track) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    setFocusPoint({ x: nx, y: ny });
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    const caps = readCaps(track);
    const modes = caps.focusMode || [];
    const tapMode = modes.includes('single-shot') ? 'single-shot' : modes.includes('manual') ? 'manual' : 'continuous';
    const ok = await applyFocus(track, tapMode, { x: nx, y: ny });
    if (ok) setFocusMode(tapMode);
    lockTimerRef.current = setTimeout(() => {
      resumeContinuous();
    }, TAP_LOCK_MS);
  }, [resumeContinuous]);

  const capture = () => new Promise((resolve) => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return resolve(null);
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });

  const stop = () => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  };

  return {
    videoRef,
    ready,
    error,
    capture,
    stop,
    torchSupported,
    torchOn,
    toggleTorch,
    focusSupported,
    focusMode,
    focusPoint,
    focusAt,
  };
}