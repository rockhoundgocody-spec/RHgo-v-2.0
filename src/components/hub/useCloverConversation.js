import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import useBargeIn from './useBargeIn';
import { getCognitiveMemoryContext, recordRsiTurn } from '@/lib/cloverMemory';
import { applyCloverUtterance, getCloverBrain } from '@/lib/cloverRuntime';
import { setCloverBusy, emit } from '@/lib/cloverWake';
import { useQueryClient } from '@tanstack/react-query';
import voiceTimeout from '@/lib/voiceTimeout';

const MAX_QUIET_TURNS = 3;

export default function useCloverConversation({ companion, todaysSpecimens = 0, onFindLogged, scanContext } = {}) {
  const [phase, setPhase] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState('');
  const [huntSuggestions, setHuntSuggestions] = useState(null);
  const [huntLoading, setHuntLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const turnRef = useRef(0);
  const pendingRef = useRef(null);
  const endTimerRef = useRef(null);

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
  const { start: startVoice, stop: stopVoice, listening: voiceListening, supported: voiceSupported, error: voiceError } = voice;

  const beginListening = useCallback((manual = false) => {
    if (!activeRef.current) return;
    gotResultRef.current = false;
    setInterim('');
    if (voiceSupported === false || (voiceError && !manual)) { setPhase('resting'); return; }
    setPhase('listening');
    startVoice();
  }, [startVoice, voiceSupported, voiceError]);

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
    if (!activeRef.current || !text?.trim() || pendingRef.current !== null) return;
    const turn = ++turnRef.current;
    stopSpeech();
    stopVoice();
    stopBargeIn();

    setInterim('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    historyRef.current = [...historyRef.current, { role: 'user', content: text }].slice(-12);
    setPhase('thinking');

    const local = applyCloverUtterance(text, { pathname: location.pathname });
    if (local.navigateTo && local.navigateTo !== location.pathname) {
      try { navigate(local.navigateTo); } catch {}
    }

    if (local.handled) {
      if (!activeRef.current) return;
      historyRef.current = [...historyRef.current, { role: 'assistant', content: local.reply }].slice(-12);
      setMessages((prev) => [...prev, { role: 'assistant', content: local.reply }]);
      say(local.reply);
      if (local.endSession) {
        endTimerRef.current = setTimeout(() => {
          if (turn !== turnRef.current) return;
          activeRef.current = false;
          stopSpeech();
          stopVoice();
          stopBargeIn();
          setPhase('idle');
        }, 1200);
      }
      return;
    }

    let reply = "Sorry, I missed that — one more time?";
    let sources = [];
    pendingRef.current = turn;
    try {
      const cognitiveContext = getCognitiveMemoryContext();
      let gps = null;
      try { gps = JSON.parse(sessionStorage.getItem('rhgo_last_gps') || 'null'); } catch {}
      const { getOrCreateGuestId } = await import('@/lib/guestDevice');
      const res = await voiceTimeout(base44.functions.invoke('cloverChat', {
        history: historyRef.current,
        companion,
        todays_finds: todaysSpecimens,
        cognitive_context: cognitiveContext,
        brain: getCloverBrain(),
        research_query: local.researchQuery || null,
        location: gps,
        user_utterance: text,
        guest_device_id: getOrCreateGuestId(),
        scan_context: scanContext || null,
      }));
      if (!activeRef.current || turn !== turnRef.current) return;
      const data = res?.data;
      reply = data?.reply || reply;
      sources = Array.isArray(data?.sources) ? data.sources : [];
      // An open Vault Galaxy flies to the record Clover answered from.
      if (data?.focus?.id) emit('vault:focus', data.focus);

      if (data?.log_find && data?.find_details) {
        try {
          const saved = await base44.functions.invoke('parseSpecimenDictation', {
            transcript: data.find_details, create: true,
          });
          if (!saved?.data?.created?.id) throw new Error('Find was not saved');
          queryClient.invalidateQueries({ queryKey: ['entity', 'Specimen'] });
          if (!activeRef.current || turn !== turnRef.current) return;
          const mineral = saved.data.fields?.mineral_name || 'your specimen';
          reply = `Saved ${mineral} to your collection.`;
          onFindLogged?.(mineral);
        } catch {
          reply = "I couldn't confirm that save. Your description is still in this conversation; check Collection before trying again.";
        }
      }
    } catch (err) {
      const msg = String(err?.message || err?.data?.error || '');
      reply = /429|rate limit|Guest rate/i.test(msg)
        ? "That's my free chatter for now — sign in and I'll keep the conversation going."
        : "I couldn't reach the conversation service. Your message is still here; please try again.";
    } finally {
      if (pendingRef.current === turn) pendingRef.current = null;
    }

    if (!activeRef.current || turn !== turnRef.current) return;
    recordRsiTurn({ type: 'voice' });
    historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }].slice(-12);
    setMessages((prev) => [...prev, { role: 'assistant', content: reply, sources }]);
    say(reply);
  }, [companion, todaysSpecimens, onFindLogged, say, location.pathname, navigate, stopSpeech, stopVoice, stopBargeIn, queryClient, scanContext]);
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
    if (phase !== 'listening' || voiceListening || voiceError) return;
    if (gotResultRef.current) return;

    const t = setTimeout(() => {
      if (!activeRef.current) return;
      quietTurnsRef.current += 1;
      if (quietTurnsRef.current >= MAX_QUIET_TURNS) {
        setPhase('resting');
      } else {
        beginListening();
      }
    }, 900);
    return () => clearTimeout(t);
  }, [phase, voiceListening, voiceError, beginListening]);

  useEffect(() => {
    if (!voiceError || !activeRef.current) return;
    // A late permission failure must not interrupt an already-submitted chat turn.
    setPhase(current => current === 'listening' ? 'resting' : current);
  }, [voiceError]);

  const start = useCallback((openingLine, { listenFirst = false } = {}) => {
    turnRef.current += 1;
    pendingRef.current = null;
    clearTimeout(endTimerRef.current);
    stopVoice(); stopSpeech(); stopBargeIn();
    unlock();
    activeRef.current = true;
    quietTurnsRef.current = 0;
    historyRef.current = [];
    setMessages([{ role: 'assistant', content: openingLine }]);
    historyRef.current = [{ role: 'assistant', content: openingLine }];
    import('@/lib/analytics').then(({ trackEvent }) => trackEvent('clover_session_start')).catch(() => {});
    if (listenFirst) beginListening(true); else say(openingLine);
  }, [say, unlock, beginListening, stopVoice, stopSpeech, stopBargeIn]);

  const end = useCallback(() => {
    turnRef.current += 1;
    pendingRef.current = null;
    clearTimeout(endTimerRef.current);
    activeRef.current = false;
    stopSpeech();
    stopVoice();
    stopBargeIn();
    setPhase('idle');
    setInterim('');
  }, [stopSpeech, stopVoice, stopBargeIn]);

  const pause = useCallback(() => {
    turnRef.current += 1; pendingRef.current = null;
    clearTimeout(endTimerRef.current);
    stopSpeech(); stopVoice(); stopBargeIn();
    if (activeRef.current) setPhase('resting');
    setInterim('');
  }, [stopSpeech, stopVoice, stopBargeIn]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [pause]);

  const nudge = useCallback(() => {
    if (!activeRef.current || pendingRef.current !== null) return;
    if (phase === 'speaking') { stopSpeech(); stopBargeIn(); }
    quietTurnsRef.current = 0;
    beginListening(true);
  }, [phase, stopSpeech, stopBargeIn, beginListening]);

  const busyIdRef = useRef(Math.random().toString(36).slice(2));
  useEffect(() => {
    setCloverBusy(busyIdRef.current, phase !== 'idle' && phase !== 'resting');
  }, [phase]);

  useEffect(() => () => {
    turnRef.current += 1;
    clearTimeout(endTimerRef.current);
    activeRef.current = false;
    setCloverBusy(busyIdRef.current, false);
  }, []);

  const requestHuntSuggestions = useCallback(async () => {
    if (huntLoading || pendingRef.current !== null || !activeRef.current) return;
    const sessionTurn = turnRef.current;
    unlock?.();
    setHuntLoading(true);
    try {
      let gps = null;
      try { gps = JSON.parse(sessionStorage.getItem('rhgo_last_gps') || 'null'); } catch {}
      const res = await base44.functions.invoke('suggestNextFinds', {
        lat: gps?.lat ?? null,
        lng: gps?.lng ?? null,
      });
      if (!activeRef.current || sessionTurn !== turnRef.current) return;
      const data = res?.data;
      if (data?.suggestions?.length) {
        setHuntSuggestions(data);
        recordRsiTurn({ type: 'radar' });
        if (data.clover_intro) say(data.clover_intro);
      } else {
        throw new Error('No suggestions');
      }
    } catch {
      if (!activeRef.current || sessionTurn !== turnRef.current) return;
      const message = "I couldn't load grounded hunt suggestions. Try Hunt again when connected; I won't guess a location or collecting permission.";
      setHuntSuggestions({ error: true, suggestions: [], clover_intro: message });
      say(message);
    } finally {
      setHuntLoading(false);
    }
  }, [huntLoading, say, todaysSpecimens, unlock]);

  const dismissHuntSuggestions = useCallback(() => setHuntSuggestions(null), []);

  return {
    phase, messages, interim, start, end, stop: end, pause, nudge, send, unlock, voiceError,
    active: phase !== 'idle',
    voiceSupported,
    getAmplitude, getSpectrum,
    huntSuggestions,
    huntLoading,
    requestHuntSuggestions,
    dismissHuntSuggestions,
  };
}