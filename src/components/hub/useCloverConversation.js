import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import useBargeIn from './useBargeIn';

/**
 * useCloverConversation — the open, hands-free conversation loop.
 *
 * Tap once to start. From then on it runs itself:
 *   speaking → (she finishes, or you talk over her) → listening → thinking → speaking …
 *
 * Nothing to press, nothing to type. Talking over her stops her mid-sentence
 * and she listens instead.
 */

// After this many silent turns, stop reopening the mic and just wait quietly.
const MAX_QUIET_TURNS = 3;

export default function useCloverConversation({ companion, todaysSpecimens = 0, onFindLogged } = {}) {
  const [phase, setPhase] = useState('idle');     // idle | thinking | speaking | listening | resting
  const [messages, setMessages] = useState([]);
  const [interim, setInterim] = useState('');

  const activeRef = useRef(false);
  const historyRef = useRef([]);
  const sawSpeakingRef = useRef(false);
  const spokenMsRef = useRef(8000);
  const quietTurnsRef = useRef(0);
  const gotResultRef = useRef(false);

  const { speak, stop: stopSpeech, speaking, getAmplitude, getSpectrum } = useSpeechSynthesis();

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

  // Interrupting her: cut the audio, go straight to listening.
  const { start: startBargeIn, stop: stopBargeIn } = useBargeIn(() => {
    if (!activeRef.current) return;
    stopSpeech();
    beginListening();
  });

  const say = useCallback((text) => {
    sawSpeakingRef.current = false;
    // Rough spoken length, used as a watchdog below.
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

    let reply = "I didn't catch that — say it again?";
    try {
      const res = await base44.functions.invoke('cloverChat', {
        history: historyRef.current,
        companion,
        todays_finds: todaysSpecimens,
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
    } catch {
      reply = "I lost you for a second there. Still with me?";
    }

    if (!activeRef.current) return;
    historyRef.current = [...historyRef.current, { role: 'assistant', content: reply }].slice(-8);
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    say(reply);
  }, [companion, todaysSpecimens, onFindLogged, say]);
  sendRef.current = send;

  // She finished talking → open the mic. Watching `speaking` go true-then-false
  // is what tells us the audio actually ended.
  useEffect(() => {
    if (phase !== 'speaking') return;

    if (speaking) {
      sawSpeakingRef.current = true;
      startBargeIn();
      // Watchdog: if the audio never reports finishing (suspended audio context,
      // a device that won't play), still hand the turn back to the user.
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
    // Audio never started (muted, TTS failed) — don't strand the conversation.
    const t = setTimeout(() => {
      if (activeRef.current && !sawSpeakingRef.current) beginListening();
    }, 1200);
    return () => clearTimeout(t);
  }, [phase, speaking, beginListening, startBargeIn, stopBargeIn, stopSpeech]);

  // Mic closed without hearing anything → reopen it a few times, then rest.
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
    activeRef.current = true;
    quietTurnsRef.current = 0;
    historyRef.current = [];
    setMessages([{ role: 'assistant', content: openingLine }]);
    historyRef.current = [{ role: 'assistant', content: openingLine }];
    say(openingLine);
  }, [say]);

  const end = useCallback(() => {
    activeRef.current = false;
    stopSpeech();
    voice.stop();
    stopBargeIn();
    setPhase('idle');
    setInterim('');
  }, [stopSpeech, voice, stopBargeIn]);

  // Tap while she's talking = interrupt. Tap while resting = wake the mic.
  const nudge = useCallback(() => {
    if (!activeRef.current) return;
    if (phase === 'speaking') { stopSpeech(); stopBargeIn(); }
    quietTurnsRef.current = 0;
    beginListening();
  }, [phase, stopSpeech, stopBargeIn, beginListening]);

  useEffect(() => () => { activeRef.current = false; }, []);

  return {
    phase, messages, interim, start, end, nudge, send,
    active: activeRef.current,
    voiceSupported: voice.supported,
    getAmplitude, getSpectrum,
  };
}