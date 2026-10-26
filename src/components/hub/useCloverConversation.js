import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import useBargeIn from './useBargeIn';
import { getCognitiveMemoryContext } from '@/lib/cloverMemory';
import { applyCloverUtterance, getCloverBrain } from '@/lib/cloverRuntime';
import { setCloverBusy, emit } from '@/lib/cloverWake';
import { rejectionLine } from '@/lib/cloverVoice';

const MAX_QUIET_TURNS = 3;
const HISTORY_TURNS = 12;

export default function useCloverConversation({
  companion, todaysSpecimens = 0, recentFinds = [], onFindLogged,
} = {}) {
  const [phase, setPhase] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState('');
  const [muted, setMuted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const activeRef  = useRef(false);
  const mutedRef   = useRef(false);
  const phaseRef   = useRef('idle');
  const historyRef = useRef([]);
  const sawSpeakingRef = useRef(false);
  const spokenMsRef = useRef(8000);
  const quietTurnsRef = useRef(0);
  const gotResultRef = useRef(false);
  const recentFindsRef = useRef(recentFinds);
  const sendRef = useRef(null);
  const sayRef = useRef(null);

  phaseRef.current = phase;
  mutedRef.current = muted;
  recentFindsRef.current = recentFinds;

  const { speak, stop: stopSpeech, speaking, getAmplitude, getSpectrum, unlock } = useSpeechSynthesis();

  const voice = useVoiceInput({
    onResult: (text, meta) => {
      gotResultRef.current = true;
      quietTurnsRef.current = 0;
      sendRef.current?.(text, meta);
    },
    onInterim: setInterim,
    onRejected: (reason) => {
      if (!activeRef.current || mutedRef.current) return;
      const line = rejectionLine(reason);
      if (!line) return; // a cough or a door — just listen again
      setMessages((prev) => [...prev, { role: 'assistant', content: line }]);
      sayRef.current?.(line);
    },
  });

  // Destructured so the conversation callbacks stay referentially stable — a
  // changing identity here restarts the listen/speak timers on every render.
  const {
    start: voiceStart, stop: voiceStop, listening: voiceListening,
    supported: voiceSupported, getBars: voiceBars,
  } = voice;

  const beginListening = useCallback(() => {
    if (!activeRef.current || mutedRef.current) return;
    gotResultRef.current = false;
    setInterim('');
    setPhase('listening');
    voiceStart();
  }, [voiceStart]);

  const resumeListening = useCallback(() => {
    if (!activeRef.current) return;
    if (mutedRef.current) { setPhase('resting'); return; }
    beginListening();
  }, [beginListening]);

  const { start: startBargeIn, stop: stopBargeIn } = useBargeIn(() => {
    if (!activeRef.current || mutedRef.current) return;
    stopSpeech();
    beginListening();
  });

  const say = useCallback((text) => {
    sawSpeakingRef.current = false;
    const words = String(text).trim().split(/\s+/).length;
    spokenMsRef.current = Math.min(30000, Math.max(6000, words * 450));
    setPhase('speaking');
    speak(text);
  }, [speak]);
  sayRef.current = say;

  const send = useCallback(async (text, meta) => {
    if (!activeRef.current || !text?.trim()) return;

    setInterim('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    historyRef.current = [...historyRef.current, { role: 'user', content: text }].slice(-HISTORY_TURNS);
    setPhase('thinking');

    const local = applyCloverUtterance(text, { pathname: location.pathname });
    if (local.navigateTo && local.navigateTo !== location.pathname) {
      try { navigate(local.navigateTo); } catch {}
    }
    // "Clover, mute yourself" / "unmute" — she can work her own ears.
    if (typeof local.setMuted === 'boolean' && local.setMuted !== mutedRef.current) {
      setMuted(local.setMuted);
    }

    if (local.handled) {
      if (!activeRef.current) return;
      historyRef.current = [...historyRef.current, { role: 'assistant', content: local.reply }].slice(-HISTORY_TURNS);
      setMessages((prev) => [...prev, { role: 'assistant', content: local.reply }]);
      say(local.reply);
      if (local.endSession) {
        setTimeout(() => {
          activeRef.current = false;
          stopSpeech();
          voiceStop();
          stopBargeIn();
          setPhase('idle');
        }, 1200);
      }
      return;
    }

    let reply = "Sorry, I missed that — one more time?";
    let sources = [];
    try {
      const cognitiveContext = getCognitiveMemoryContext();
      let gps = null;
      try { gps = JSON.parse(sessionStorage.getItem('rhgo_last_gps') || 'null'); } catch {}
      const { getOrCreateGuestId } = await import('@/lib/guestDevice');
      const res = await base44.functions.invoke('cloverChat', {
        history: historyRef.current,
        companion,
        todays_finds: todaysSpecimens,
        recent_finds: recentFindsRef.current.slice(0, 8),
        screen: location.pathname,
        // A shaky transcript tells Clover to ask rather than confidently guess.
        transcript_soft: !!meta?.soft,
        voice_confidence: meta?.confidence ?? null,
        cognitive_context: cognitiveContext,
        brain: getCloverBrain(),
        research_query: local.researchQuery || null,
        location: gps,
        user_utterance: text,
        guest_device_id: getOrCreateGuestId(),
      });
      const data = res?.data;
      reply = data?.reply || reply;
      sources = Array.isArray(data?.sources) ? data.sources : [];
      // An open Vault Galaxy flies to the record Clover answered from.
      if (data?.focus?.id) emit('vault:focus', data.focus);

      if (data?.log_find && data?.find_details) {
        try {
          await base44.functions.invoke('parseSpecimenDictation', {
            transcript: data.find_details, create: true,
          });
          onFindLogged?.(data.find_details.split(' ').slice(0, 3).join(' '));
        } catch {}
      }
    } catch (err) {
      const msg = String(err?.message || err?.data?.error || '');
      reply = /429|rate limit|Guest rate/i.test(msg)
        ? "That's my free chatter for now — sign in and I'll keep the conversation going."
        : "I lost you for a second there. Still with me?";
    }

    if (!activeRef.current) return;
    historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }].slice(-HISTORY_TURNS);
    setMessages((prev) => [...prev, { role: 'assistant', content: reply, sources }]);
    say(reply);
  }, [companion, todaysSpecimens, onFindLogged, say, location.pathname, navigate, stopSpeech, voiceStop, stopBargeIn]);
  sendRef.current = send;

  useEffect(() => {
    if (phase !== 'speaking') return;

    if (speaking) {
      sawSpeakingRef.current = true;
      startBargeIn();
      const w = setTimeout(() => {
        if (!activeRef.current) return;
        stopSpeech();
        stopBargeIn();
        sawSpeakingRef.current = false;
        resumeListening();
      }, spokenMsRef.current + 4000);
      return () => clearTimeout(w);
    }
    if (sawSpeakingRef.current) {
      sawSpeakingRef.current = false;
      stopBargeIn();
      resumeListening();
      return;
    }
    const t = setTimeout(() => {
      if (activeRef.current && !sawSpeakingRef.current) resumeListening();
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, speaking, resumeListening, startBargeIn, stopBargeIn, stopSpeech]);

  useEffect(() => {
    if (phase !== 'listening' || voiceListening) return;
    if (gotResultRef.current) return;

    const t = setTimeout(() => {
      if (!activeRef.current || mutedRef.current) return;
      quietTurnsRef.current += 1;
      if (quietTurnsRef.current >= MAX_QUIET_TURNS) {
        setPhase('resting');
      } else {
        beginListening();
      }
    }, 500);
    return () => clearTimeout(t);
  }, [phase, voiceListening, beginListening]);

  // Mute closes her ears but keeps the conversation: she still answers typed
  // input and still speaks. Unmuting picks the conversation back up.
  useEffect(() => {
    if (muted) {
      voiceStop();
      stopBargeIn();
      if (activeRef.current && phaseRef.current !== 'speaking' && phaseRef.current !== 'thinking') {
        setPhase('resting');
      }
      return;
    }
    if (activeRef.current && (phaseRef.current === 'resting' || phaseRef.current === 'listening')) {
      quietTurnsRef.current = 0;
      beginListening();
    }
  }, [muted, voiceStop, stopBargeIn, beginListening]);

  /**
   * Bar heights for the waveform: her own voice while she speaks, the live mic
   * level while she listens, and a gentle decay in between.
   */
  const getWaveBars = useCallback((out) => {
    const p = phaseRef.current;
    if (p === 'listening' && !mutedRef.current) return voiceBars(out);

    if (p === 'speaking') {
      const amp = getAmplitude();
      const t = performance.now() / 240;
      for (let i = 0; i < out.length; i++) {
        const shape = 0.4 + 0.6 * Math.abs(Math.sin(i * 0.62 + t));
        const target = Math.min(1, amp * shape * 1.9);
        out[i] += (target - out[i]) * 0.35;
      }
      return out;
    }

    for (let i = 0; i < out.length; i++) out[i] *= 0.85;
    return out;
  }, [voiceBars, getAmplitude]);

  const start = useCallback((openingLine) => {
    unlock();
    activeRef.current = true;
    quietTurnsRef.current = 0;
    historyRef.current = [];
    setMessages([{ role: 'assistant', content: openingLine }]);
    historyRef.current = [{ role: 'assistant', content: openingLine }];
    import('@/lib/analytics').then(({ trackEvent }) => trackEvent('clover_session_start')).catch(() => {});
    say(openingLine);
  }, [say, unlock]);

  const end = useCallback(() => {
    activeRef.current = false;
    stopSpeech();
    voiceStop();
    stopBargeIn();
    setPhase('idle');
    setInterim('');
  }, [stopSpeech, voiceStop, stopBargeIn]);

  const nudge = useCallback(() => {
    if (!activeRef.current) return;
    if (mutedRef.current) { setPhase('resting'); return; }
    if (phaseRef.current === 'speaking') { stopSpeech(); stopBargeIn(); }
    quietTurnsRef.current = 0;
    beginListening();
  }, [stopSpeech, stopBargeIn, beginListening]);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const busyIdRef = useRef(Math.random().toString(36).slice(2));
  useEffect(() => {
    setCloverBusy(busyIdRef.current, phase !== 'idle' && phase !== 'resting');
  }, [phase]);

  useEffect(() => () => {
    activeRef.current = false;
    setCloverBusy(busyIdRef.current, false);
  }, []);

  return {
    phase, messages, interim, muted, toggleMute, getWaveBars,
    start, end, stop: end, nudge, send, unlock,
    active: phase !== 'idle',
    voiceSupported,
    getAmplitude, getSpectrum,
  };
}