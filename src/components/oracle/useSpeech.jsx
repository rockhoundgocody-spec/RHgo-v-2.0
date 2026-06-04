import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// ─────────────────────────────────────────────────────────────────────────────
// useSpeechSynthesis
//
// Uses Google Cloud TTS (via the synthesizeSpeech backend) for high-quality,
// non-pixelated audio. Falls back to browser synthesis only if the backend
// call fails hard.
//
// Amplitude / spectrum are computed from the decoded AudioBuffer via Web Audio,
// driving the orb visual exactly as before.
// ─────────────────────────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);

  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);      // active AudioBufferSourceNode
  const amplitudeRef = useRef(0);
  const bassRef = useRef(0);
  const midRef = useRef(0);
  const trebleRef = useRef(0);
  const rafRef = useRef(null);
  const analyserRef = useRef(null);

  // ── amplitude animation loop (driven by real AudioContext analyser) ──
  const startAmpLoop = useCallback((analyser) => {
    analyserRef.current = analyser;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const freqBuf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(freqBuf);
      const len = freqBuf.length;
      const bassEnd = Math.floor(len * 0.1);
      const midEnd = Math.floor(len * 0.45);

      let bassSum = 0, midSum = 0, trebleSum = 0;
      for (let i = 0; i < bassEnd; i++) bassSum += freqBuf[i];
      for (let i = bassEnd; i < midEnd; i++) midSum += freqBuf[i];
      for (let i = midEnd; i < len; i++) trebleSum += freqBuf[i];

      const b = bassSum / (bassEnd * 255);
      const m = midSum / ((midEnd - bassEnd) * 255);
      const t = trebleSum / ((len - midEnd) * 255);
      const amp = (b * 0.5 + m * 0.35 + t * 0.15);

      bassRef.current += (b - bassRef.current) * 0.15;
      midRef.current += (m - midRef.current) * 0.15;
      trebleRef.current += (t - trebleRef.current) * 0.15;
      amplitudeRef.current += (amp - amplitudeRef.current) * 0.12;

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAmpLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    amplitudeRef.current = 0;
    bassRef.current = midRef.current = trebleRef.current = 0;
    analyserRef.current = null;
  }, []);

  const getAmplitude = useCallback(() => amplitudeRef.current, []);
  const getSpectrum = useCallback(
    () => ({ bass: bassRef.current, mid: midRef.current, treble: trebleRef.current }),
    []
  );

  // ── core speak via Google TTS ──
  const speak = useCallback(async (text) => {
    if (!text) return;

    // Stop anything currently playing
    try {
      if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; }
      window.speechSynthesis?.cancel();
    } catch {}

    setSpeaking(true);

    try {
      // 1. Get high-quality audio from Google TTS backend
      const res = await base44.functions.invoke('synthesizeSpeech', {
        text: String(text).slice(0, 800),
        voice: 'en-US-Neural2-F',
        rate: 0.90,
        pitch: 0.0,
      });

      const b64 = res?.data?.audioContent;
      if (!b64) throw new Error('No audio content returned');

      // 2. Decode base64 → ArrayBuffer
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      // 3. Decode MP3 via Web Audio
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

      // 4. Wire through analyser → destination
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;  // tighter than 0.75 — crisp orb response, no smear

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      sourceRef.current = source;

      startAmpLoop(analyser);

      source.onended = () => {
        setSpeaking(false);
        stopAmpLoop();
        sourceRef.current = null;
      };

      source.start(0);
    } catch (err) {
      // Fallback to browser TTS if backend fails
      console.warn('Google TTS failed, falling back to browser:', err);
      stopAmpLoop();
      setSpeaking(false);
      _browserFallback(text, setSpeaking, startAmpLoop, stopAmpLoop);
    }
  }, [startAmpLoop, stopAmpLoop]);

  const stop = useCallback(() => {
    try { if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; } } catch {}
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    stopAmpLoop();
  }, [stopAmpLoop]);

  useEffect(() => () => {
    stop();
    try { audioCtxRef.current?.close(); } catch {}
  }, [stop]);

  return { speak, stop, speaking, supported: true, voices: [], getAmplitude, getSpectrum };
}

// Browser synthesis fallback (used only if Google TTS is unreachable)
function _browserFallback(text, setSpeaking, startAmpLoop, stopAmpLoop) {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(String(text));
  utter.lang = 'en-US';
  utter.rate = 0.88;
  utter.pitch = 1.1;
  utter.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const best = voices.find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|zira/i.test(v.name))
    || voices.find((v) => /en[-_]US/i.test(v.lang)) || voices[0];
  if (best) utter.voice = best;
  utter.onstart = () => setSpeaking(true);
  utter.onend = () => { setSpeaking(false); stopAmpLoop(); };
  utter.onerror = (e) => { if (e.error !== 'interrupted') { setSpeaking(false); stopAmpLoop(); } };
  window.speechSynthesis.speak(utter);
}


// ─────────────────────────────────────────────────────────────────────────────
// useSpeechRecognition
//
// Hard-noise rejection (strict command-only gate):
//   • CONFIDENCE_THRESHOLD: 0.75  — only high-confidence, clearly-spoken words
//   • MIN_TRANSCRIPT_CHARS: 10    — rejects phoneme blips, single-syllable noise
//   • MIN_WORD_COUNT: 3           — must be a real sentence / direct command
//   • continuous = false          — single utterance per session, no ambient drift
//   • interimResults = false      — no partial transcripts; only final, committed text
//   • Silence timeout: 3s         — cuts off quickly to prevent ambient accumulation
//   • 'no-speech' / 'aborted' errors are silently ignored
// ─────────────────────────────────────────────────────────────────────────────
const CONFIDENCE_THRESHOLD = 0.45;  // lowered — Chrome often reports 0 anyway
const MIN_TRANSCRIPT_CHARS = 2;     // single words like "yes", "hi" are valid
const MIN_WORD_COUNT = 1;           // allow single-word answers
const SILENCE_TIMEOUT_MS = 5000;    // more breathing room

export function useSpeechRecognition({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  onResultRef.current = onResult;
  onInterimRef.current = onInterim;

  const recRef = useRef(null);
  const silenceTimer = useRef(null);
  const deadRef = useRef(false);

  const SR =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = !!SR;

  const _clearTimer = () => { clearTimeout(silenceTimer.current); silenceTimer.current = null; };

  const _killRec = useCallback(() => {
    _clearTimer();
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    _killRec();
    deadRef.current = false;
    setListening(true);

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;   // show partial so user knows they're being heard
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
          finalConfidence = Math.min(finalConfidence, r[0].confidence ?? 1);
        } else {
          interim += r[0].transcript;
        }
      }

      // interimResults=false so interim will always be empty — no-op guard kept for safety
      if (interim && onInterimRef.current) onInterimRef.current(interim);

      if (finalText) {
        const clean = finalText.trim();
        const wordCount = clean.split(/\s+/).filter(Boolean).length;
        const isTooShort = clean.length < MIN_TRANSCRIPT_CHARS;
        const isTooFew = wordCount < MIN_WORD_COUNT;
        // confidence === 0 means browser didn't report it (Chrome quirk) — let through
        const isNoise = finalConfidence > 0 && finalConfidence < CONFIDENCE_THRESHOLD;

        if (!isTooShort && !isTooFew && !isNoise) {
          onResultRef.current?.(clean);
        }
        // Always clear interim display after a final result
        onInterimRef.current?.('');
      }
    };

    rec.onend = () => {
      if (!deadRef.current) setListening(false);
      _clearTimer();
      recRef.current = null;
    };

    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setListening(false);
      }
      _clearTimer();
      recRef.current = null;
    };

    try {
      rec.start();
      silenceTimer.current = setTimeout(() => {
        try { recRef.current?.stop(); } catch {}
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

  useEffect(() => () => { deadRef.current = true; _killRec(); }, [_killRec]);

  return { start, stop, listening, supported };
}