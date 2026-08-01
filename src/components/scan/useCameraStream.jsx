import { useEffect, useRef, useState } from 'react';

/**
 * useCameraStream — manages a rear-facing camera MediaStream.
 * Returns { videoRef, ready, error, stop, capture } where capture()
 * grabs a Blob of the current frame.
 */
export default function useCameraStream({ active = true } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        // Torch (flashlight) is only controllable on some devices/browsers
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.();
        setTorchSupported(!!caps && 'torch' in caps);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setReady(false);
      setTorchOn(false);
      setTorchSupported(false);
    };
  }, [active]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setTorchSupported(false);
    }
  };

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setReady(false);
  };

  return { videoRef, ready, error, capture, stop, torchSupported, torchOn, toggleTorch };
}