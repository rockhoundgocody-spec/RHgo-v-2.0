import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { voiceErrorMessage } from '@/lib/voiceErrors';
import voiceTimeout from '@/lib/voiceTimeout';

export default function useRecorderTranscription({ onResult, onInterim } = {}) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const callbacks = useRef({ onResult, onInterim });
  callbacks.current = { onResult, onInterim };
  const generation = useRef(0);
  const resources = useRef(null);
  const busy = useRef(false);
  const release = useCallback(() => {
    const r = resources.current;
    resources.current = null;
    if (!r) return;
    cancelAnimationFrame(r.frame);
    clearTimeout(r.timer);
    r.stream.getTracks().forEach(t => t.stop());
    if (r.ctx?.state !== 'closed') r.ctx?.close().catch(() => {});
  }, []);
  const stop = useCallback(() => {
    generation.current += 1;
    const rec = resources.current?.rec;
    if (rec) { rec.onstop = null; rec.onerror = null; if (rec.state === 'recording') rec.stop(); }
    release(); busy.current = false;
    setListening(false); callbacks.current.onInterim?.('');
  }, [release]);
  const supported = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!(window.AudioContext || window.webkitAudioContext);
  const start = useCallback(async () => {
    if (busy.current) return;
    if (!supported) { setError('Voice input is unavailable in this browser. You can still type a question.'); return; }
    const token = ++generation.current;
    const current = () => token === generation.current;
    busy.current = true; setError(''); setListening(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false });
      if (!current()) { stream.getTracks().forEach(t => t.stop()); return; }
      const r = { stream, frame: null, timer: null, ctx: null, rec: null };
      resources.current = r;
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      r.rec = rec;
      const chunks = [];
      rec.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
      const Ctx = window.AudioContext || window.webkitAudioContext;
      r.ctx = new Ctx();
      if (r.ctx.state === 'suspended') await r.ctx.resume();
      if (!current()) return;
      const analyser = r.ctx.createAnalyser(); analyser.fftSize = 512;
      r.ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let spoke = false, lastVoice = Date.now();
      const fail = code => { if (!current()) return; release(); busy.current = false; setListening(false); setError(voiceErrorMessage(code)); };
      rec.onerror = () => { rec.onstop = null; fail('recorder'); };
      rec.onstop = async () => {
        if (!current()) return;
        release();
        if (!spoke || !chunks.length) { busy.current = false; setListening(false); return; }
        try {
          callbacks.current.onInterim?.('Transcribing…');
          const type = rec.mimeType || mime || 'audio/webm';
          const file = new File(chunks, type.includes('mp4') ? 'voice.mp4' : 'voice.webm', { type });
          const { file_uri } = await voiceTimeout(base44.integrations.Core.UploadPrivateFile({ file }));
          if (!current()) return;
          const { signed_url } = await voiceTimeout(base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 300 }));
          if (!current()) return;
          const text = await voiceTimeout(base44.integrations.Core.TranscribeAudio({ audio_url: signed_url }));
          if (!current()) return;
          busy.current = false; setListening(false); callbacks.current.onInterim?.('');
          const clean = String(text || '').trim();
          if (clean.length >= 2) callbacks.current.onResult?.(clean);
        } catch { if (current()) { callbacks.current.onInterim?.(''); fail('network'); } }
      };
      const tick = () => {
        if (!current() || rec.state !== 'recording') return;
        analyser.getByteTimeDomainData(buf);
        const rms = Math.sqrt(buf.reduce((sum, v) => sum + ((v - 128) / 128) ** 2, 0) / buf.length);
        if (rms > 0.022) { spoke = true; lastVoice = Date.now(); }
        if (spoke && Date.now() - lastVoice > 1800) { rec.stop(); return; }
        r.frame = requestAnimationFrame(tick);
      };
      rec.start();
      r.timer = setTimeout(() => { if (current() && rec.state === 'recording') rec.stop(); }, 16000);
      r.frame = requestAnimationFrame(tick);
    } catch (e) {
      if (!current()) return;
      release(); busy.current = false; setListening(false); setError(voiceErrorMessage(e?.name));
    }
  }, [supported, release]);
  useEffect(() => () => { generation.current += 1; const rec = resources.current?.rec; if (rec) { rec.onstop = null; rec.onerror = null; if (rec.state === 'recording') rec.stop(); } release(); }, [release]);
  return { start, stop, listening, supported, error };
}