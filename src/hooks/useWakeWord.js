import { useEffect, useState } from 'react';
import {
  emitDenied, emitWake, isCloverBusy, isWakeEnabled, matchesWakeWord, on, setWakeEnabled,
} from '@/lib/cloverWake';

const COOLDOWN_MS = 3000;
const RESTART_MS = 400;

/**
 * useWakeWord — always-on, low-overhead recognizer that only scans interim
 * transcripts for "Hey Clover" variants. Pauses while Clover is busy and
 * while the tab is hidden. Returns whether the mic is currently live.
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

    const shouldRun = () =>
      !disposed && isWakeEnabled() && !isCloverBusy() && document.visibilityState === 'visible';

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
            if (now - lastWake < COOLDOWN_MS) return;
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