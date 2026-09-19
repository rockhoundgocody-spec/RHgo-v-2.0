import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import useBargeIn from './useBargeIn';
import { getCognitiveMemoryContext } from '@/lib/cloverMemory';
import { applyCloverUtterance, getCloverBrain } from '@/lib/cloverRuntime';

const MAX_QUIET_TURNS = 3;

export default function useCloverConversation({ companion, todaysSpecimens = 0, onFindLogged } = {}) {
  const [phase, setPhase] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  const activeRef = useRef(false);
  const historyRef = useRef([]);
  const sawSpeakingRef = useRef(false);
  const spokenMsRef = useRef(8000);
  const quietTurnsRef = useRef(0);
  const gotResultRef = useRef(false);

  const { speak, stop: stopSpeech, speaking, getAmplitude, getSpectrum, unlock } = useSpeechSynthesis();

  const sendRef = useRef(null);
  const voice = useVoiceInput({
    onResult: (text) => {
      gotResultRef.current = true;
      quietTurnsRef.current = 0;
      sendRef.current?.(text);
    },
    onInterim: setInterim,
  });

  const beginListening = useCallback(() => {
    if (!activeRef.current) return;
    gotResultRef.current = false;
    setInterim('');
    setPhase('listening');
    voice.start();
  }, [voice]);

  const { start: startBargeIn, stop: stopBargeIn } = useBargeIn(() => {
    if (!activeRef.current) return;
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

  const send = useCallback(async (text) => {
    if (!activeRef.current || !text?.trim()) return;

    setInterim('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    historyRef.current = [...historyRef.current, { role: 'user', content: text }].slice(-8);
    setPhase('thinking');

    const local = applyCloverUtterance(text, { pathname: location.pathname });
    if (local.navigateTo && local.navigateTo !== location.pathname) {
      try { navigate(local.navigateTo); } catch {}
    }

    if (local.handled) {
      if (!activeRef.current) return;
      historyRef.current = [...historyRef.current, { role: 'assistant', content: local.reply }].slice(-8);
      setMessages((prev) => [...prev, { role: 'assistant', content: local.reply }]);
      say(local.reply);
      if (local.endSession) {
        setTimeout(() => {
          activeRef.current = false;
          stopSpeech();
          voice.stop();
          stopBargeIn();
          setPhase('idle');
        }, 1200);
      }
      return;
    }

    let reply = "Sorry, I missed that — one more time?";
    try {
      const cognitiveContext = getCognitiveMemoryContext();
      let gps = null;
      try { gps = JSON.parse(sessionStorage.getItem('rhgo_last_gps') || 'null'); } catch {}
      const { getOrCreateGuestId } = await import('@/lib/guestDevice');
      const res = await base44.functions.invoke('cloverChat', {
        history: historyRef.current,
        companion,
        todays_finds: todaysSpecimens,
        cognitive_context: cognitiveContext,
        brain: getCloverBrain(),
        research_query: local.researchQuery || null,
        location: gps,
        user_utterance: text,
        guest_device_id: getOrCreateGuestId(),
      });
      const data = res?.data;
      reply = data?.reply || reply;

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
    historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }].slice(-8);
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    say(reply);
  }, [companion, todaysSpecimens, onFindLogged, say, location.pathname, navigate, stopSpeech, voice, stopBargeIn]);
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
        beginListening();
      }, spokenMsRef.current + 4000);
      return () => clearTimeout(w);
    }
    if (sawSpeakingRef.current) {
      sawSpeakingRef.current = false;
      stopBargeIn();
      beginListening();
      return;
    }
    const t = setTimeout(() => {
      if (activeRef.current && !sawSpeakingRef.current) beginListening();
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, speaking, beginListening, startBargeIn, stopBargeIn, stopSpeech]);

  useEffect(() => {
    if (phase !== 'listening' || voice.listening) return;
    if (gotResultRef.current) return;

    const t = setTimeout(() => {
      if (!activeRef.current) return;
      quietTurnsRef.current += 1;
      if (quietTurnsRef.current >= MAX_QUIET_TURNS) {
        setPhase('resting');
      } else {
        beginListening();
      }
    }, 500);
    return () => clearTimeout(t);
  }, [phase, voice.listening, beginListening]);

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
    voice.stop();
    stopBargeIn();
    setPhase('idle');
    setInterim('');
  }, [stopSpeech, voice, stopBargeIn]);

  const nudge = useCallback(() => {
    if (!activeRef.current) return;
    if (phase === 'speaking') { stopSpeech(); stopBargeIn(); }
    quietTurnsRef.current = 0;
    beginListening();
  }, [phase, stopSpeech, stopBargeIn, beginListening]);

  useEffect(() => () => { activeRef.current = false; }, []);

  return {
    phase, messages, interim, start, end, stop: end, nudge, send, unlock,
    active: phase !== 'idle',
    voiceSupported: voice.supported,
    getAmplitude, getSpectrum,
  };
}
