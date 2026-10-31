import { useCallback, useEffect, useRef, useState } from 'react';
import { createBarSampler, createLevelSampler } from '@/lib/micBars';

/**
 * useMicLevel — real microphone activity for the voice waveform.
 *
 * Sampling is pull-based: the waveform's own animation frame calls getBars(),
 * so a moving waveform never re-renders React. If the mic can't be opened the
 * samplers simply return zero and the waveform falls back to its idle breathe.
 */
export default function useMicLevel(enabled) {
  const [available, setAvailable] = useState(false);

  const analyserRef = useRef(null);
  const ctxRef = useRef(null);
  const streamRef = useRef(null);
  const barsRef = useRef(null);
  const levelRef = useRef(null);
  if (!barsRef.current) barsRef.current = createBarSampler();
  if (!levelRef.current) levelRef.current = createLevelSampler();

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx.state !== 'closed') { try { ctx.close().catch(() => {}); } catch { /* already closing */ } }
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      stop();
      setAvailable(false);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
      } catch {
        return; // denied or busy — the waveform falls back to its idle breathe
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* unlocked by gesture */ } }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      setAvailable(true);
    })();

    return () => { cancelled = true; stop(); };
  }, [enabled, stop]);

  /** Fills `out` with 0..1 bar heights. Cheap enough to call every frame. */
  const getBars = useCallback((out) => barsRef.current.sample(analyserRef.current, out), []);
  /** Single 0..1 loudness value. */
  const getLevel = useCallback(() => levelRef.current.sample(analyserRef.current), []);

  return { getBars, getLevel, available };
}