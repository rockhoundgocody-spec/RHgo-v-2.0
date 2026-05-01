import { useEffect, useRef, useState, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Live amplitude (0..1) driven by boundary events + continuous oscillation.
  // Read via getAmplitude() in animation frames — does NOT trigger re-renders.
  const amplitudeRef = useRef(0);
  const targetAmpRef = useRef(0);
  const rafRef = useRef(null);

  const startAmpLoop = useCallback(() => {
    if (rafRef.current) return;
    const tick = () => {
      // ease toward target, then decay target so each boundary "pulses"
      amplitudeRef.current += (targetAmpRef.current - amplitudeRef.current) * 0.18;
      targetAmpRef.current *= 0.92;
      // continuous low-amplitude tremor while speaking so it feels alive
      const baseline = 0.15 + 0.1 * Math.sin(performance.now() * 0.012);
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
  }, []);

  const getAmplitude = useCallback(() => amplitudeRef.current, []);

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
        utter.rate = 1;
        utter.pitch = 1;
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
        // Each word/sentence boundary kicks the amplitude up — this is our
        // best proxy for voice envelope since Web Speech has no analyser node.
        utter.onboundary = (e) => {
          const isWord = e.name === 'word';
          targetAmpRef.current = Math.min(1, 0.55 + Math.random() * (isWord ? 0.45 : 0.25));
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

  return { speak, stop, speaking, supported, voices, getAmplitude };
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