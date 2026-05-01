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
    }
    const q = `Tell me about ${ghost.name} in one short paragraph.`;
    handleTranscript(q);
  };

  const handleMineralTap = (mineral) => {
    if (!active) {
      setActive(true);
      historyRef.current = [];
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

        {/* Status pill */}
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

        <FloatingCaption text={interim} variant="user" visible={!!interim} />
        <FloatingCaption text={reply} variant="oracle" visible={!!reply && active} />

        <IdleWhispers enabled={active} isOrbBusy={speaking || thinking || listening} speak={speak} />
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
        top: isOracle ? 'calc(100% + 40px)' : 'calc(100% + 90px)',
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