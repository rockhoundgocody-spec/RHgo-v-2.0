import { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { assessTranscript, prepareTextForSpeech } from '@/lib/cloverVoice';

// In-memory LRU cache of decoded AudioBuffers so common openers, quiz lines,
// and repeated phrases play instantaneously with zero network delay.
const TTS_BUFFER_CACHE = new Map();
const MAX_CACHE_ENTRIES = 24;

// ─────────────────────────────────────────────────────────────────────────────
// useSpeechSynthesis
// Google Cloud TTS via synthesizeSpeech backend → Warm Web Audio vocal chain +
// analyser for amplitude/spectrum. Falls back to browser TTS on backend failure.
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
    const freqBuf = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const tick = () => {
      let b = 0, m = 0, t = 0, amp = 0;
      if (analyser && freqBuf) {
        analyser.getByteFrequencyData(freqBuf);
        const len = freqBuf.length;
        const bassEnd = Math.floor(len * 0.1);
        const midEnd  = Math.floor(len * 0.45);

        let bassSum = 0, midSum = 0, trebleSum = 0;
        for (let i = 0;        i < bassEnd; i++) bassSum   += freqBuf[i];
        for (let i = bassEnd;  i < midEnd;  i++) midSum    += freqBuf[i];
        for (let i = midEnd;   i < len;     i++) trebleSum += freqBuf[i];

        b   = bassSum   / (bassEnd * 255);
        m   = midSum    / ((midEnd - bassEnd) * 255);
        t   = trebleSum / ((len - midEnd) * 255);
        amp = b * 0.5 + m * 0.35 + t * 0.15;
      }

      // Guarantee lively speaking animation even if browser TTS fallback is active
      // or audio buffer has soft passages so Clover visually pulses while heard.
      if (amp < 0.04) {
        const now = performance.now() * 0.008;
        const cadence = 0.32 + 0.28 * Math.sin(now * 1.9) + 0.18 * Math.cos(now * 3.1);
        b = Math.max(b, cadence * 0.85);
        m = Math.max(m, cadence);
        t = Math.max(t, cadence * 0.65);
        amp = Math.max(amp, cadence * 0.9);
      }

      bassRef.current      += (b   - bassRef.current)      * 0.18;
      midRef.current       += (m   - midRef.current)       * 0.18;
      trebleRef.current    += (t   - trebleRef.current)    * 0.18;
      amplitudeRef.current += (amp - amplitudeRef.current) * 0.16;

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

      const spokenText = prepareTextForSpeech(String(text)).slice(0, 800);
      const chosenVoice = voiceConfig.voice || 'honey';
      const cacheKey = `${chosenVoice}::${spokenText}`;

      let audioBuffer = TTS_BUFFER_CACHE.get(cacheKey);
      if (!audioBuffer) {
        const { getOrCreateGuestId } = await import('@/lib/guestDevice');
        const res = await base44.functions.invoke('synthesizeSpeech', {
          text:  spokenText,
          voice: chosenVoice,
          guest_device_id: getOrCreateGuestId(),
        });

        const audioUrl = res?.data?.audioUrl;
        if (!audioUrl) throw new Error('No audio URL returned');

        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) throw new Error('Audio fetch failed');
        const arrayBuf = await audioRes.arrayBuffer();

        if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
        audioBuffer = await ctx.decodeAudioData(arrayBuf);

        if (TTS_BUFFER_CACHE.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = TTS_BUFFER_CACHE.keys().next().value;
          TTS_BUFFER_CACHE.delete(oldestKey);
        }
        TTS_BUFFER_CACHE.set(cacheKey, audioBuffer);
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.52;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      const rate = Number(voiceConfig.rate);
      source.playbackRate.value = Number.isFinite(rate) ? Math.min(1.18, Math.max(0.88, rate)) : 0.98;

      // Vocal presence & outdoor clarity chain:
      // 1) 85Hz high-pass removes low rumble
      // 2) 220Hz warm body boost (+1.5dB)
      // 3) 3.1kHz articulation boost (+2dB) for crisp consonants in wind
      // 4) Gentle compressor evens out volume
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 85;

      const warmth = ctx.createBiquadFilter();
      warmth.type = 'peaking';
      warmth.frequency.value = 220;
      warmth.Q.value = 0.9;
      warmth.gain.value = 1.5;

      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 3100;
      presence.Q.value = 1.1;
      presence.gain.value = 2.0;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 18;
      compressor.ratio.value = 2.5;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.14;

      const gainNode = ctx.createGain();
      gainNode.gain.value = voiceConfig.volume ?? 0.96;

      source.connect(highpass);
      highpass.connect(warmth);
      warmth.connect(presence);
      presence.connect(compressor);
      compressor.connect(analyser);
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

  const cleanText = prepareTextForSpeech(String(text));

  const _speak = () => {
    const utter    = new SpeechSynthesisUtterance(cleanText);
    utter.lang     = 'en-US';
    utter.rate     = voiceConfig.rate || 0.96;
    utter.pitch    = voiceConfig.pitch || 1.03;
    utter.volume   = voiceConfig.volume ?? 1.0;
    const voices   = window.speechSynthesis.getVoices();
    // Prioritize natural neural/premium voices and warm Irish-American female voices, avoiding British (en-GB).
    const isNotBritish = (v) => !/en[-_]GB|british|uk\s*english/i.test(v.lang + ' ' + v.name);
    const best     = voices.find((v) => isNotBritish(v) && /en[-_]IE|irish|moira|orla|niamh/i.test(v.lang + ' ' + v.name))
                  || voices.find((v) => isNotBritish(v) && /en[-_]US/i.test(v.lang) && /natural|neural|premium|enhanced|ava|allison|samantha|zoe/i.test(v.name))
                  || voices.find((v) => isNotBritish(v) && /en[-_]US/i.test(v.lang) && /karen|victoria|female/i.test(v.name))
                  || voices.find((v) => isNotBritish(v) && /en[-_]US/i.test(v.lang))
                  || voices.find((v) => isNotBritish(v))
                  || voices[0];
    if (best) utter.voice = best;
    utter.onstart  = () => { setSpeaking(true); startAmpLoop(null); };
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
// - Final transcripts go through the cloverVoice confidence gate: an utterance
//   the engine scored below the floor is refused (onRejected) rather than acted
//   on, and field words the engine mis-heard are repaired first
// ─────────────────────────────────────────────────────────────────────────────
const SILENCE_TIMEOUT_MS = 4200;
const END_OF_THOUGHT_PAUSE_MS = 1650;

export function useSpeechRecognition({ onResult, onInterim, onRejected } = {}) {
  const [listening, setListening] = useState(false);
  const onResultRef   = useRef(onResult);
  const onInterimRef  = useRef(onInterim);
  const onRejectedRef = useRef(onRejected);
  onResultRef.current   = onResult;
  onInterimRef.current  = onInterim;
  onRejectedRef.current = onRejected;

  const recRef          = useRef(null);
  const silenceTimer    = useRef(null);
  const endThoughtTimer = useRef(null);
  const deadRef         = useRef(false);
  const gotFinalRef     = useRef(false);
  const blockedRef      = useRef(false); // fatal error (mic denied) — stop restart loops

  const SR = typeof window !== 'undefined'
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SR;

  const _clearTimer = () => {
    clearTimeout(silenceTimer.current);
    silenceTimer.current = null;
    clearTimeout(endThoughtTimer.current);
    endThoughtTimer.current = null;
  };

  const _resetSilenceTimer = useCallback((rec) => {
    clearTimeout(silenceTimer.current);
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
    rec.continuous       = true;
    rec.interimResults   = true;
    rec.maxAlternatives  = 3;
    rec.lang             = 'en-US';
    recRef.current       = rec;

    const commitAccumulatedSpeech = (fullTranscript, minConfidence) => {
      if (deadRef.current) return;
      const verdict = assessTranscript(fullTranscript, minConfidence);
      onInterimRef.current?.('');
      gotFinalRef.current = true;

      if (verdict.ok) {
        deadRef.current = true;
        _clearTimer();
        try { rec.stop(); } catch {}
        onResultRef.current?.(verdict.text, {
          confidence: verdict.confidence,
          soft: verdict.soft,
          reason: verdict.reason,
        });
      } else if (verdict.reason !== 'empty') {
        deadRef.current = true;
        _clearTimer();
        try { rec.stop(); } catch {}
        onRejectedRef.current?.(verdict.reason);
      }
    };

    rec.onresult = (e) => {
      let interim   = '';
      let fullFinal = '';
      let finalConf = null;

      // Read ALL results from index 0 so taking a breath mid-sentence never loses
      // the first half of what the user said.
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        let best = r[0];
        for (let a = 1; a < r.length; a++) {
          if ((r[a].confidence || 0) > (best.confidence || 0)) best = r[a];
        }
        if (r.isFinal) {
          fullFinal += ' ' + best.transcript;
          const score = Number(best.confidence);
          if (Number.isFinite(score) && score > 0) {
            finalConf = finalConf == null ? score : Math.min(finalConf, score);
          }
        } else {
          interim += ' ' + best.transcript;
        }
      }

      const combinedPreview = `${fullFinal} ${interim}`.replace(/\s+/g, ' ').trim();
      if (combinedPreview) {
        _resetSilenceTimer(rec);
        onInterimRef.current?.(combinedPreview);
      }

      // Wait for a genuine end-of-thought pause (1.65s of quiet after speaking)
      // instead of cutting the user off on their first breath.
      clearTimeout(endThoughtTimer.current);
      if (fullFinal.trim() || interim.trim()) {
        endThoughtTimer.current = setTimeout(() => {
          const textToCommit = `${fullFinal} ${interim}`.replace(/\s+/g, ' ').trim();
          if (textToCommit) {
            commitAccumulatedSpeech(textToCommit, finalConf);
          }
        }, END_OF_THOUGHT_PAUSE_MS);
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