import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * useIntroAudio — procedural ambient music + SFX for the intro cinematic.
 *
 * No external audio files — everything is synthesized with the Web Audio API:
 *  - Ambient pad: three detuned oscillators (A2/E3/A3 open fifth) through a
 *    lowpass filter + feedback delay, each with a slow LFO for amplitude swell.
 *  - SFX: chime (sine triad), click (short pitch drop), whoosh (filtered noise sweep).
 *
 * Audio context is created on the first user gesture (splash tap) to satisfy
 * mobile autoplay policies.
 */
export function useIntroAudio() {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const sfxRef = useRef(null);
  const nodesRef = useRef([]);
  const [muted, setMuted] = useState(false);
  const [started, setStarted] = useState(false);

  const initAudio = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state === 'suspended') ctxRef.current.resume().catch(() => {});
      return;
    }
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      masterRef.current = master;

      const music = ctx.createGain();
      music.gain.value = 0.35;
      music.connect(master);

      const sfx = ctx.createGain();
      sfx.gain.value = 0.6;
      sfx.connect(master);
      sfxRef.current = sfx;

      // ── Ambient pad ──
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 700;
      filter.Q.value = 0.8;
      filter.connect(music);

      const delay = ctx.createDelay(2);
      delay.delayTime.value = 0.45;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.35;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(music);

      [110, 164.81, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        osc.detune.value = (i - 1) * 6;

        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.12;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.04 + i * 0.02;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.06;
        lfo.connect(lfoGain);
        lfoGain.connect(oscGain.gain);

        osc.connect(oscGain);
        oscGain.connect(filter);
        oscGain.connect(delay);
        osc.start();
        lfo.start();
        nodesRef.current.push(osc, lfo);
      });

      setStarted(true);
    } catch (e) {
      console.warn('Intro audio init failed:', e);
    }
  }, []);

  const playChime = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    [880, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.12, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + i * 0.2);
      osc.connect(g);
      g.connect(sfxRef.current);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  }, [muted]);

  const playClick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(g);
    g.connect(sfxRef.current);
    osc.start(now);
    osc.stop(now + 0.08);
  }, [muted]);

  const playWhoosh = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.4;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(300, now);
    bp.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
    bp.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(bp);
    bp.connect(g);
    g.connect(sfxRef.current);
    noise.start(now);
    noise.stop(now + 0.5);
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (masterRef.current && ctxRef.current) {
        masterRef.current.gain.linearRampToValueAtTime(
          next ? 0 : 0.5,
          ctxRef.current.currentTime + 0.2
        );
      }
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      nodesRef.current.forEach((n) => {
        try { n.stop(); } catch {}
      });
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
    },
    []
  );

  return { initAudio, playChime, playClick, playWhoosh, toggleMute, muted, started };
}