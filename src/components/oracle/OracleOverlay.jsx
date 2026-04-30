import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useOracle } from './OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from './useSpeech';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';

export default function OracleOverlay() {
  const { open, closeOracle } = useOracle();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "I am the Amethyst Oracle. Ask me about minerals, hotspots, or anything you've found.",
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const scrollRef = useRef(null);

  const { speak, stop: stopSpeak, speaking } = useSpeechSynthesis();
  const handleVoiceResult = useCallback((transcript) => {
    setInput(transcript);
    // auto-send after voice result
    setTimeout(() => sendMessage(transcript), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleVoiceResult });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  useEffect(() => {
    if (!open) {
      stopSpeak();
      stopListen();
    }
  }, [open, stopSpeak, stopListen]);

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || thinking) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setThinking(true);

    const history = next
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'User' : 'Oracle'}: ${m.content}`)
      .join('\n');

    const prompt = `You are the Amethyst Oracle, a wise, concise guide for rockhounds in the RockHound-GO app. You help with mineral identification, geology, finding legal collecting sites, and field tips. Keep responses under 80 words, friendly and clear, no markdown.\n\nConversation:\n${history}\nOracle:`;

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
            <AmethystOrb size={40} />
          </div>
          <div className="flex-1">
            <div className="text-white font-semibold tracking-wide">Amethyst Oracle</div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-amethyst/70">
              {speaking ? 'Speaking…' : listening ? 'Listening…' : thinking ? 'Thinking…' : 'Online'}
            </div>
          </div>
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
            placeholder="Ask the Oracle…"
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