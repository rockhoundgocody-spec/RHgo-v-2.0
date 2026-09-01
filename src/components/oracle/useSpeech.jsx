import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// ─────────────────────────────────────────────────────────────────────────────
// useSpeechSynthesis
// Google Cloud TTS via synthesizeSpeech backend → Web Audio analyser for
// amplitude/spectrum. Falls back to browser TTS on backend failure.
// ─────────────────────────────────────────────────────────────────────────────
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);

  const audioCtxRef   = useRef(null);
  const sourceRef     = useRef(null);
  const amplitudeRef  = useRef(0);
  const bassRef       = useRef(0);
  const midRef        = useRef(0);
  const trebleRef     = useRef(0);
  const rafRef        = useRef(null);
  const analyserRef   = useRef(null);

  const startAmpLoop = useCallback((analyser) => {
    analyserRef.current = analyser;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const freqBuf = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(freqBuf);
      const len = freqBuf.length;
      const bassEnd = Math.floor(len * 0.1);
      const midEnd  = Math.floor(len * 0.45);

      let bassSum = 0, midSum = 0, trebleSum = 0;
      for (let i = 0;        i < bassEnd; i++) bassSum   += freqBuf[i];
      for (let i = bassEnd;  i < midEnd;  i++) midSum    += freqBuf[i];
      for (let i = midEnd;   i < len;     i++) trebleSum += freqBuf[i];

      const b   = bassSum   / (bassEnd * 255);
      const m   = midSum    / ((midEnd - bassEnd) * 255);
      const t   = trebleSum / ((len - midEnd) * 255);
      const amp = b * 0.5 + m * 0.35 + t * 0.15;

      bassRef.current      += (b   - bassRef.current)      * 0.15;
      midRef.current       += (m   - midRef.current)       * 0.15;
      trebleRef.current    += (t   - trebleRef.current)    * 0.15;
      amplitudeRef.current += (amp - amplitudeRef.current) * 0.12;

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAmpLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    amplitudeRef.current = bassRef.current = midRef.current = trebleRef.current = 0;
    analyserRef.current  = null;
  }, []);

  const getAmplitude = useCallback(() => amplitudeRef.current, []);
  const getSpectrum  = useCallback(
    () => ({ bass: bassRef.current, mid: midRef.current, treble: trebleRef.current }),
    []
  );

  const speak = useCallback(async (text) => {
    if (!text) return;

    // Stop anything already playing
    try {
      if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; }
      window.speechSynthesis?.cancel();
    } catch {}
    stopAmpLoop();

    setSpeaking(true);

    let voiceConfig = { voice: 'honey', rate: 0.95, pitch: 1.0, volume: 0.95 };
    try {
      const stored = localStorage.getItem('clover_voice');
      if (stored) voiceConfig = { ...voiceConfig, ...JSON.parse(stored) };
    } catch {}

    try {
      // Create/resume the AudioContext FIRST — on mobile it may only be
      // unlocked while the originating user gesture is still fresh.
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }

      const res = await base44.functions.invoke('synthesizeSpeech', {
        text:  String(text).slice(0, 800),
        voice: voiceConfig.voice || 'honey',
      });

      const audioUrl = res?.data?.audioUrl;
      if (!audioUrl) throw new Error('No audio URL returned');

      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error('Audio fetch failed');
      const arrayBuf = await audioRes.arrayBuffer();

      if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
      const audioBuffer = await ctx.decodeAudioData(arrayBuf);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      // Play at the engine's natural pace — slowing playback pitch-shifts the
      // voice down and makes it sound robotic/computerized.
      source.playbackRate.value = 1.0;

      const gainNode = ctx.createGain();
      gainNode.gain.value = voiceConfig.volume ?? 0.95;

      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
      sourceRef.current = source;

      startAmpLoop(analyser);

      source.onended = () => {
        stopAmpLoop();
        sourceRef.current = null;
        setSpeaking(false);
      };

      source.start(0);
    } catch (err) {
      console.warn('TTS backend failed, falling back to browser:', err);
      stopAmpLoop();
      _browserFallback(text, setSpeaking, startAmpLoop, stopAmpLoop, voiceConfig);
    }
  }, [startAmpLoop, stopAmpLoop]);

  // Warm up the AudioContext from within a user gesture — mobile browsers
  // keep audio locked until a gesture creates/resumes the context. Call this
  // on the first tap so later setTimeout-driven speak() calls can play.
  const unlock = useCallback(() => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    } catch {}
  }, []);

  const stop = useCallback(() => {
    try { if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current = null; } } catch {}
    window.speechSynthesis?.cancel();
    stopAmpLoop();
    setSpeaking(false);
  }, [stopAmpLoop]);

  useEffect(() => () => {
    stop();
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== 'closed') { try { ctx.close().catch(() => {}); } catch {} }
    audioCtxRef.current = null;
  }, [stop]);

  return { speak, stop, speaking, supported: true, getAmplitude, getSpectrum, unlock };
}

function _browserFallback(text, setSpeaking, startAmpLoop, stopAmpLoop, voiceConfig = {}) {
  if (!window.speechSynthesis) { setSpeaking(false); return; }

  const _speak = () => {
    const utter    = new SpeechSynthesisUtterance(String(text));
    utter.lang     = 'en-US';
    utter.rate     = voiceConfig.rate || 0.96;
    utter.pitch    = voiceConfig.pitch || 1.02;
    utter.volume   = voiceConfig.volume ?? 1.0;
    const voices   = window.speechSynthesis.getVoices();
    // Prioritize Irish-American female voice (en-IE / Moira), smooth warm natural female voices, and avoid British (en-GB).
    const isNotBritish = (v) => !/en[-_]GB|british|uk\s*english/i.test(v.lang + ' ' + v.name);
    const best     = voices.find((v) => isNotBritish(v) && /en[-_]IE|irish|moira|orla|niamh/i.test(v.lang + ' ' + v.name))
                  || voices.find((v) => isNotBritish(v) && /en[-_]US/i.test(v.lang) && /samantha|karen|victoria|ava|zoe|allison|female/i.test(v.name))
                  || voices.find((v) => isNotBritish(v) && /en[-_]US/i.test(v.lang))
                  || voices.find((v) => isNotBritish(v))
                  || voices[0];
    if (best) utter.voice = best;
    utter.onstart  = () => setSpeaking(true);
    utter.onend    = () => { setSpeaking(false); stopAmpLoop(); };
    utter.onerror  = (e) => { if (e.error !== 'interrupted') { setSpeaking(false); stopAmpLoop(); } };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    _speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      _speak();
    };
    setTimeout(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) _speak();
    }, 500);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// useSpeechRecognition
//
// - interimResults = true  → show partial text so user knows they're heard
// - Silence timer resets on EVERY interim result (user is still speaking)
// - Silence timer only fires final stop when speech goes quiet
// - confidence gate is lenient (Chrome often reports 0)
// ─────────────────────────────────────────────────────────────────────────────
const CONFIDENCE_THRESHOLD = 0.45;
const MIN_TRANSCRIPT_CHARS = 2;
const MIN_WORD_COUNT       = 1;
const SILENCE_TIMEOUT_MS   = 4500;

export function useSpeechRecognition({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);
  const onResultRef  = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  onResultRef.current  = onResult;
  onInterimRef.current = onInterim;

  const recRef       = useRef(null);
  const silenceTimer = useRef(null);
  const deadRef      = useRef(false);
  const gotFinalRef  = useRef(false);
  const blockedRef   = useRef(false); // fatal error (mic denied) — stop restart loops

  const SR = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SR;

  const _clearTimer = () => { clearTimeout(silenceTimer.current); silenceTimer.current = null; };

  const _resetSilenceTimer = useCallback((rec) => {
    _clearTimer();
    silenceTimer.current = setTimeout(() => {
      try { rec?.stop(); } catch {}
    }, SILENCE_TIMEOUT_MS);
  }, []);

  const _killRec = useCallback(() => {
    _clearTimer();
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!SR || blockedRef.current) return;
    _killRec();
    deadRef.current     = false;
    gotFinalRef.current = false;
    setListening(true);

    const rec            = new SR();
    rec.continuous       = false;
    rec.interimResults   = true;
    rec.maxAlternatives  = 1;
    rec.lang             = 'en-US';
    recRef.current       = rec;

    rec.onresult = (e) => {
      let interim   = '';
      let finalText = '';
      let finalConf = 1;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          finalText += r[0].transcript;
          finalConf  = Math.min(finalConf, r[0].confidence ?? 1);
        } else {
          interim += r[0].transcript;
        }
      }

      // Reset silence timer whenever user is speaking (interim or final)
      if (interim || finalText) _resetSilenceTimer(rec);

      if (interim && onInterimRef.current) onInterimRef.current(interim);

      if (finalText) {
        const clean     = finalText.trim();
        const wordCount = clean.split(/\s+/).filter(Boolean).length;
        const tooShort  = clean.length < MIN_TRANSCRIPT_CHARS;
        const tooFew    = wordCount < MIN_WORD_COUNT;
        const isNoise   = finalConf > 0 && finalConf < CONFIDENCE_THRESHOLD;

        onInterimRef.current?.('');
        gotFinalRef.current = true;

        if (!tooShort && !tooFew && !isNoise) {
          onResultRef.current?.(clean);
        }
      }
    };

    rec.onend = () => {
      _clearTimer();
      recRef.current = null;
      if (!deadRef.current) setListening(false);
    };

    rec.onerror = (e) => {
      _clearTimer();
      recRef.current = null;
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) {
        blockedRef.current = true; // permission/device failure — don't auto-restart
      }
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setListening(false);
      }
    };

    try {
      rec.start();
      // Initial silence timer — resets on any speech activity
      _resetSilenceTimer(rec);
    } catch {
      setListening(false);
      recRef.current = null;
    }
  }, [SR, _killRec, _resetSilenceTimer]);

  const stop = useCallback(() => {
    deadRef.current = true;
    _killRec();
    setListening(false);
  }, [_killRec]);

  useEffect(() => () => { deadRef.current = true; _killRec(); }, [_killRec]);

  return { start, stop, listening, supported };
}