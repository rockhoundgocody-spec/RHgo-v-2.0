import { useEffect, useRef, useState, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Live audio-reactive spectrum — bass/mid/treble bands + master amplitude.
  // Driven by boundary events (per-word seeding) and per-frame oscillators
  // tuned to mimic vocal formants (~200Hz body / ~1.5kHz mid / ~4kHz sibilance).
  // Read via getAmplitude()/getSpectrum() in animation frames.
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
      // SMOOTHED envelope — lower alpha = slower follow, longer decay = silkier
      // transitions that flow with the orb's liquid-gas animation.
      amplitudeRef.current += (targetAmpRef.current - amplitudeRef.current) * 0.09;
      targetAmpRef.current *= 0.965;

      // per-band envelopes — gentler attack + slower decay across all bands
      bassRef.current += (targetBassRef.current - bassRef.current) * 0.06;
      midRef.current += (targetMidRef.current - midRef.current) * 0.11;
      trebleRef.current += (targetTrebleRef.current - trebleRef.current) * 0.18;
      targetBassRef.current *= 0.975;
      targetMidRef.current *= 0.945;
      targetTrebleRef.current *= 0.88;

      // formant-like oscillators — slower drift, deeper baseline (smoother breathing)
      const bassOsc = 0.22 + 0.12 * Math.sin(now * 0.0035);
      const midOsc = 0.16 + 0.10 * Math.sin(now * 0.011 + 1.3);
      const trebleOsc = 0.10 + 0.07 * Math.sin(now * 0.028 + 2.7);
      // soft-blend the floor instead of hard clamp — eliminates micro-pops
      bassRef.current = Math.max(bassRef.current, bassRef.current * 0.7 + bassOsc * 0.3);
      midRef.current = Math.max(midRef.current, midRef.current * 0.7 + midOsc * 0.3);
      trebleRef.current = Math.max(trebleRef.current, trebleRef.current * 0.7 + trebleOsc * 0.3);

      const baseline = 0.18 + 0.08 * Math.sin(now * 0.0065);
      amplitudeRef.current = Math.max(
        amplitudeRef.current,
        amplitudeRef.current * 0.7 + baseline * 0.3
      );

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

  // Load voices (Chrome populates them asynchronously)
  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [supported]);

  const pickVoice = useCallback(() => {
    if (!voices.length) return null;
    return (
      voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira|google us/i.test(v.name)) ||
      voices.find((v) => /en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0]
    );
  }, [voices]);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      try {
        // Resume in case the engine was paused (common Chrome quirk)
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();

        const voiceSettings = (() => {
          try { return JSON.parse(localStorage.getItem('clover_voice') || '{}'); } catch { return {}; }
        })();
        const utter = new SpeechSynthesisUtterance(String(text));
        utter.lang = 'en-US';
        utter.rate = voiceSettings.rate ?? 0.92;
        utter.pitch = voiceSettings.pitch ?? 1.18;
        utter.volume = voiceSettings.volume ?? 0.95;
        const v = pickVoice();
        if (v) utter.voice = v;
        utter.onstart = () => {
          setSpeaking(true);
          startAmpLoop();
        };
        utter.onend = () => {
          setSpeaking(false);
          stopAmpLoop();
        };
        utter.onerror = () => {
          setSpeaking(false);
          stopAmpLoop();
        };
        // Each word/sentence boundary seeds the spectrum bands.
        // Web Speech has no analyser node, so we model the voice envelope:
        //   • word length → bass/mid emphasis (longer words = more body)
        //   • short words / punctuation → treble flicker (consonants)
        utter.onboundary = (e) => {
          const isWord = e.name === 'word';
          const charLen = e.charLength || 4;
          const wordWeight = Math.min(1, charLen / 8); // 0..1
          const energy = isWord ? 0.55 + Math.random() * 0.45 : 0.4 + Math.random() * 0.3;

          // BLEND new target with current target — softens word-to-word jumps
          // so the spectrum flows like liquid instead of stepping abruptly.
          const blend = (cur, next) => cur * 0.4 + next * 0.6;
          targetAmpRef.current = blend(targetAmpRef.current, Math.min(1, energy));
          targetBassRef.current = blend(
            targetBassRef.current,
            Math.min(1, 0.35 + wordWeight * 0.5 + Math.random() * 0.1)
          );
          targetMidRef.current = blend(
            targetMidRef.current,
            Math.min(1, 0.4 + Math.random() * 0.4)
          );
          targetTrebleRef.current = blend(
            targetTrebleRef.current,
            Math.min(1, 0.3 + (1 - wordWeight) * 0.45 + Math.random() * 0.2)
          );
        };

        // Tiny delay helps Chrome after a cancel()
        setTimeout(() => window.speechSynthesis.speak(utter), 60);
      } catch {
        setSpeaking(false);
      }
    },
    [supported, pickVoice]
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

export function useSpeechRecognition({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;
  const activeRef = useRef(false);
  const silenceTimer = useRef(null);

  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  const createRec = useCallback(() => {
    if (!SR) return null;
    const rec = new SR();
    // NON-continuous: one utterance at a time — stops picking up ambient noise
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      clearTimeout(silenceTimer.current);
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (interim && onInterimRef.current) onInterimRef.current(interim);
      if (finalText && onResultRef.current) {
        const clean = finalText.trim();
        // Only fire if the result has meaningful content (>2 chars, not pure noise)
        if (clean.length > 2) onResultRef.current(clean);
      }
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = (e) => {
      // 'no-speech' is not a real error — just silence, ignore it
      if (e.error !== 'no-speech') setListening(false);
    };

    return rec;
  }, [SR]);

  const start = useCallback(() => {
    if (!SR) return;
    activeRef.current = true;
    setListening(true);
    try {
      const rec = createRec();
      rec.start();
      // Auto-stop after 8s of no final result to prevent runaway listening
      silenceTimer.current = setTimeout(() => {
        try { rec.stop(); } catch {}
      }, 8000);
    } catch {
      setListening(false);
    }
  }, [SR, createRec]);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimeout(silenceTimer.current);
    setListening(false);
  }, []);

  return { start, stop, listening, supported };
}