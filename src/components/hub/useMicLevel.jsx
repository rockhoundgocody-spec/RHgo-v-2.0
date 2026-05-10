import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useMicLevel — requests mic permission, opens the device microphone, and
 * computes a smoothed 0..1 level via Web Audio Analyser.
 *
 * Key fixes vs. previous version:
 *   • Uses a ref for the "already running" guard — not stale closure state.
 *   • getUserMedia is called eagerly on start() so the browser permission
 *     dialog is always shown/triggered (no silent bail-outs).
 *   • Errors are surfaced via the returned `error` string so callers can
 *     show a helpful message when permission is denied.
 */
export default function useMicLevel() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null); // 'denied' | 'unavailable' | null

  const runningRef = useRef(false); // ref-based guard — never stale
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const levelRef = useRef(0);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
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
    // Ref-based guard — immune to stale closure
    if (runningRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unavailable');
      return;
    }
    setError(null);
    try {
      // This is the call that triggers the browser mic permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      runningRef.current = true;
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
        if (!runningRef.current) return;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        levelRef.current += (Math.min(1, rms * 4) - levelRef.current) * 0.2;
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setActive(true);
    } catch (err) {
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.toLowerCase().includes('denied');
      setError(isDenied ? 'denied' : 'unavailable');
      stop();
    }
  }, [stop]); // no `active` dep — uses runningRef instead

  useEffect(() => () => stop(), [stop]);

  const getLevel = useCallback(() => levelRef.current, []);

  return { start, stop, getLevel, active, error };
}