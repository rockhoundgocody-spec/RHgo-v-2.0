import { useEffect, useState } from 'react';
import {
  emitBlocked, emitDenied, emitWake, isCloverBusy, isNoiseGateEnabled,
  isVoiceLockEnabled, isWakeEnabled, matchesWakeWord, on, setWakeEnabled,
} from '@/lib/cloverWake';
import { createLevelSampler } from '@/lib/micBars';
import {
  SPEECH_FRAME_RATIO, VOICE_MATCH_THRESHOLD, bandVector, createNoiseGate,
  loadVoicePrint, matchScore, speechFrameRatio,
} from '@/lib/voicePrint';

const COOLDOWN_MS = 2000;
const RESTART_MS = 250;
const SAMPLE_MS = 60;          // ear sampling rate — 16 frames a second is plenty
const BUFFER_MS = 3000;        // rolling audio kept in memory, never recorded
const UTTERANCE_MS = 1800;     // the stretch of it the wake phrase lives in
const BLOCK_HOLD_MS = 2500;    // ignore repeats of a wake she just turned away
const BLOCK_NOTICE_MS = 8000;  // ...and don't pop up about it every 200ms

/**
 * useWakeWord — always-on, low-overhead "Hey Clover" listener.
 *
 * The recognizer only scans interim transcripts for the phrase, so the wake is
 * detected mid-sentence and fires immediately. A second, cheap mic tap (one
 * AnalyserNode) judges what it heard at match time: an adaptive noise gate
 * throws away wakes that were only background noise, and the enrolled voice
 * print throws away wakes that were somebody else. Both run on match only, so
 * nothing is added to the listening path. Pauses while Clover is busy (she owns
 * the mic then) and while the tab is hidden, then comes straight back.
 */
export default function useWakeWord() {
  const [live, setLive] = useState(false);

  useEffect(() => {
    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;
    if (!SR) return undefined;

    let rec = null;
    let restartTimer = null;
    let lastWake = 0;
    let disposed = false;

    // ── Ear: rolling loudness + band shape used to judge the wake ───────────
    const frames = []; // { t, level, bands }
    const gate = createNoiseGate();
    const level = createLevelSampler();
    let monitor = null; // { ctx, stream, analyser }
    let sampleTimer = null;
    let blockedUntil = 0;
    let lastBlockNotice = 0;

    const shouldRun = () =>
      !disposed && isWakeEnabled() && !isCloverBusy() && document.visibilityState === 'visible';

    const trimFrames = (now) => {
      while (frames.length && now - frames[0].t > BUFFER_MS) frames.shift();
    };

    const stopMonitor = () => {
      clearInterval(sampleTimer);
      sampleTimer = null;
      if (monitor) {
        const { ctx, stream } = monitor;
        monitor = null;
        stream.getTracks().forEach((t) => t.stop());
        if (ctx.state !== 'closed') { try { ctx.close().catch(() => {}); } catch { /* closing */ } }
      }
      frames.length = 0;
    };

    const startMonitor = async () => {
      if (monitor || disposed) return;
      if (!navigator.mediaDevices?.getUserMedia) return;
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
      } catch {
        return; // no ear — the recognizer alone still wakes her
      }
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (disposed || !shouldRun() || !Ctx) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      ctx.createMediaStreamSource(stream).connect(analyser);
      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* unlocked by gesture */ } }
      monitor = { ctx, stream, analyser };

      const bins = new Uint8Array(analyser.frequencyBinCount);
      sampleTimer = setInterval(() => {
        if (!monitor) return;
        const now = Date.now();
        analyser.getByteFrequencyData(bins);
        const loudness = level.sample(analyser);
        gate.push(loudness);
        frames.push({ t: now, level: loudness, bands: bandVector(bins) });
        trimFrames(now);
      }, SAMPLE_MS);
    };

    /** Was the wake phrase actually spoken out loud, in my voice? */
    const judgeWake = () => {
      const now = Date.now();
      const recent = frames.filter((f) => now - f.t <= UTTERANCE_MS);
      if (!recent.length) return { ok: true, reason: 'no_ear' }; // no tap: trust the recognizer

      if (isNoiseGateEnabled()) {
        const ratio = speechFrameRatio(recent.map((f) => f.level), gate.floor);
        if (ratio < SPEECH_FRAME_RATIO) return { ok: false, reason: 'noise' };
      }

      if (isVoiceLockEnabled()) {
        const print = loadVoicePrint();
        if (print) {
          const bar = Math.max(gate.threshold, 0.04);
          let voiced = recent.filter((f) => f.level >= bar);
          // A soft-spoken wake in a quiet room: judge the loudest frames we have.
          if (voiced.length < 4) voiced = [...recent].sort((a, b) => b.level - a.level).slice(0, 6);
          if (matchScore(print, voiced.map((f) => f.bands)) < VOICE_MATCH_THRESHOLD) {
            return { ok: false, reason: 'not_you' };
          }
        }
      }
      return { ok: true, reason: 'ok' };
    };

    // ── Recognizer ──────────────────────────────────────────────────────────
    const stop = () => {
      clearTimeout(restartTimer);
      if (rec) {
        const r = rec;
        rec = null;
        r.onend = null;
        r.onerror = null;
        r.onresult = null;
        try { r.abort(); } catch { /* already stopped */ }
      }
      stopMonitor();
      setLive(false);
    };

    const scheduleRestart = () => {
      clearTimeout(restartTimer);
      restartTimer = setTimeout(() => { if (shouldRun()) start(); }, RESTART_MS);
    };

    const start = () => {
      if (rec || !shouldRun()) return;
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 3;
      r.lang = 'en-US';

      r.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          for (let a = 0; a < result.length; a++) {
            if (!matchesWakeWord(result[a].transcript)) continue;
            const now = Date.now();
            if (now < blockedUntil || now - lastWake < COOLDOWN_MS) return;

            const verdict = judgeWake();
            if (!verdict.ok) {
              // Same utterance keeps matching as it grows — judge it once.
              blockedUntil = now + BLOCK_HOLD_MS;
              if (now - lastBlockNotice > BLOCK_NOTICE_MS) {
                lastBlockNotice = now;
                emitBlocked(verdict.reason);
              }
              return;
            }

            lastWake = now;
            stop();
            emitWake();
            return;
          }
        }
      };
      r.onerror = (e) => {
        if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) {
          setWakeEnabled(false); // permission denied — turn off, never loop
          emitDenied();
        }
      };
      r.onend = () => {
        rec = null;
        setLive(false);
        scheduleRestart();
      };

      try {
        r.start();
        rec = r;
        setLive(true);
        startMonitor();
      } catch {
        scheduleRestart();
      }
    };

    const sync = () => (shouldRun() ? start() : stop());

    const offEnabled = on('enabled', sync);
    const offBusy = on('busy', () => {
      // Give the conversation's own recognizer time to release the mic.
      if (isCloverBusy()) stop(); else scheduleRestart();
    });
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      disposed = true;
      offEnabled();
      offBusy();
      document.removeEventListener('visibilitychange', sync);
      stop();
    };
  }, []);

  return live;
}