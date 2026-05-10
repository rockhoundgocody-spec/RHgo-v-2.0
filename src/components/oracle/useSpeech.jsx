import { useEffect, useRef, useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// useSpeechSynthesis
// Wraps Web Speech Synthesis with Chrome-safe cancellation, voice selection,
// localStorage-based voice settings, and a per-frame audio-reactive envelope.
// ─────────────────────────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const amplitudeRef = useRef(0);
  const targetAmpRef = useRef(0);
  const bassRef = useRef(0);
  const midRef = useRef(0);
  const trebleRef = useRef(0);
  const targetBassRef = useRef(0);
  const targetMidRef = useRef(0);
  const targetTrebleRef = useRef(0);
  const rafRef = useRef(null);

  const startAmpLoop = useCallback(() => {
    if (rafRef.current) return;
    const tick = () => {
      const now = performance.now();
      amplitudeRef.current += (targetAmpRef.current - amplitudeRef.current) * 0.09;
      targetAmpRef.current *= 0.965;
      bassRef.current += (targetBassRef.current - bassRef.current) * 0.06;
      midRef.current += (targetMidRef.current - midRef.current) * 0.11;
      trebleRef.current += (targetTrebleRef.current - trebleRef.current) * 0.18;
      targetBassRef.current *= 0.975;
      targetMidRef.current *= 0.945;
      targetTrebleRef.current *= 0.88;
      const bassOsc = 0.22 + 0.12 * Math.sin(now * 0.0035);
      const midOsc = 0.16 + 0.10 * Math.sin(now * 0.011 + 1.3);
      const trebleOsc = 0.10 + 0.07 * Math.sin(now * 0.028 + 2.7);
      bassRef.current = Math.max(bassRef.current, bassRef.current * 0.7 + bassOsc * 0.3);
      midRef.current = Math.max(midRef.current, midRef.current * 0.7 + midOsc * 0.3);
      trebleRef.current = Math.max(trebleRef.current, trebleRef.current * 0.7 + trebleOsc * 0.3);
      const baseline = 0.18 + 0.08 * Math.sin(now * 0.0065);
      amplitudeRef.current = Math.max(amplitudeRef.current, amplitudeRef.current * 0.7 + baseline * 0.3);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAmpLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    amplitudeRef.current = 0;
    targetAmpRef.current = 0;
    bassRef.current = midRef.current = trebleRef.current = 0;
    targetBassRef.current = targetMidRef.current = targetTrebleRef.current = 0;
  }, []);

  const getAmplitude = useCallback(() => amplitudeRef.current, []);
  const getSpectrum = useCallback(
    () => ({ bass: bassRef.current, mid: midRef.current, treble: trebleRef.current }),
    []
  );

  // Load voices — Chrome populates them asynchronously
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [supported]);

  const pickVoice = useCallback((voiceList) => {
    if (!voiceList.length) return null;
    return (
      voiceList.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google us/i.test(v.name)) ||
      voiceList.find((v) => /en[-_]US/i.test(v.lang)) ||
      voiceList.find((v) => /^en/i.test(v.lang)) ||
      voiceList[0]
    );
  }, []);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      try {
        // Hard-cancel any current speech
        window.speechSynthesis.cancel();

        const voiceSettings = (() => {
          try { return JSON.parse(localStorage.getItem('clover_voice') || '{}'); } catch { return {}; }
        })();

        const doSpeak = () => {
          // Re-fetch voices at speak time — guarantees we have the latest list
          const currentVoices = window.speechSynthesis.getVoices();
          const utter = new SpeechSynthesisUtterance(String(text));
          utter.lang = 'en-US';
          utter.rate = voiceSettings.rate ?? 0.92;
          utter.pitch = voiceSettings.pitch ?? 1.18;
          utter.volume = voiceSettings.volume ?? 0.95;
          const v = pickVoice(currentVoices);
          if (v) utter.voice = v;

          utter.onstart = () => { setSpeaking(true); startAmpLoop(); };
          utter.onend = () => { setSpeaking(false); stopAmpLoop(); };
          utter.onerror = (e) => {
            // 'interrupted' fires on cancel() — not a real error
            if (e.error !== 'interrupted') {
              setSpeaking(false);
              stopAmpLoop();
            }
          };
          utter.onboundary = (e) => {
            const isWord = e.name === 'word';
            const charLen = e.charLength || 4;
            const wordWeight = Math.min(1, charLen / 8);
            const energy = isWord ? 0.55 + Math.random() * 0.45 : 0.4 + Math.random() * 0.3;
            const blend = (cur, next) => cur * 0.4 + next * 0.6;
            targetAmpRef.current = blend(targetAmpRef.current, Math.min(1, energy));
            targetBassRef.current = blend(targetBassRef.current, Math.min(1, 0.35 + wordWeight * 0.5 + Math.random() * 0.1));
            targetMidRef.current = blend(targetMidRef.current, Math.min(1, 0.4 + Math.random() * 0.4));
            targetTrebleRef.current = blend(targetTrebleRef.current, Math.min(1, 0.3 + (1 - wordWeight) * 0.45 + Math.random() * 0.2));
          };

          window.speechSynthesis.speak(utter);
        };

        // Chrome requires a >100ms gap after cancel() before speak() is reliable
        setTimeout(doSpeak, 120);
      } catch {
        setSpeaking(false);
      }
    },
    [supported, pickVoice, startAmpLoop, stopAmpLoop]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    stopAmpLoop();
  }, [supported, stopAmpLoop]);

  useEffect(() => () => stopAmpLoop(), [stopAmpLoop]);

  return { speak, stop, speaking, supported, voices, getAmplitude, getSpectrum };
}


// ─────────────────────────────────────────────────────────────────────────────
// useSpeechRecognition
//
// Hard-reset design:
//   • One SpeechRecognition instance per listen() call (no reuse / no leaks).
//   • continuous = false — stops after the first utterance, kills ambient bleed.
//   • confidenceThreshold — results below 0.35 are discarded as noise.
//   • minLength — results shorter than 3 chars are discarded.
//   • 6s hard silence timeout (down from 8s) — cuts off runaway listening sooner.
//   • The rec instance is stored in a ref so stop() can actually abort it.
//   • onend only resets state — it does NOT auto-restart; HeroOrb controls that.
// ─────────────────────────────────────────────────────────────────────────────
const CONFIDENCE_THRESHOLD = 0.35; // below this = ambient noise, discard
const MIN_TRANSCRIPT_CHARS = 3;    // single-phoneme blips are noise
const SILENCE_TIMEOUT_MS = 6000;   // hard cutoff per listen session

export function useSpeechRecognition({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;

  const recRef = useRef(null);       // active SpeechRecognition instance
  const silenceTimer = useRef(null);
  const deadRef = useRef(false);     // true after stop() — prevents late onend callbacks from re-setting state

  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  const _clearTimer = () => {
    clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
  };

  const _killRec = useCallback(() => {
    _clearTimer();
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    // Tear down any stale instance before starting fresh
    _killRec();
    deadRef.current = false;
    setListening(true);

    const rec = new SR();
    rec.continuous = false;       // one utterance → done; no ambient bleed
    rec.interimResults = true;    // show live transcript while user speaks
    rec.maxAlternatives = 1;
    rec.lang = 'en-US';
    recRef.current = rec;

    rec.onresult = (e) => {
      _clearTimer();
      let interim = '';
      let finalText = '';
      let finalConfidence = 1;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
          // Use lowest confidence seen — conservative filter
          finalConfidence = Math.min(finalConfidence, r[0].confidence ?? 1);
        } else {
          interim += r[0].transcript;
        }
      }

      if (interim && onInterimRef.current) onInterimRef.current(interim);

      if (finalText) {
        const clean = finalText.trim();
        // Discard noise: too short OR confidence too low (0 = browser didn't report = pass through)
        const isTooShort = clean.length < MIN_TRANSCRIPT_CHARS;
        const isNoise = finalConfidence > 0 && finalConfidence < CONFIDENCE_THRESHOLD;
        if (!isTooShort && !isNoise) {
          onResultRef.current?.(clean);
        }
        // Clear interim after final
        onInterimRef.current?.('');
      }
    };

    rec.onend = () => {
      if (!deadRef.current) setListening(false);
      _clearTimer();
      recRef.current = null;
    };

    rec.onerror = (e) => {
      // 'no-speech' = silence timeout from browser — benign, just reset state
      // 'aborted' = we called abort() ourselves — ignore
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setListening(false);
      }
      _clearTimer();
      recRef.current = null;
    };

    try {
      rec.start();
      // Hard cutoff: if no final result in SILENCE_TIMEOUT_MS, abort
      silenceTimer.current = setTimeout(() => {
        if (recRef.current) {
          try { recRef.current.stop(); } catch {}
        }
      }, SILENCE_TIMEOUT_MS);
    } catch {
      setListening(false);
      recRef.current = null;
    }
  }, [SR, _killRec]);

  const stop = useCallback(() => {
    deadRef.current = true;
    _killRec();
    setListening(false);
  }, [_killRec]);

  // Cleanup on unmount
  useEffect(() => () => {
    deadRef.current = true;
    _killRec();
  }, [_killRec]);

  return { start, stop, listening, supported };
}