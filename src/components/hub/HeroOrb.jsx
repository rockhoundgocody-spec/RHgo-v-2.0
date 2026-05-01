import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import DepthWell from './DepthWell.jsx';
import { useOracle } from '@/components/oracle/OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Mic, MicOff } from 'lucide-react';

/**
 * HeroOrb — free-floating, no chat box, no popup.
 * Tap once → orb comes alive: starts listening, you speak, it answers in voice.
 * Speech transcript and reply float as ambient subtitles around the orb.
 */
export default function HeroOrb() {
  const { openOracle } = useOracle();
  const [ripples, setRipples] = useState([]);
  const [active, setActive] = useState(false);
  const [interim, setInterim] = useState('');
  const [reply, setReply] = useState('');
  const [thinking, setThinking] = useState(false);
  const containerRef = useRef(null);
  const activeRef = useRef(false);
  activeRef.current = active;
  const historyRef = useRef([]);

  const { speak, stop: stopSpeak, speaking, getAmplitude, getSpectrum } = useSpeechSynthesis();

  const handleTranscript = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;
    setInterim('');
    historyRef.current.push({ role: 'user', content: transcript });
    setThinking(true);
    const recent = historyRef.current.slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Oracle'}: ${m.content}`).join('\n');
    const prompt = `You are the Amethyst Oracle, a wise, concise field guide for rockhounds. Reply in under 60 words, no markdown, conversational and warm.\n\n${recent}\nOracle:`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof res === 'string' ? res : String(res || '');
    historyRef.current.push({ role: 'oracle', content: text });
    setReply(text);
    setThinking(false);
    speak(text);
  }, [speak]);

  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleTranscript, onInterim: setInterim });

  // When orb finishes speaking, auto-resume listening
  useEffect(() => {
    if (!active) return;
    if (!speaking && !thinking && !listening) {
      const t = setTimeout(() => {
        if (activeRef.current && !speaking && !thinking) startListen();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [active, speaking, thinking, listening, startListen]);

  // Cleanup
  useEffect(() => () => { stopSpeak(); stopListen(); }, [stopSpeak, stopListen]);

  const awaken = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 130;
    const y = rect ? e.clientY - rect.top : 130;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);

    if (!micSupported) {
      // graceful fallback only when no mic at all
      openOracle({ live: false });
      return;
    }
    if (!active) {
      setActive(true);
      const greeting = "I'm here. What did you find?";
      setReply(greeting);
      historyRef.current = [{ role: 'oracle', content: greeting }];
      speak(greeting);
    } else {
      // tap again → sleep
      stopSpeak();
      stopListen();
      setActive(false);
      setReply('');
      setInterim('');
    }
  };

  const removeRipple = (id) =>
    setRipples((r) => r.filter((rp) => rp.id !== id));

  return (
    <DepthWell>
      <div className="relative flex flex-col items-center">
        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={awaken}
          role="button"
          aria-label={active ? 'Sleep the Oracle' : 'Awaken the Oracle'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && awaken(e)}
        >
          <AmethystOrb
            size={240}
            speaking={speaking || thinking}
            getAmplitude={active ? getAmplitude : undefined}
            getSpectrum={active ? getSpectrum : undefined}
          />
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => removeRipple(r.id)} />
          ))}
        </div>

        {/* Floating status — replaces chat box entirely */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] font-mono">
          {active ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300/90">
                {thinking ? 'Thinking' : speaking ? 'Speaking' : listening ? 'Listening' : 'Awake'}
              </span>
              {listening ? <Mic size={10} className="text-emerald-300/80" />
                         : <MicOff size={10} className="text-emerald-300/40" />}
            </>
          ) : (
            <span className="text-amethyst/70">Tap to awaken</span>
          )}
        </div>

        {/* Free-floating subtitles — your voice + oracle reply, no chat box */}
        <FloatingCaption text={interim} variant="user" visible={!!interim} />
        <FloatingCaption text={reply} variant="oracle" visible={!!reply && active} />
      </div>
    </DepthWell>
  );
}

function FloatingCaption({ text, variant, visible }) {
  if (!visible) return null;
  const isOracle = variant === 'oracle';
  return (
    <div
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 max-w-xs sm:max-w-sm text-center transition-all duration-500"
      style={{
        top: isOracle ? 'calc(100% + 36px)' : 'calc(100% + 84px)',
        opacity: 0.95,
      }}
    >
      <div
        className={
          isOracle
            ? 'text-white/90 text-sm leading-relaxed glow-amethyst'
            : 'text-amethyst/70 text-xs italic'
        }
        style={isOracle ? { textShadow: '0 0 18px hsla(280,100%,70%,0.55)' } : {}}
      >
        {text}
      </div>
    </div>
  );
}