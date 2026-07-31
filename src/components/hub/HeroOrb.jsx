/**
 * HeroOrb — Clover's interactive orb on the Hub.
 * Uses the free cloverChat backend (InvokeLLM) — no paid xAI WebSocket.
 * Tap to open a text chat sheet; Clover replies in bubbles.
 */
import React, { useState, useRef, useEffect } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Gem, Send, X, Loader2, Volume2, VolumeX, Target } from 'lucide-react';

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
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const { getInteraction, injectTap } = useLiquidInteraction();

  const [sending, setSending] = useState(false);

  const { speak, stop, speaking } = useSpeechSynthesis();

  // Capture GPS once for distance-aware hunt suggestions
  useEffect(() => {
    if (!navigator.geolocation) return;
    if (sessionStorage.getItem('rhgo_last_gps')) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sessionStorage.setItem('rhgo_last_gps', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

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
    const fakeOnFindLogged = (n) => {
      setLoggedFind(n);
      setTimeout(() => setLoggedFind(null), 4000);
    };
    setSending(true);
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
    } finally {
      setSending(false);
    }
    return captured;
  };

  const handleSuggestHunt = async () => {
    if (suggestLoading) return;
    setSuggestLoading(true);
    try {
      // Use last known GPS from session if available
      const cached = sessionStorage.getItem('rhgo_last_gps');
      const gps = cached ? JSON.parse(cached) : {};
      const res = await base44.functions.invoke('suggestNextFinds', {
        lat: gps.lat ?? null,
        lng: gps.lng ?? null,
      });
      const data = res?.data;
      if (data?.suggestions?.length) {
        setSuggestions(data);
        if (voiceOn) speak(data.clover_intro);
      }
    } catch (err) {
      console.error('suggestNextFinds failed:', err);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
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

  const orbState = open ? (sending ? 'thinking' : 'listening') : 'idle';

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
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSuggestHunt}
                  disabled={suggestLoading}
                  className="flex items-center gap-1 text-[10px] font-semibold transition text-amethyst-glow disabled:opacity-40 active:scale-90"
                  aria-label="Get hunt suggestions"
                >
                  {suggestLoading ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
                  <span>Hunt</span>
                </button>
                <button
                  onClick={toggleVoice}
                  className={`transition ${voiceOn ? 'text-amethyst-glow' : 'text-white/25 hover:text-white/50'}`}
                  aria-label={voiceOn ? 'Mute Clover voice' : 'Unmute Clover voice'}
                >
                  {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button onClick={() => { stop(); setOpen(false); }} aria-label="Close" className="text-white/25 hover:text-white/60 transition">
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
              {/* Hunt suggestions card */}
              {suggestions && (
                <div className="rounded-xl overflow-hidden"
                  style={{ background: 'hsla(270,40%,20%,0.35)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
                  <div className="px-3 py-2 text-[10px] font-bold text-amethyst-glow tracking-wide"
                    style={{ borderBottom: '1px solid hsla(280,80%,60%,0.2)', background: 'hsla(270,60%,30%,0.25)' }}>
                    🎯 Hunt Next — {suggestions.collection_size} in collection
                  </div>
                  <div className="space-y-2 p-2">
                    {suggestions.clover_intro && (
                      <p className="text-[10px] text-white/70 italic px-1">{suggestions.clover_intro}</p>
                    )}
                    {suggestions.suggestions.map((s, i) => (
                      <div key={i} className="rounded-lg p-2"
                        style={{ background: 'hsla(255,30%,14%,0.6)', border: '1px solid hsla(280,60%,50%,0.18)' }}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold text-amethyst-glow flex items-center gap-1">
                            <Gem size={9} /> {s.mineral_name}
                          </span>
                          {s.distance_mi != null && (
                            <span className="text-[8px] font-mono text-hud-cyan/70">{s.distance_mi}mi</span>
                          )}
                        </div>
                        {s.hotspot_name && (
                          <p className="text-[9px] text-hud-cyan/80 mb-1">📍 {s.hotspot_name}</p>
                        )}
                        <p className="text-[9px] text-white/65 leading-relaxed mb-1">{s.what_to_look_for}</p>
                        <p className="text-[9px] text-white/40 italic leading-relaxed">{s.why}</p>
                      </div>
                    ))}
                    <button
                      onClick={() => setSuggestions(null)}
                      className="w-full text-[9px] text-white/35 hover:text-white/60 transition py-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
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
                disabled={sending}
                className="flex-1 bg-transparent text-[11px] text-white/75 placeholder-white/25 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="text-amethyst-glow disabled:opacity-25 transition active:scale-90"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}