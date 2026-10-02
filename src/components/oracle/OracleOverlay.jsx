import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Mic, Volume2, VolumeX, Loader2, Radio, Gem } from 'lucide-react';
import VoiceStateHUD from './VoiceStateHUD.jsx';
import { useOracle } from './OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from './useSpeech';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import { detectLogIntent, getCurrentCoordinates } from './oracleActions';

export default function OracleOverlay() {
  const { open, autoLive, closeOracle } = useOracle();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi! I'm Clover 🍀 Cole, your AI rockhounding companion. Ask me about minerals, hotspots, or say \"log a specimen\" to dictate a new find.",
    },
  ]);
  const [dictationMode, setDictationMode] = useState(false);
  const dictationModeRef = useRef(false);
  dictationModeRef.current = dictationMode;
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const scrollRef = useRef(null);
  const liveModeRef = useRef(false);
  liveModeRef.current = liveMode;

  const { speak, stop: stopSpeak, speaking, getAmplitude } = useSpeechSynthesis();
  const handleDictation = useCallback(async (transcript) => {
    setThinking(true);
    let summary;
    try {
      const coords = await getCurrentCoordinates();
      const res = await base44.functions.invoke('parseSpecimenDictation', {
        transcript,
        create: true,
        ...coords,
      });
      const data = res?.data || {};
      const fields = data.fields || {};
      summary = data.created
        ? `Logged ${fields.mineral_name}${fields.found_at ? ` from ${fields.found_at}` : ''}${
            fields.rarity && fields.rarity !== 'common' ? ` — ${fields.rarity}` : ''
          }. Weather and lunar phase will fill in shortly.`
        : `I couldn't save that one. Try again with the mineral name.`;
    } catch {
      summary = `I couldn't reach the field log. Your description is still here—please try saving it again.`;
    } finally {
      setThinking(false);
      setDictationMode(false);
    }
    setMessages((current) => [...current, { role: 'assistant', content: summary }]);
    if (!muted) speak(summary);
  }, [muted, speak]);

  const sendMessage = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || thinking) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');

    // If already in dictation mode, this message IS the specimen description
    if (dictationModeRef.current) {
      await handleDictation(text);
      return;
    }

    // Detect intent to start logging
    if (detectLogIntent(text)) {
      setDictationMode(true);
      const ask = "Yes — describe the specimen. Mineral name, where you found it, and any notes.";
      setMessages((m) => [...m, { role: 'assistant', content: ask }]);
      if (!muted) speak(ask);
      return;
    }

    setThinking(true);
    let replyText;
    try {
      const { getOrCreateGuestId } = await import('@/lib/guestDevice');
      const res = await base44.functions.invoke('cloverChat', {
        history: next.slice(-8).map((m) => ({ role: m.role === 'user' ? 'user' : 'clover', content: m.content })),
        companion: null,
        todays_finds: 0,
        guest_device_id: getOrCreateGuestId(),
      });
      replyText = res?.data?.reply || "I'm here with you.";
    } catch {
      replyText = "I couldn't reach the Oracle service. Please try again in a moment.";
    } finally {
      setThinking(false);
    }
    setMessages((m) => [...m, { role: 'assistant', content: replyText }]);
    if (!muted) speak(replyText);
  }, [handleDictation, input, messages, muted, speak, thinking]);

  const handleVoiceResult = useCallback((transcript) => {
    setInput('');
    sendMessage(transcript);
  }, [sendMessage]);
  const handleInterim = useCallback((partial) => setInput(partial), []);
  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleVoiceResult, onInterim: handleInterim });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  useEffect(() => {
    if (!open) {
      stopSpeak();
      stopListen();
      setLiveMode(false);
    }
  }, [open, stopListen, stopSpeak]);

  const hasAutoStartedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      hasAutoStartedRef.current = false;
      return undefined;
    }
    if (autoLive && micSupported && !liveMode && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      setLiveMode(true);
      setMuted(false);
      const timer = setTimeout(startListen, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoLive, liveMode, micSupported, open, startListen]);

  useEffect(() => {
    if (!liveMode || speaking || thinking || listening) return undefined;
    const timer = setTimeout(() => {
      if (liveModeRef.current && !speaking && !thinking) startListen();
    }, 400);
    return () => clearTimeout(timer);
  }, [listening, liveMode, speaking, startListen, thinking]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="oracle-title"
        className="glass-panel w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="w-10 h-10 shrink-0">
            <React.Suspense fallback={<div style={{ width: 40, height: 40 }} />}>
              <AmethystOrb size={40} speaking={speaking} getAmplitude={getAmplitude} />
            </React.Suspense>
          </div>
          <div className="flex-1 min-w-0">
            <div id="oracle-title" className="text-white font-semibold tracking-wide flex items-center gap-2">
              Clover 🍀 Cole
              {dictationMode && (
                <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amethyst/30 text-white border border-amethyst/50 flex items-center gap-1">
                  <Gem size={10} /> Logging
                </span>
              )}
            </div>
            {/* Status — HUD-style, via shared VoiceStateHUD */}
            <div className="mt-1">
              <VoiceStateHUD listening={listening} thinking={thinking} speaking={speaking} size="sm" />
              {!listening && !thinking && !speaking && (
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                  {dictationMode ? 'Describe your specimen' : 'Your AI companion'}
                </div>
              )}
            </div>
          </div>
          {micSupported && (
            <button
              onClick={() => {
                setLiveMode((v) => {
                  const next = !v;
                  if (next) {
                    setMuted(false);
                    if (!speaking && !thinking && !listening) startListen();
                  } else {
                    stopListen();
                  }
                  return next;
                });
              }}
              className={`p-2 rounded-md transition ${
                liveMode
                  ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/40'
                  : 'text-amethyst/70 hover:text-white hover:bg-white/5'
              }`}
              aria-label={liveMode ? 'End live conversation' : 'Start live conversation'}
              title={liveMode ? 'End live conversation' : 'Start live conversation'}
            >
              <Radio size={16} className={liveMode ? 'animate-pulse motion-reduce:animate-none' : ''} aria-hidden="true" />
            </button>
          )}
          <button
            onClick={() => setMuted((m) => !m)}
            className="p-2 rounded-md text-amethyst/70 hover:text-white hover:bg-white/5"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={closeOracle}
            className="p-2 rounded-md text-amethyst/70 hover:text-white hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} aria-live="polite" aria-relevant="additions" className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amethyst/30 text-white border border-amethyst/40'
                    : 'bg-white/5 text-white/90 border border-white/10'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-2xl bg-white/5 border border-white/10 text-amethyst/70">
                <Loader2 size={14} className="animate-spin motion-reduce:animate-none" aria-label="Oracle is thinking" />
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div className="border-t border-white/10 p-3 flex items-center gap-2">
          {micSupported && (
            <button
              onClick={listening ? stopListen : startListen}
              disabled={thinking}
              className={`p-2.5 rounded-full border transition ${
                listening
                  ? 'bg-rose-400/20 border-rose-400/50 text-rose-300'
                  : 'bg-white/5 border-white/15 text-amethyst/80 hover:text-white'
              }`}
              aria-label={listening ? 'Tap to stop listening' : 'Tap to speak'}
              title={listening ? 'Tap to stop' : 'Tap to speak'}
            >
              {/* Always show Mic — with a stop-ring overlay when active */}
              <span className="relative flex items-center justify-center">
                <Mic size={16} />
                {listening && (
                  <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping motion-reduce:animate-none opacity-60" />
                )}
              </span>
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask Clover…"
            className="flex-1 bg-black/30 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-amethyst/50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={thinking || !input.trim()}
            className="p-2.5 rounded-full bg-amethyst/30 hover:bg-amethyst/40 border border-amethyst/50 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}