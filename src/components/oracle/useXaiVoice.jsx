import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useXaiVoice — xAI Realtime WebSocket voice hook.
 * Single engine, crash-proof. No legacy TTS dependency.
 */

const SESSION_CONFIG = {
  voice: 'ara',
  instructions: "You are Clover, the warm, calm, precise, and curious voice of RockHound-GO. You are an intelligent female field geologist and exploration companion who guides users through rockhounding, mineral identification, map navigation, safety awareness, and specimen collection. Speak in a grounded, confident, observant tone with a slight sense of mystery. Use short, practical phrases suitable for outdoor conditions. Be helpful and discovery-driven without being overly cheerful, robotic, or corporate. Accept natural language references to locations, times, or conditions and interpret them directly. Use tools for any real information retrieval. Prioritize user safety in the field. Stay focused on geology, minerals, terrain, and responsible collecting practices.",
  turn_detection: { type: 'server_vad' },
  tools: [
    { type: 'web_search' },
    { type: 'function', name: 'record_specimen', description: "Log a collected specimen.", parameters: { type: 'object', properties: { mineral_name: { type: 'string' }, location: { type: 'string' }, notes: { type: 'string' } }, required: ['mineral_name', 'location'] } },
    { type: 'function', name: 'get_location_safety', description: 'Safety info for a location.', parameters: { type: 'object', properties: { location: { type: 'string' } }, required: ['location'] } },
  ],
  input_audio_transcription: { model: 'grok-2-audio' },
};

function pcmToBase64(int16Array) {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  const CHUNK = 0x8000;
  let out = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(out);
}

export default function useXaiVoice({ onFindLogged } = {}) {
  const [status, setStatus]             = useState('idle');
  const [transcript, setTranscript]     = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [speaking, setSpeaking]         = useState(false);
  const [listening, setListening]       = useState(false);
  const [error, setError]               = useState(null);

  // Stable refs — never trigger re-renders
  const wsRef            = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const micSourceRef     = useRef(null);
  const workletRef       = useRef(null);
  const micStreamRef     = useRef(null);
  const micBufferRef     = useRef([]);
  const sessionReady     = useRef(false);
  const intentional      = useRef(false);
  const nextPlayAt       = useRef(0);
  const activeSources    = useRef([]);
  const pendingGreeting  = useRef(null);
  const onFindRef        = useRef(onFindLogged);
  onFindRef.current = onFindLogged;

  // ─── Visualisation ───────────────────────────────────────────────
  const getAmplitude = useCallback(() => {
    const an = analyserRef.current;
    if (!an) return 0;
    const buf = new Uint8Array(an.frequencyBinCount);
    an.getByteTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
    return Math.sqrt(s / buf.length);
  }, []);

  const getSpectrum = useCallback(() => {
    const an = analyserRef.current;
    if (!an) return new Uint8Array(0);
    const buf = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(buf);
    return buf;
  }, []);

  // ─── Playback ────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    for (const src of activeSources.current) { try { src.stop(); } catch {} }
    activeSources.current = [];
    nextPlayAt.current = 0;
    setSpeaking(false);
  }, []);

  const playChunk = useCallback((base64) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state === 'closed') return;
    try {
      const raw = atob(base64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const f32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768;
      const buf = ctx.createBuffer(1, f32.length, 24000);
      buf.getChannelData(0).set(f32);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      // Ensure analyser exists (created once)
      if (!analyserRef.current) {
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        an.connect(ctx.destination);
        analyserRef.current = an;
      }
      src.connect(analyserRef.current);
      const now = ctx.currentTime;
      const start = Math.max(now, nextPlayAt.current);
      src.start(start);
      nextPlayAt.current = start + buf.duration;
      activeSources.current.push(src);
      setSpeaking(true);
      src.onended = () => {
        const i = activeSources.current.indexOf(src);
        if (i !== -1) activeSources.current.splice(i, 1);
        if (activeSources.current.length === 0) setSpeaking(false);
      };
    } catch { /* malformed chunk — skip */ }
  }, []);

  // ─── Tool handling ───────────────────────────────────────────────
  const handleTool = useCallback(async (name, argsJson) => {
    const args = (() => { try { return JSON.parse(argsJson || '{}'); } catch { return {}; } })();
    let result;
    try {
      if (name === 'record_specimen') {
        const res = await base44.functions.invoke('parseSpecimenDictation', {
          transcript: `${args.mineral_name} found at ${args.location}. ${args.notes || ''}`,
          create: true,
        });
        const created = res?.data?.created;
        if (created?.mineral_name) onFindRef.current?.(created.mineral_name);
        result = { success: true, mineral: created?.mineral_name || args.mineral_name };
      } else if (name === 'get_location_safety') {
        result = { success: true, safety: 'Area appears accessible. Always verify land ownership before collecting.' };
      } else {
        result = { success: true };
      }
    } catch (e) {
      result = { error: e.message };
    }
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: name, output: JSON.stringify(result) } }));
      ws.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  // ─── Cleanup ─────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    stopPlayback();
    if (workletRef.current) { try { workletRef.current.disconnect(); } catch {} workletRef.current = null; }
    if (micSourceRef.current) { try { micSourceRef.current.disconnect(); } catch {} micSourceRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    analyserRef.current = null;
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    micBufferRef.current = [];
    sessionReady.current = false;
    pendingGreeting.current = null;
  }, [stopPlayback]);

  // ─── Connect ─────────────────────────────────────────────────────
  const connect = useCallback(async (greetingText) => {
    if (wsRef.current) return; // already connected
    intentional.current = false;
    pendingGreeting.current = greetingText || null;
    setStatus('connecting');
    setTranscript('');
    setUserTranscript('');

    // AudioContext — must be inside user gesture
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {}); // non-fatal on iOS if gesture is slightly stale
      }
    } catch (e) {
      console.warn('[xAI] AudioContext failed:', e);
      setStatus('error');
      return;
    }

    // Mic — non-fatal if denied (text-only fallback)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;

      // Try AudioWorklet; fall back to ScriptProcessor
      try {
        await ctx.audioWorklet.addModule('/pcm-processor-worklet.js');
        const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
        workletRef.current = worklet;
        const src = ctx.createMediaStreamSource(stream);
        micSourceRef.current = src;
        src.connect(worklet);
        worklet.port.onmessage = (e) => {
          if (micBufferRef.current.length > 300) micBufferRef.current.shift();
          if (sessionReady.current && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: pcmToBase64(e.data) }));
          } else {
            micBufferRef.current.push(e.data);
          }
        };
      } catch {
        // Worklet unavailable — text-only mode, mic stream still stopped on cleanup
      }
      setListening(true);
    } catch {
      // Mic denied — continue without it
    }

    // Token
    let token;
    try {
      const res = await base44.functions.invoke('xaiVoiceToken', {});
      token = res?.data?.token;
      if (!token) throw new Error('no token');
    } catch {
      setStatus('error');
      cleanup();
      return;
    }

    // WebSocket
    const ws = new WebSocket(
      'wss://api.x.ai/v1/realtime?model=grok-voice-latest',
      [`xai-client-secret.${token}`]
    );
    wsRef.current = ws;

    // Abort if connection takes too long
    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) { ws.close(); }
    }, 12000);

    ws.onopen = () => {
      clearTimeout(timeout);
      ws.send(JSON.stringify({ type: 'session.update', session: SESSION_CONFIG }));
    };

    ws.onmessage = ({ data }) => {
      let ev;
      try { ev = JSON.parse(data); } catch { return; }

      switch (ev.type) {
        case 'session.updated':
          if (!sessionReady.current) {
            sessionReady.current = true;
            setStatus('active');
            // Flush buffered mic audio
            for (const chunk of micBufferRef.current) {
              if (ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: pcmToBase64(chunk) }));
            }
            micBufferRef.current = [];
            // Send greeting now that session is live
            const g = pendingGreeting.current;
            if (g && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: g }] } }));
              ws.send(JSON.stringify({ type: 'response.create' }));
              pendingGreeting.current = null;
            }
          }
          break;

        case 'input_audio_buffer.speech_started':
          setListening(true);
          stopPlayback();
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'response.cancel' }));
          break;

        case 'input_audio_buffer.speech_stopped':
          setListening(false);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          setUserTranscript(ev.transcript || '');
          break;

        case 'response.created':
          setTranscript('');
          break;

        case 'response.output_audio.delta':
          playChunk(ev.delta);
          break;

        case 'response.output_audio_transcript.delta':
          setTranscript(prev => prev + (ev.delta || ''));
          break;

        case 'response.function_call_arguments.done':
          handleTool(ev.name, ev.arguments);
          break;

        case 'response.done':
          // Final guard — if no chunks landed, clear speaking
          if (activeSources.current.length === 0) setSpeaking(false);
          break;

        case 'error':
          console.warn('[xAI]', ev.message);
          break;
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      clearTimeout(timeout);
      setListening(false);
      setSpeaking(false);
      if (!intentional.current) setStatus('error');
      else setStatus('idle');
      cleanup();
    };

    ws.onerror = () => {
      // onclose will follow — just mark as non-intentional crash
    };
  }, [cleanup, stopPlayback, playChunk, handleTool]);

  // ─── Disconnect ──────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    intentional.current = true;
    const ws = wsRef.current;
    wsRef.current = null;
    ws?.close();
    setStatus('idle');
    setListening(false);
    setSpeaking(false);
    setTranscript('');
    setUserTranscript('');
    cleanup();
  }, [cleanup]);

  // ─── Send text ───────────────────────────────────────────────────
  const sendText = useCallback((text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } }));
    ws.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  // Teardown on unmount
  useEffect(() => () => {
    intentional.current = true;
    wsRef.current?.close();
    cleanup();
  }, [cleanup]);

  return { connect, disconnect, sendText, status, transcript, userTranscript, speaking, listening, getAmplitude, getSpectrum };
}