import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSpeechRecognition } from './useSpeech';

/**
 * useVoiceInput — unified voice input for the orb.
 * Uses native SpeechRecognition where available (Chrome/Android).
 * Falls back to MediaRecorder + Whisper transcription on browsers
 * without SpeechRecognition (iOS Safari / PWA).
 * Same interface as useSpeechRecognition: { start, stop, listening, supported }.
 */

const SILENCE_STOP_MS = 1800;  // stop after this much quiet following speech
const MAX_RECORD_MS   = 16000; // hard cap per recording
const VOICE_RMS       = 0.028; // speech detection threshold

function useRecorderTranscription({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);

  const onResultRef  = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  onResultRef.current  = onResult;
  onInterimRef.current = onInterim;

  const recRef       = useRef(null);
  const streamRef    = useRef(null);
  const ctxRef       = useRef(null);
  const rafRef       = useRef(null);
  const deadRef      = useRef(false);
  const runningRef   = useRef(false);

  const cleanup = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
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

    // Silence detection — auto-stop once the user has spoken and gone quiet
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
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
        const clean = String(transcript || '').trim();
        setListening(false);
        if (clean.length >= 2 && !deadRef.current) onResultRef.current?.(clean);
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

  return { start, stop, listening, supported };
}

export default function useVoiceInput(opts) {
  const srSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const sr       = useSpeechRecognition(opts);
  const recorder = useRecorderTranscription(opts);

  return srSupported ? sr : recorder;
}