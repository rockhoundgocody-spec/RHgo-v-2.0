import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSpeechRecognition } from './useSpeech';
import useMicLevel from '@/lib/useMicLevel';
import { createBarSampler } from '@/lib/micBars';
import { assessTranscript } from '@/lib/cloverVoice';

/**
 * useVoiceInput — unified voice input for Clover's ears.
 * Uses native SpeechRecognition where available (Chrome/Android).
 * Falls back to MediaRecorder + Whisper transcription on browsers
 * without SpeechRecognition (iOS Safari / PWA).
 *
 * Interface: { start, stop, listening, supported, getBars }.
 * getBars(out) fills the live input levels the waveform draws — real mic data
 * on both paths, and zeros (never a crash) when the mic can't be opened.
 * onResult(text, meta) carries the engine's confidence for that utterance.
 */

const SILENCE_STOP_MS = 1800;  // stop after this much quiet following speech
const MAX_RECORD_MS   = 16000; // hard cap per recording
const VOICE_RMS       = 0.028; // speech detection threshold

function useRecorderTranscription({ onResult, onInterim, onRejected } = {}) {
  const [listening, setListening] = useState(false);

  const onResultRef   = useRef(onResult);
  const onInterimRef  = useRef(onInterim);
  const onRejectedRef = useRef(onRejected);
  onResultRef.current   = onResult;
  onInterimRef.current  = onInterim;
  onRejectedRef.current = onRejected;

  const recRef       = useRef(null);
  const streamRef    = useRef(null);
  const ctxRef       = useRef(null);
  const analyserRef  = useRef(null);
  const samplerRef   = useRef(null);
  const rafRef       = useRef(null);
  const deadRef      = useRef(false);
  const runningRef   = useRef(false);

  if (!samplerRef.current) samplerRef.current = createBarSampler();

  const getBars = useCallback((out) => samplerRef.current.sample(analyserRef.current, out), []);

  const cleanup = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      const ctx = ctxRef.current;
      ctxRef.current = null;
      if (ctx.state !== 'closed') { try { ctx.close().catch(() => {}); } catch {} }
    }
    recRef.current = null;
  }, []);

  const stop = useCallback(() => {
    deadRef.current = true;
    try {
      if (recRef.current?.state === 'recording') recRef.current.stop();
    } catch {}
    cleanup();
    setListening(false);
  }, [cleanup]);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return;
    deadRef.current = false;
    runningRef.current = true;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
    } catch {
      runningRef.current = false;
      return;
    }
    if (deadRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      runningRef.current = false;
      return;
    }
    streamRef.current = stream;

    const mime =
      MediaRecorder.isTypeSupported?.('audio/webm') ? 'audio/webm'
      : MediaRecorder.isTypeSupported?.('audio/mp4') ? 'audio/mp4'
      : '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recRef.current = rec;

    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };

    // Silence detection — auto-stop once the user has spoken and gone quiet.
    // The same analyser feeds the waveform, so no second mic stream is opened.
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.6;
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const startedAt = Date.now();
    let spoke = false;
    let lastVoiceAt = Date.now();

    const tick = () => {
      if (!runningRef.current || rec.state !== 'recording') return;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      if (rms > VOICE_RMS) { spoke = true; lastVoiceAt = Date.now(); }
      const now = Date.now();
      if ((spoke && now - lastVoiceAt > SILENCE_STOP_MS) || now - startedAt > MAX_RECORD_MS) {
        try { rec.stop(); } catch {}
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rec.onstop = async () => {
      const wasDead = deadRef.current;
      const hadSpeech = spoke;
      const mimeType = rec.mimeType || mime || 'audio/webm';
      cleanup();

      if (wasDead || !hadSpeech || chunks.length === 0) {
        setListening(false);
        return;
      }

      try {
        onInterimRef.current?.('Transcribing…');
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File(chunks, `voice.${ext}`, { type: mimeType });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
        onInterimRef.current?.('');
        setListening(false);
        if (deadRef.current) return;

        // Whisper reports no confidence, so the gate here is shape only — the
        // same cleanup still repairs mis-heard field words.
        const verdict = assessTranscript(transcript, null);
        if (verdict.ok) {
          onResultRef.current?.(verdict.text, { confidence: null, soft: false, reason: 'ok' });
        } else if (verdict.reason !== 'empty') {
          onRejectedRef.current?.(verdict.reason);
        }
      } catch {
        onInterimRef.current?.('');
        setListening(false);
      }
    };

    rec.start();
    setListening(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [cleanup]);

  useEffect(() => () => { deadRef.current = true; cleanup(); }, [cleanup]);

  const supported =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia;

  return { start, stop, listening, supported, getBars };
}

export default function useVoiceInput(opts) {
  const srSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const sr       = useSpeechRecognition(opts);
  const recorder = useRecorderTranscription(opts);

  // The recognizer gives no levels of its own, so a meter stream runs only
  // while it is actually listening — short-lived, and it degrades to silence.
  const meter = useMicLevel(srSupported && sr.listening);

  if (srSupported) {
    return {
      start: sr.start,
      stop: sr.stop,
      listening: sr.listening,
      supported: true,
      getBars: meter.getBars,
    };
  }
  return {
    start: recorder.start,
    stop: recorder.stop,
    listening: recorder.listening,
    supported: recorder.supported,
    getBars: recorder.getBars,
  };
}