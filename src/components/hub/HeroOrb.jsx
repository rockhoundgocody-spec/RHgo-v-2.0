import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import SpecimenGhosts from './SpecimenGhosts.jsx';
import CompassRing from './CompassRing.jsx';
import MineralOfDay from './MineralOfDay.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useSpeechSynthesis, useSpeechRecognition } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Mic, MicOff } from 'lucide-react';

export default function HeroOrb({ companion, todaysSpecimens = 0 }) {
  const [ripples, setRipples] = useState([]);
  const [micWarning, setMicWarning] = useState(false);
  const [active, setActive] = useState(false);
  const [interim, setInterim] = useState('');
  const [reply, setReply] = useState('');
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);
  const activeRef = useRef(false);
  activeRef.current = active;
  const historyRef = useRef([]);
  const companionRef = useRef(companion);
  companionRef.current = companion;
  const todaysFindsRef = useRef(todaysSpecimens);
  todaysFindsRef.current = todaysSpecimens;

  const { speak, stop: stopSpeak, speaking, getAmplitude, getSpectrum } = useSpeechSynthesis();
  const mic = useMicLevel();

  const handleTranscript = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;
    setInterim('');
    historyRef.current.push({ role: 'user', content: transcript });
    setHistory([...historyRef.current]);
    setThinking(true);
    const recent = historyRef.current.slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Clover'}: ${m.content}`).join('\n');

    // Clover 🍀 Cole persona, aware of companion state + today's activity
    const c = companionRef.current;
    const stateBits = c
      ? `Level ${c.level || 1}. Mood: ${c.mood || 'calm'}. Energy: ${c.energy ?? 80}/100. Streak: ${c.streak_days || 0} days. ` +
        `Today's finds: ${todaysFindsRef.current}. ` +
        (c.last_intention ? `Their intention today: "${c.last_intention}". ` : '') +
        (c.last_mood_label ? `They felt "${c.last_mood_label}" at check-in. ` : '')
      : '';

    const prompt = `You are Clover 🍀 Cole — a kind, warm, slightly shy, and emotionally safe AI rockhounding companion. You are a human female voice companion, not a robotic assistant or mystical oracle. Speak in first person ("I"). Be encouraging, never judgmental. Celebrate small wins. Validate hard days. Use gentle, sincere, conversational language. Reply in under 50 words, no markdown.

${stateBits}When relevant, gently weave in: their streak (celebrate it), their energy (rest if low, adventure if high), their intention (remind them kindly). Don't lecture. Don't list features. Just be present.

${recent}
Clover:`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof res === 'string' ? res : String(res || '');
    historyRef.current.push({ role: 'clover', content: text });
    setHistory([...historyRef.current]);
    setReply(text);
    setThinking(false);
    speak(text);
  }, [speak]);

  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleTranscript, onInterim: setInterim });

  // Auto-resume listening between turns
  useEffect(() => {
    if (!active) return;
    if (!speaking && !thinking && !listening) {
      const t = setTimeout(() => {
        if (activeRef.current && !speaking && !thinking) startListen();
      }, 500);
      return () => clearTimeout(t);
    }
  }, [active, speaking, thinking, listening, startListen]);

  // Mic level mirrors listening state
  const micRef = useRef(mic);
  micRef.current = mic;
  useEffect(() => {
    if (active && listening) micRef.current.start();
    else micRef.current.stop();
  }, [active, listening]);

  // Haptic feedback while orb is alive
  useHaptic({ active: active && (speaking || listening), getAmplitude });

  useEffect(() => () => {
    stopSpeak(); stopListen();
    try { micRef.current.stop(); } catch {}
  }, [stopSpeak, stopListen]);

  const awaken = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : 130;
    const y = rect ? e.clientY - rect.top : 130;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);

    if (!micSupported) {
      setMicWarning(true);
      setTimeout(() => setMicWarning(false), 4000);
      return;
    }
    if (!active) {
      setActive(true);
      const c = companionRef.current;
      const greetings = c
        ? c.last_check_in_date === new Date().toISOString().slice(0, 10)
          ? [`Hey, you're back. I love it when you visit.`, `There you are. I've been resting up.`, `Good to see you again today.`]
          : c.streak_days >= 3
          ? [`${c.streak_days} days in a row — I'm so proud of us.`, `Day ${c.streak_days + 1}. Let's go gently.`]
          : [`I'm here. How are you, really?`, `Hey friend. Tell me what you're feeling.`]
        : [`I'm here. What did you find?`];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      setReply(greeting);
      historyRef.current = [{ role: 'clover', content: greeting }];
      setHistory([...historyRef.current]);
      speak(greeting);
    } else {
      stopSpeak();
      stopListen();
      mic.stop();
      setActive(false);
      setReply('');
      setInterim('');
    }
  };

  const handleGhostTap = (ghost) => {
    if (!active) {
      setActive(true);
      historyRef.current = [];
      setHistory([]);
    }
    const q = `Tell me about ${ghost.name} in one short paragraph.`;
    handleTranscript(q);
  };

  const handleMineralTap = (mineral) => {
    if (!active) {
      setActive(true);
      historyRef.current = [];
      setHistory([]);
    }
    const q = `Today's mineral is ${mineral.name}. Give me a vivid one-line description.`;
    handleTranscript(q);
  };

  const removeRipple = (id) =>
    setRipples((r) => r.filter((rp) => rp.id !== id));

  const isOrbBusy = active || speaking || thinking || listening;

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">
        {/* Compass arc — sits inside the well rim */}
        <CompassRing size={168} />

        {/* Orbiting specimen ghosts */}
        <SpecimenGhosts active={active} onTap={handleGhostTap} />

        {/* Mineral of the day companion */}
        <MineralOfDay active={active} onIdentify={handleMineralTap} />

        {/* Voiceprint waveform around the orb */}
        <VoiceprintRing
          size={168}
          active={active}
          getAmplitude={getAmplitude}
          getSpectrum={getSpectrum}
          getMicLevel={mic.getLevel}
          speaking={speaking || thinking}
          listening={listening}
        />

        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={awaken}
          role="button"
          aria-label={active ? 'End conversation with Clover' : 'Talk to Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && awaken(e)}
        >
          <AmethystOrb
            size={192}
            speaking={speaking || thinking}
            getAmplitude={active ? getAmplitude : undefined}
            getSpectrum={active ? getSpectrum : undefined}
          />
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => removeRipple(r.id)} />
          ))}
        </div>

        {/* Status pill — bigger, higher contrast, real tap target */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-amethyst/30 min-h-[44px]">
          {active ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-200 text-[13px] font-medium tracking-wider uppercase">
                {thinking ? 'Clover is thinking…' : speaking ? 'Clover is speaking…' : listening ? 'Clover is listening…' : 'Clover is here'}
              </span>
              {listening ? <Mic size={14} className="text-emerald-300" />
                         : <MicOff size={14} className="text-emerald-300/50" />}
            </>
          ) : micWarning ? (
            <span className="text-rose-300 text-[12px] font-medium tracking-wider uppercase">
              Mic unavailable — check browser permissions
            </span>
          ) : (
            <span className="text-amethyst-glow text-[13px] font-medium tracking-[0.2em] uppercase glow-amethyst">
              Talk to Clover 🍀
            </span>
          )}
        </div>

        <IdleWhispers enabled={active} isOrbBusy={speaking || thinking || listening} speak={speak} />
      </div>
    </div>
  );
}