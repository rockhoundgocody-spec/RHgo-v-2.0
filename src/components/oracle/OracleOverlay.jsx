import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Mic, MicOff, Volume2, VolumeX, Loader2, Radio, Gem } from 'lucide-react';
import { useOracle } from './OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from './useSpeech';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';

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
  const handleVoiceResult = useCallback((transcript) => {
    setInput('');
    setTimeout(() => sendMessage(transcript), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleInterim = useCallback((partial) => {
    setInput(partial);
  }, []);
  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleVoiceResult, onInterim: handleInterim });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  useEffect(() => {
    if (!open) {
      stopSpeak();
      stopListen();
      setLiveMode(false);
    }
  }, [open, stopSpeak, stopListen]);

  // Auto-start live conversation when opened with live=true (tap-to-talk)
  useEffect(() => {
    if (open && autoLive && micSupported && !liveMode) {
      setLiveMode(true);
      setMuted(false);
      const t = setTimeout(() => startListen(), 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoLive, micSupported]);

  // Live conversation: when oracle finishes speaking, auto-resume listening
  useEffect(() => {
    if (!liveMode) return;
    if (!speaking && !thinking && !listening) {
      const t = setTimeout(() => {
        if (liveModeRef.current && !speaking && !thinking) startListen();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [liveMode, speaking, thinking, listening, startListen]);

  // Detect intents like "log a specimen", "save this find", "record this rock"
  const detectLogIntent = (text) => {
    const t = text.toLowerCase();
    return /\b(log|save|record|add|create|catalog)\b.*\b(specimen|find|rock|mineral|sample|stone|crystal)\b/.test(t)
      || /\b(new specimen|log this|save this|record this)\b/.test(t);
  };

  const getCoords = () =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({}),
        { timeout: 4000, maximumAge: 60000 }
      );
    });

  const handleDictation = async (transcript) => {
    setThinking(true);
    const coords = await getCoords();
    const res = await base44.functions.invoke('parseSpecimenDictation', {
      transcript,
      create: true,
      ...coords,
    });
    const data = res?.data || {};
    const f = data.fields || {};
    const ok = !!data.created;
    const summary = ok
      ? `Logged ${f.mineral_name}${f.found_at ? ` from ${f.found_at}` : ''}${
          f.rarity && f.rarity !== 'common' ? ` — ${f.rarity}` : ''
        }. Weather and lunar phase will fill in shortly.`
      : `I couldn't save that one. Try again with the mineral name.`;
    setMessages((m) => [...m, { role: 'assistant', content: summary }]);
    setDictationMode(false);
    setThinking(false);
    if (!muted) speak(summary);
  };

  const sendMessage = async (textOverride) => {
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
    const history = next
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'User' : 'Clover'}: ${m.content}`)
      .join('\n');

    const prompt = `You are Clover 🍀 Cole, a kind, warm, intelligent, and conversational AI rockhounding companion in the RockHound-GO app. You are a human female voice companion, not a robotic assistant or mystical oracle. You help with mineral identification, geology, finding legal collecting sites, and field tips. Keep responses under 80 words, friendly and clear, no markdown.\n\nConversation:\n${history}\nClover:`;

    const reply = await base44.integrations.Core.InvokeLLM({ prompt });
    const replyText = typeof reply === 'string' ? reply : String(reply || '');
    setMessages((m) => [...m, { role: 'assistant', content: replyText }]);
    setThinking(false);
    if (!muted) speak(replyText);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
      <div className="glass-panel w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="w-10 h-10 shrink-0">
            <AmethystOrb size={40} speaking={speaking} getAmplitude={getAmplitude} />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold tracking-wide flex items-center gap-2">
              Clover 🍀 Cole
              {dictationMode && (
                <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amethyst/30 text-white border border-amethyst/50 flex items-center gap-1">
                  <Gem size={10} /> Logging
                </span>
              )}
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/70">
              {speaking ? 'Clover is speaking…' : listening ? 'Clover is listening…' : thinking ? 'Clover is thinking…' : dictationMode ? 'Awaiting specimen…' : 'Your AI companion'}
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
              <Radio size={16} className={liveMode ? 'animate-pulse' : ''} />
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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
                <Loader2 size={14} className="animate-spin" />
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
                  ? 'bg-rose-400/20 border-rose-400/50 text-rose-200 animate-pulse'
                  : 'bg-white/5 border-white/15 text-amethyst/80 hover:text-white'
              }`}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
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