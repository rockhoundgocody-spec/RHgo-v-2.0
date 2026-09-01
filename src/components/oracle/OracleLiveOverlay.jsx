import React, { useEffect, useRef, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Mic, Gem } from 'lucide-react';
import VoiceStateHUD from './VoiceStateHUD.jsx';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import { useOracle } from './OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from './useSpeech';

/**
 * Full-screen, chat-less live conversation experience.
 * Matches the Hub theme: amethyst gradients, hud-cyan accents, glass-panel surfaces.
 * Voice-only — last user line + last oracle reply float around a giant orb.
 */
export default function OracleLiveOverlay() {
  const { open, autoLive, closeOracle } = useOracle();
  const [thinking, setThinking] = useState(false);
  const [interim, setInterim] = useState('');
  const [lastUser, setLastUser] = useState('');
  const [lastOracle, setLastOracle] = useState(
    "Hi, I'm Clover 🍀 Cole. Tap to begin — ask me anything, or say \"log a specimen\"."
  );
  const [dictationMode, setDictationMode] = useState(false);
  const dictationRef = useRef(false);
  dictationRef.current = dictationMode;
  const historyRef = useRef([]); // {role, content}[]

  const { speak, stop: stopSpeak, speaking, getAmplitude, getSpectrum } =
    useSpeechSynthesis();

  const handleResult = useCallback((transcript) => {
    setInterim('');
    handleUserTurn(transcript);
     
  }, []);
  const handleInterim = useCallback((p) => setInterim(p), []);

  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleResult, onInterim: handleInterim });

  // Auto-listen loop: when oracle stops speaking, start mic again
  useEffect(() => {
    if (!open || !autoLive) return;
    if (!speaking && !thinking && !listening) {
      const t = setTimeout(() => {
        if (open && !speaking && !thinking) startListen();
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, autoLive, speaking, thinking, listening, startListen]);

  useEffect(() => {
    if (!open) {
      stopSpeak();
      stopListen();
      setInterim('');
      setDictationMode(false);
      historyRef.current = [];
    }
  }, [open, stopSpeak, stopListen]);

  const detectLogIntent = (t) => {
    const s = t.toLowerCase();
    return /\b(log|save|record|add|create|catalog)\b.*\b(specimen|find|rock|mineral|sample|stone|crystal)\b/.test(s)
      || /\b(new specimen|log this|save this|record this)\b/.test(s);
  };
  const getCoords = () =>
    new Promise((r) => {
      if (!navigator.geolocation) return r({});
      navigator.geolocation.getCurrentPosition(
        (p) => r({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => r({}),
        { timeout: 4000, maximumAge: 60000 }
      );
    });

  const replyAndSpeak = (text) => {
    setLastOracle(text);
    historyRef.current.push({ role: 'assistant', content: text });
    speak(text);
  };

  const handleUserTurn = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLastUser(trimmed);
    historyRef.current.push({ role: 'user', content: trimmed });

    // continuing dictation
    if (dictationRef.current) {
      setThinking(true);
      const coords = await getCoords();
      const res = await base44.functions.invoke('parseSpecimenDictation', {
        transcript: trimmed,
        create: true,
        ...coords,
      });
      const data = res?.data || {};
      const f = data.fields || {};
      const ok = !!data.created;
      const summary = ok
        ? `Logged ${f.mineral_name}${f.found_at ? ` from ${f.found_at}` : ''}${
            f.rarity && f.rarity !== 'common' ? ` — ${f.rarity}` : ''
          }. Weather and lunar data filling in now.`
        : "I couldn't save that. Try again with the mineral name.";
      setDictationMode(false);
      setThinking(false);
      replyAndSpeak(summary);
      return;
    }

    if (detectLogIntent(trimmed)) {
      setDictationMode(true);
      replyAndSpeak('Yes — describe the specimen. Mineral, location, and any notes.');
      return;
    }

    setThinking(true);
    const res = await base44.functions.invoke('cloverChat', {
      history: historyRef.current.slice(-8),
      companion: null,
      todays_finds: 0,
    });
    const replyText = res?.data?.reply || "I'm here with you.";
    setThinking(false);
    replyAndSpeak(replyText);
  };

  if (!open) return null;

  // status string kept for aria-label only
  const statusLabel = speaking ? 'Speaking' : listening ? 'Listening' : thinking ? 'Processing' : 'Ready';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-background overflow-hidden">
      {/* ambient backdrop — matches Hub */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 30%, hsla(280,90%,45%,0.30) 0%, transparent 70%), radial-gradient(40% 40% at 50% 90%, hsla(195,90%,40%,0.18) 0%, transparent 70%)',
        }}
      />

      {/* top bar */}
      <div className="w-full flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/80 glow-hud">
            Live Channel
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {dictationMode && (
            <span className="ml-2 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amethyst/30 text-white border border-amethyst/50 flex items-center gap-1">
              <Gem size={10} /> Logging
            </span>
          )}
        </div>
        <button
          onClick={closeOracle}
          className="p-2 rounded-full glass-panel text-amethyst/80 hover:text-white"
          aria-label="End live"
        >
          <X size={18} />
        </button>
      </div>

      {/* center orb */}
      <div className="flex flex-col items-center px-6 -mt-4">
        <button
          onClick={() => (listening ? stopListen() : startListen())}
          className="rounded-full transition active:scale-95 focus:outline-none"
          aria-label={listening ? 'Stop listening' : 'Start listening'}
        >
          <React.Suspense fallback={<div style={{ width: 300, height: 300 }} />}>
            <AmethystOrb
              size={300}
              speaking={speaking}
              getAmplitude={getAmplitude}
              getSpectrum={getSpectrum}
            />
          </React.Suspense>
        </button>

        {/* HUD state indicator */}
        <div className="mt-6" aria-label={statusLabel}>
          <VoiceStateHUD
            listening={listening}
            thinking={thinking}
            speaking={speaking}
            interim={interim}
          />
          {/* idle state label */}
          {!listening && !thinking && !speaking && (
            <div className="text-[10px] font-mono uppercase tracking-[0.5em] text-amethyst/60 text-center mt-1">
              Clover 🍀 Cole
            </div>
          )}
        </div>

        {/* last user utterance (no interim — that lives in VoiceStateHUD) */}
        <div className="mt-4 min-h-[2.5rem] max-w-md text-center text-white/85 text-base leading-snug">
          {!interim && lastUser && <span className="text-white/60">"{lastUser}"</span>}
        </div>

        {/* oracle reply */}
        <div className="mt-3 max-w-md text-center text-white text-lg leading-relaxed glow-amethyst">
          {lastOracle}
        </div>
      </div>

      {/* bottom hint */}
      <div className="w-full flex items-center justify-center gap-2 pb-8 text-[10px] font-mono uppercase tracking-[0.4em] text-white/40">
        <Mic size={12} />
        {micSupported ? 'Tap to toggle mic · say "log a specimen" to save a find' : 'Voice not supported on this device'}
      </div>
    </div>
  );
}