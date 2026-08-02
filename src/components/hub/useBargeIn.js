import { useCallback, useEffect, useRef } from 'react';

/**
 * useBargeIn — listens for the user starting to talk while Clover is speaking,
 * so she can be interrupted mid-sentence like a real conversation.
 *
 * The threshold is deliberately high and requires sustained input, because the
 * phone speaker bleeds into the mic — a low threshold would make Clover
 * interrupt herself on her own voice.
 */
const RMS_THRESHOLD = 0.14;
const SUSTAIN_MS = 320;

export default function useBargeIn(onBargeIn) {
  const cbRef = useRef(onBargeIn);
  cbRef.current = onBargeIn;

  const streamRef = useRef(null);
  const ctxRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);

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
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    runningRef.current = true;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      runningRef.current = false;
      return;
    }
    if (!runningRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.frequencyBinCount);

    let loudSince = null;
    const tick = () => {
      if (!runningRef.current) return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);

      if (rms > RMS_THRESHOLD) {
        if (loudSince == null) loudSince = Date.now();
        if (Date.now() - loudSince > SUSTAIN_MS) {
          stop();
          cbRef.current?.();
          return;
        }
      } else {
        loudSince = null;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stop]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop };
}