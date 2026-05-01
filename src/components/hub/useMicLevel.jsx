import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useMicLevel — opens the device microphone and computes a smoothed
 * 0..1 level via Web Audio Analyser. Cleans up on stop.
 * Used to drive the VoiceprintRing while the orb is listening.
 */
export default function useMicLevel() {
  const [active, setActive] = useState(false);
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const levelRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
    analyserRef.current = null;
    levelRef.current = 0;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    if (active) return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // smooth + gain
        levelRef.current += (Math.min(1, rms * 4) - levelRef.current) * 0.2;
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setActive(true);
    } catch {
      stop();
    }
  }, [active, stop]);

  useEffect(() => () => stop(), [stop]);

  const getLevel = useCallback(() => levelRef.current, []);
  // Stable ref — same identity across renders so effect deps don't loop
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = { start, stop, getLevel };
  apiRef.current.start = start;
  apiRef.current.stop = stop;
  apiRef.current.getLevel = getLevel;
  return { ...apiRef.current, active };
}