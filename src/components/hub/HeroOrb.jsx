import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import DepthWell from './DepthWell.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import SpecimenGhosts from './SpecimenGhosts.jsx';
import CompassRing from './CompassRing.jsx';
import MineralOfDay from './MineralOfDay.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useOracle } from '@/components/oracle/OracleContext.jsx';
import { useSpeechSynthesis, useSpeechRecognition } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Mic, MicOff } from 'lucide-react';

export default function HeroOrb() {
  const { openOracle } = useOracle();
  const [ripples, setRipples] = useState([]);
  const [active, setActive] = useState(false);
  const [interim, setInterim] = useState('');
  const [reply, setReply] = useState('');
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState([]);
  const containerRef = useRef(null);
  const activeRef = useRef(false);
  activeRef.current = active;
  const historyRef = useRef([]);

  const { speak, stop: stopSpeak, speaking, getAmplitude, getSpectrum } = useSpeechSynthesis();
  const mic = useMicLevel();

  const handleTranscript = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;
    setInterim('');
    historyRef.current.push({ role: 'user', content: transcript });
    setHistory([...historyRef.current]);
    setThinking(true);
    const recent = historyRef.current.slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Oracle'}: ${m.content}`).join('\n');
    const prompt = `You are the Amethyst Oracle, a wise, concise field guide for rockhounds. Reply in under 60 words, no markdown, conversational and warm.\n\n${recent}\nOracle:`;
    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof res === 'string' ? res : String(res || '');
    historyRef.current.push({ role: 'oracle', content: text });
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
      openOracle({ live: false });
      return;
    }
    if (!active) {
      setActive(true);
      const greeting = "I'm here. What did you find?";
      setReply(greeting);
      historyRef.current = [{ role: 'oracle', content: greeting }];
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
    <DepthWell>
      <div className="relative flex flex-col items-center" style={{ transformStyle: 'preserve-3d' }}>
        {/* Compass arc — sits inside the well rim */}
        <CompassRing size={420} />

        {/* Orbiting specimen ghosts */}
        <SpecimenGhosts active={active} onTap={handleGhostTap} />

        {/* Mineral of the day companion */}
        <MineralOfDay active={active} onIdentify={handleMineralTap} />

        {/* Voiceprint waveform around the orb */}
        <VoiceprintRing
          size={300}
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

        {/* Status pill — bigger, higher contrast, real tap target */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-amethyst/30 min-h-[44px]">
          {active ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-200 text-[13px] font-medium tracking-wider uppercase">
                {thinking ? 'Thinking' : speaking ? 'Speaking' : listening ? 'Listening' : 'Awake'}
              </span>
              {listening ? <Mic size={14} className="text-emerald-300" />
                         : <MicOff size={14} className="text-emerald-300/50" />}
            </>
          ) : (
            <span className="text-amethyst-glow text-[13px] font-medium tracking-[0.2em] uppercase glow-amethyst">
              Tap to awaken
            </span>
          )}
        </div>

        <IdleWhispers enabled={active} isOrbBusy={speaking || thinking || listening} speak={speak} />
      </div>
    </DepthWell>
  );
}