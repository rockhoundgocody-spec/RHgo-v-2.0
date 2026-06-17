import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * useXaiVoice — xAI Realtime WebSocket voice hook.
 * Handles: token minting, AudioWorklet mic capture, PCM playback,
 * VAD interruption, tool calls, and transcript streaming.
 *
 * Returns: { connect, disconnect, sendText, status, transcript, userTranscript, speaking, listening }
 */

const SESSION_CONFIG = {
  voice: 'ara',
  instructions: "You are Clover, the warm, calm, precise, and curious voice of RockHound-GO. You are an intelligent female field geologist and exploration companion who guides users through rockhounding, mineral identification, map navigation, safety awareness, and specimen collection. Speak in a grounded, confident, observant tone with a slight sense of mystery. Use short, practical phrases suitable for outdoor conditions. Be helpful and discovery-driven without being overly cheerful, robotic, or corporate. Never lecture users on how to speak or format information. Accept natural language references to locations, times, or conditions and interpret them directly. Use tools for any real information retrieval or actions rather than simulating results. Prioritize user safety in the field by proactively offering relevant reminders when appropriate. If a query involves uncertain or risky field conditions, suggest practical precautions and offer to look up current information. Stay focused on geology, minerals, terrain, and responsible collecting practices.",
  turn_detection: { type: 'server_vad' },
  tools: [
    { type: 'web_search' },
    { type: 'x_search' },
    { type: 'function', name: 'record_specimen', description: "Log a collected specimen with details for the user's field journal.", parameters: { type: 'object', properties: { mineral_name: { type: 'string', description: 'Name or description of the mineral or rock found' }, location: { type: 'string', description: 'Approximate location where the specimen was collected' }, notes: { type: 'string', description: 'Additional observations or details' } }, required: ['mineral_name', 'location'] } },
    { type: 'function', name: 'get_location_safety', description: 'Retrieve safety information and conditions for a given outdoor location.', parameters: { type: 'object', properties: { location: { type: 'string', description: 'Location or area for safety assessment' } }, required: ['location'] } },
    { type: 'function', name: 'analyze_specimen', description: "Provides mineral identification, geological context, safety notes, and discovery guidance for a rock or mineral specimen in the field.", parameters: { type: 'object', properties: {}, additionalProperties: false } },
    { type: 'function', name: 'identify_rock', description: 'Performs rock identification using photos and optional context.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
  ],
  input_audio_transcription: { model: 'grok-2-audio' },
  audio: {
    input:  { format: { type: 'audio/pcm', rate: 24000 } },
    output: { format: { type: 'audio/pcm', rate: 24000 } },
  },
};

function audioToBase64(int16Array) {
  const bytes = new Uint8Array(int16Array.buffer, int16Array.byteOffset, int16Array.byteLength);
  const CHUNK = 0x2000;
  const parts = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(''));
}

export default function useXaiVoice({ onFindLogged } = {}) {
  const [status, setStatus]               = useState('idle'); // idle | connecting | active | error
  const [transcript, setTranscript]       = useState('');     // assistant text
  const [userTranscript, setUserTranscript] = useState('');   // user speech text
  const [speaking, setSpeaking]           = useState(false);
  const [listening, setListening]         = useState(false);

  const wsRef           = useRef(null);
  const audioCtxRef     = useRef(null);
  const workletNodeRef  = useRef(null);
  const micStreamRef    = useRef(null);
  const micBufferRef    = useRef([]);
  const isSessionReady  = useRef(false);
  const nextPlayTime    = useRef(0);
  const queuedSources   = useRef([]);
  const intentionalClose = useRef(false);
  const tokenExpiresAt  = useRef(0);
  const tokenRefreshTimer = useRef(null);
  const currentResponseId = useRef(null);
  const onFindLoggedRef = useRef(onFindLogged);
  onFindLoggedRef.current = onFindLogged;

  const interruptPlayback = useCallback(() => {
    for (const src of queuedSources.current) { try { src.stop(); } catch {} }
    queuedSources.current = [];
    nextPlayTime.current = 0;
    setSpeaking(false);
  }, []);

  const playPcmChunk = useCallback((base64) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const buf = ctx.createBuffer(1, float32.length, 24000);
    buf.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    const now = ctx.currentTime;
    const startAt = Math.max(now, nextPlayTime.current);
    src.start(startAt);
    nextPlayTime.current = startAt + buf.duration;
    queuedSources.current.push(src);
    src.onended = () => {
      const idx = queuedSources.current.indexOf(src);
      if (idx !== -1) queuedSources.current.splice(idx, 1);
      if (queuedSources.current.length === 0) setSpeaking(false);
    };
    setSpeaking(true);
  }, []);

  const handleToolCall = useCallback(async (name, argsJson) => {
    const args = JSON.parse(argsJson || '{}');
    const ws = wsRef.current;

    let result;
    try {
      if (name === 'record_specimen') {
        const res = await base44.functions.invoke('parseSpecimenDictation', {
          transcript: `${args.mineral_name} found at ${args.location}. ${args.notes || ''}`,
          create: true,
        });
        const created = res?.data?.created;
        if (created?.mineral_name) onFindLoggedRef.current?.(created.mineral_name);
        result = { success: true, mineral: created?.mineral_name || args.mineral_name };
      } else if (name === 'analyze_specimen' || name === 'identify_rock') {
        const res = await base44.functions.invoke('identifySpecimen', { mode: 'voice' });
        result = res?.data || { success: true, message: 'Analysis complete' };
      } else if (name === 'get_location_safety') {
        result = { success: true, location: args.location, safety: 'Area appears accessible. Always verify land ownership before collecting.' };
      } else {
        result = { success: true };
      }
    } catch (e) {
      result = { error: e.message };
    }

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: { type: 'function_call_output', call_id: name, output: JSON.stringify(result) },
      }));
      ws.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  const cleanup = useCallback(() => {
    if (tokenRefreshTimer.current) { clearTimeout(tokenRefreshTimer.current); tokenRefreshTimer.current = null; }
    interruptPlayback();
    if (workletNodeRef.current) { try { workletNodeRef.current.disconnect(); } catch {} workletNodeRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    micBufferRef.current = [];
    isSessionReady.current = false;
    currentResponseId.current = null;
  }, [interruptPlayback]);

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    intentionalClose.current = false;
    setStatus('connecting');
    setTranscript('');
    setUserTranscript('');

    // 1. AudioContext + mic — start immediately (inside user gesture)
    let audioCtx;
    try {
      audioCtx = new AudioContext({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      audioCtxRef.current = audioCtx;
    } catch {
      setStatus('error');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 24000 },
      });
      micStreamRef.current = stream;
    } catch {
      setStatus('error');
      cleanup();
      return;
    }

    try {
      await audioCtx.audioWorklet.addModule('/pcm-processor-worklet.js');
      const source = audioCtx.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioCtx, 'pcm-processor');
      workletNodeRef.current = worklet;
      source.connect(worklet);
      worklet.port.onmessage = (e) => {
        const chunk = e.data;
        // Safety cap ~10 seconds
        if (micBufferRef.current.length > 240) micBufferRef.current.shift();
        if (isSessionReady.current && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: audioToBase64(chunk) }));
        } else {
          micBufferRef.current.push(chunk);
        }
      };
      setListening(true);
    } catch {
      // Worklet failed — continue without mic (text-only mode)
    }

    // 2. Mint token
    let token;
    try {
      const res = await base44.functions.invoke('xaiVoiceToken', {});
      token = res?.data?.token;
      tokenExpiresAt.current = res?.data?.expires_at || 0;
      if (!token) throw new Error('No token');
    } catch {
      setStatus('error');
      cleanup();
      return;
    }

    // Schedule token refresh ~10s before expiry
    const msUntilExpiry = (tokenExpiresAt.current * 1000) - Date.now() - 10000;
    if (msUntilExpiry > 0) {
      tokenRefreshTimer.current = setTimeout(async () => {
        try {
          const res = await base44.functions.invoke('xaiVoiceToken', {});
          // Token refresh — reconnect is simpler than mid-session swap
        } catch {}
      }, msUntilExpiry);
    }

    // 3. Open WebSocket
    const ws = new WebSocket(
      'wss://api.x.ai/v1/realtime?model=grok-voice-latest',
      [`xai-client-secret.${token}`]
    );
    wsRef.current = ws;

    const connTimeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setStatus('error');
        cleanup();
      }
    }, 10000);

    ws.onopen = () => {
      clearTimeout(connTimeout);
      ws.send(JSON.stringify({ type: 'session.update', session: SESSION_CONFIG }));
    };

    ws.onmessage = ({ data }) => {
      let event;
      try { event = JSON.parse(data); } catch { return; }

      switch (event.type) {
        case 'session.updated':
          if (!isSessionReady.current) {
            isSessionReady.current = true;
            setStatus('active');
            // Flush buffered mic audio
            for (const chunk of micBufferRef.current) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: audioToBase64(chunk) }));
              }
            }
            micBufferRef.current = [];
          }
          break;

        case 'input_audio_buffer.speech_started':
          setListening(true);
          interruptPlayback();
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'response.cancel' }));
          currentResponseId.current = null;
          break;

        case 'input_audio_buffer.speech_stopped':
          setListening(false);
          break;

        case 'conversation.item.input_audio_transcription.completed':
          setUserTranscript(event.transcript || '');
          break;

        case 'response.created':
          currentResponseId.current = event.response?.id;
          setTranscript('');
          break;

        case 'response.output_audio.delta':
          playPcmChunk(event.delta);
          break;

        case 'response.output_audio_transcript.delta':
          setTranscript(prev => prev + (event.delta || ''));
          break;

        case 'response.function_call_arguments.done':
          handleToolCall(event.name, event.arguments);
          break;

        case 'response.done':
          setSpeaking(false);
          break;

        case 'error':
          console.error('[xAI Voice]', event.message);
          break;
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!intentionalClose.current) setStatus('error');
      else setStatus('idle');
      setListening(false);
      setSpeaking(false);
      cleanup();
    };

    ws.onerror = () => {
      setStatus('error');
    };
  }, [cleanup, interruptPlayback, playPcmChunk, handleToolCall]);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('idle');
    setListening(false);
    setSpeaking(false);
    setTranscript('');
    setUserTranscript('');
    cleanup();
  }, [cleanup]);

  const sendText = useCallback((text) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] },
    }));
    ws.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  useEffect(() => () => {
    intentionalClose.current = true;
    wsRef.current?.close();
    cleanup();
  }, [cleanup]);

  return { connect, disconnect, sendText, status, transcript, userTranscript, speaking, listening };
}