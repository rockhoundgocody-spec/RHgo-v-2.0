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
      // master amplitude — slow pulse, follows targets
      amplitudeRef.current += (targetAmpRef.current - amplitudeRef.current) * 0.18;
      targetAmpRef.current *= 0.92;

      // per-band envelopes — each decays at its own rate (bass slowest, treble fastest)
      bassRef.current += (targetBassRef.current - bassRef.current) * 0.12;
      midRef.current += (targetMidRef.current - midRef.current) * 0.22;
      trebleRef.current += (targetTrebleRef.current - trebleRef.current) * 0.35;
      targetBassRef.current *= 0.94;
      targetMidRef.current *= 0.88;
      targetTrebleRef.current *= 0.78;

      // formant-like oscillators add the "breathing" texture between word events
      const bassOsc = 0.18 + 0.10 * Math.sin(now * 0.006);
      const midOsc = 0.12 + 0.08 * Math.sin(now * 0.018 + 1.3);
      const trebleOsc = 0.08 + 0.06 * Math.sin(now * 0.045 + 2.7);
      if (bassRef.current < bassOsc) bassRef.current = bassOsc;
      if (midRef.current < midOsc) midRef.current = midOsc;
      if (trebleRef.current < trebleOsc) trebleRef.current = trebleOsc;

      const baseline = 0.15 + 0.1 * Math.sin(now * 0.012);
      if (amplitudeRef.current < baseline) amplitudeRef.current = baseline;

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

        const utter = new SpeechSynthesisUtterance(String(text));
        utter.lang = 'en-US';
        utter.rate = 0.92;
        utter.pitch = 1.05;
        utter.volume = 1;
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

          targetAmpRef.current = Math.min(1, energy);
          // bass — driven by vowel-rich (longer) words
          targetBassRef.current = Math.min(
            1,
            0.35 + wordWeight * 0.55 + Math.random() * 0.15
          );
          // mid — formant body, fairly consistent during speech
          targetMidRef.current = Math.min(1, 0.4 + Math.random() * 0.5);
          // treble — sibilance/consonant flicker, sharper on short words
          targetTrebleRef.current = Math.min(
            1,
            0.3 + (1 - wordWeight) * 0.5 + Math.random() * 0.3
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

export function useSpeechRecognition({ onResult } = {}) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  useEffect(() => {
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript && onResult) onResult(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
  }, [SR, onResult]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.start();
      setListening(true);
    } catch {}
  }, []);

  const stop = useCallback(() => {
    if (!recRef.current) return;
    try {
      recRef.current.stop();
    } catch {}
    setListening(false);
  }, []);

  return { start, stop, listening, supported };
}