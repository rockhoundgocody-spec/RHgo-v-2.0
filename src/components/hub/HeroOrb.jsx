/**
 * HeroOrb — Clover's interactive orb on the Hub.
 * Uses the free cloverChat backend (InvokeLLM) — no paid xAI WebSocket.
 * Tap to open a text chat sheet; Clover replies in bubbles.
 */
import React, { useState, useRef } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import useCloverChat from './useCloverChat';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Gem, Send, X, Loader2, Volume2, VolumeX } from 'lucide-react';

const GREETINGS = (c, name) => {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const pool = [];
  const streak = c?.streak_days || 0;
  const mood = c?.mood || 'calm';
  if (streak >= 7) pool.push(`Seven days running — still going strong. What are we hunting this ${time}?`);
  if (streak >= 3) pool.push(`Day ${streak + 1} of the streak. What did you find?`);
  if (mood === 'radiant') pool.push('I can feel your energy from here. What amazing thing happened today?');
  if (mood === 'drowsy')  pool.push('Hey, no pressure. I\'m just glad you\'re here. What\'s on your mind?');
  pool.push(`Good ${time}, ${name}. What did you find out there?`);
  pool.push('Hey! Tell me what\'s on your mind.');
  pool.push('I\'m here. What did you discover today?');
  return pool;
};

export default function HeroOrb({ companion, todaysSpecimens = 0, size = 141 }) {
  const [ripples,    setRipples]    = useState([]);
  const [open,       setOpen]       = useState(false);
  const [input,      setInput]      = useState('');
  const [messages,   setMessages]   = useState([]);
  const [loggedFind, setLoggedFind] = useState(null);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const bottomRef    = useRef(null);

  const [voiceOn, setVoiceOn] = useState(() => localStorage.getItem('rhgo_clover_voice') !== 'off');
  const { getInteraction, injectTap } = useLiquidInteraction();

  const { sendMessage, loading } = useCloverChat({
    companion,
    todaysFinds: todaysSpecimens,
    onFindLogged: (name) => {
      setLoggedFind(name);
      setTimeout(() => setLoggedFind(null), 4000);
    },
  });

  const { speak, stop, speaking } = useSpeechSynthesis();

  const toggleVoice = () => {
    setVoiceOn((prev) => {
      const next = !prev;
      localStorage.setItem('rhgo_clover_voice', next ? 'on' : 'off');
      if (!next) stop();
      return next;
    });
  };

  const addRipple = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : size / 2;
    const y = rect ? e.clientY - rect.top  : size / 2;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);
  };

  const handleOrbTap = async (e) => {
    addRipple(e);
    injectTap(e.clientX, e.clientY);
    if (open) { setOpen(false); return; }

    // Open chat and send a greeting
    setOpen(true);
    const name = 'explorer';
    const pool = GREETINGS(companion, name);
    const greeting = pool[Math.floor(Math.random() * pool.length)];

    setMessages([{ role: 'assistant', content: '…', loading: true }]);
    const reply = await doSend(greeting, true);
    setMessages([{ role: 'assistant', content: reply }]);
    if (voiceOn) speak(reply);
    setTimeout(() => { inputRef.current?.focus(); }, 200);
  };

  // Returns reply text
  const doSend = async (text, isGreeting = false) => {
    let captured = '';
    // Patch sendMessage to capture reply
    const fakeOnFindLogged = (n) => setLoggedFind(n);
    try {
      const res = await base44.functions.invoke('cloverChat', {
        history: messages.filter(m => !m.loading).slice(-8).map(m => ({ role: m.role, content: m.content })),
        companion,
        todays_finds: todaysSpecimens,
      });
      captured = res?.data?.reply || "Hey, what did you find today?";
      if (res?.data?.log_find && res?.data?.find_details) {
        try {
          await base44.functions.invoke('parseSpecimenDictation', { transcript: res.data.find_details, create: true });
          fakeOnFindLogged(res.data.find_details.split(' ').slice(0, 3).join(' '));
        } catch {}
      }
    } catch {
      captured = "I couldn't connect just now — try again?";
    }
    return captured;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const thinkingMsg = { role: 'assistant', content: '…', loading: true };
    setMessages(prev => [...prev, userMsg, thinkingMsg]);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    const reply = await doSend(text);
    setMessages(prev => [
      ...prev.filter(m => !m.loading),
      { role: 'assistant', content: reply },
    ]);
    if (voiceOn) speak(reply);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const orbState = open ? (loading ? 'thinking' : 'listening') : 'idle';

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        {/* Orb */}
        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={handleOrbTap}
          role="button"
          aria-label={open ? 'Close Clover chat' : 'Talk to Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOrbTap(e)}
          style={{ width: size, height: size }}
        >
          <AmethystOrb size={size} orbState={orbState} level={companion?.level || 1} getInteraction={getInteraction} />
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => setRipples(rs => rs.filter(rp => rp.id !== r.id))} />
          ))}
        </div>

        {/* Logged-find badge */}
        {loggedFind && (
          <div
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'hsla(150,70%,40%,0.15)', border: '1px solid hsla(150,70%,50%,0.4)', color: 'hsl(150,75%,65%)' }}
          >
            <Gem size={11} /> Logged: {loggedFind}
          </div>
        )}

        {/* Chat drawer */}
        {open && (
          <div
            className="mt-4 w-full max-w-[300px] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'hsla(255,30%,14%,0.97)', border: '1px solid hsla(270,50%,55%,0.25)', boxShadow: '0 8px 40px -8px hsla(270,80%,40%,0.4)', maxHeight: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
              <span className="text-[11px] font-semibold text-amethyst-glow tracking-wide flex items-center gap-1">
                Clover 🍀 {speaking && <span className="inline-block w-1 h-1 rounded-full bg-amethyst-glow animate-pulse" />}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoice}
                  className={`transition ${voiceOn ? 'text-amethyst-glow' : 'text-white/25 hover:text-white/50'}`}
                  aria-label={voiceOn ? 'Mute Clover voice' : 'Unmute Clover voice'}
                >
                  {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button onClick={() => { stop(); setOpen(false); }} className="text-white/25 hover:text-white/60 transition">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 80 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed"
                    style={m.role === 'user'
                      ? { background: 'hsla(270,60%,40%,0.4)', border: '1px solid hsla(270,60%,60%,0.2)', color: 'hsl(280,80%,93%)' }
                      : { background: 'hsla(255,25%,20%,0.6)', border: '1px solid hsla(255,20%,40%,0.2)', color: 'rgba(255,255,255,0.78)' }
                    }
                  >
                    {m.loading
                      ? <Loader2 size={12} className="animate-spin opacity-50" />
                      : m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-2 border-t border-white/8">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tell Clover what you found…"
                disabled={loading}
                className="flex-1 bg-transparent text-[11px] text-white/75 placeholder-white/25 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="text-amethyst-glow disabled:opacity-25 transition active:scale-90"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}