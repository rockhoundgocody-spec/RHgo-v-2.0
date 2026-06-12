import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useSpeechSynthesis, useSpeechRecognition } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import VoiceStateHUD from '@/components/oracle/VoiceStateHUD.jsx';

export default function HeroOrb({ companion, todaysSpecimens = 0 }) {
  const [ripples,    setRipples]    = useState([]);
  const [active,     setActive]     = useState(false);
  const [interim,    setInterim]    = useState('');
  const [thinking,   setThinking]   = useState(false);
  const [lastReply,  setLastReply]  = useState('');

  const containerRef  = useRef(null);
  const activeRef     = useRef(false);
  activeRef.current   = active;

  const historyRef        = useRef([]);
  const companionRef      = useRef(companion);
  companionRef.current    = companion;
  const todaysFindsRef    = useRef(todaysSpecimens);
  todaysFindsRef.current  = todaysSpecimens;

  const { speak, stop: stopSpeak, speaking, getAmplitude, getSpectrum } = useSpeechSynthesis();
  const mic    = useMicLevel();
  const micRef = useRef(mic);
  micRef.current = mic;
  const micError = mic.error;

  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;

  const handleTranscript = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;
    setInterim('');
    historyRef.current.push({ role: 'user', content: transcript });
    setThinking(true);

    try {
      const res  = await base44.functions.invoke('cloverChat', {
        history:      historyRef.current.slice(-8),
        companion:    companionRef.current,
        todays_finds: todaysFindsRef.current,
      });
      const text = res?.data?.reply || "I'm here with you.";
      historyRef.current.push({ role: 'clover', content: text });
      setLastReply(text);
      setThinking(false);
      speak(text);
    } catch {
      setThinking(false);
      const fallback = "Something went quiet on my end — try again?";
      setLastReply(fallback);
      speak(fallback);
    }
  }, [speak]);

  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleTranscript, onInterim: setInterim });

  // Re-open mic after Clover finishes speaking — small breath gap to prevent
  // the mic from catching the tail of synthesis audio
  useEffect(() => {
    if (!active || thinking || speaking) return;
    const t = setTimeout(() => {
      if (activeRef.current && !speakingRef.current && !thinkingRef.current) {
        startListen();
      }
    }, 600);
    return () => clearTimeout(t);
  }, [active, speaking, thinking, startListen]);

  // Mirror mic level to listening state
  useEffect(() => {
    if (active && listening) micRef.current.start();
    else micRef.current.stop();
  }, [active, listening]);

  useHaptic({ active: active && (speaking || listening), getAmplitude });

  useEffect(() => () => {
    stopSpeak();
    stopListen();
    try { micRef.current.stop(); } catch {}
  }, [stopSpeak, stopListen]);

  const awaken = async (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x    = rect ? e.clientX - rect.left : 70;
    const y    = rect ? e.clientY - rect.top  : 70;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);

    if (!active) {
      // Request mic permission inside the user gesture (required on mobile)
      try {
        const stream = await navigator.mediaDevices?.getUserMedia({ audio: true, video: false });
        stream?.getTracks().forEach((t) => t.stop());
      } catch {}

      setActive(true);
      setLastReply('');

      const c    = companionRef.current;
      const pool = c
        ? c.streak_days >= 3
          ? [
              `${c.streak_days} days in a row — I'm so proud of us. What are we hunting today?`,
              `Day ${c.streak_days + 1}. Let's make it count. What did you find?`,
            ]
          : [
              `I'm here. How are you, really?`,
              `Hey! Tell me what's on your mind.`,
              `Good to see you. What did you find today?`,
            ]
        : [`I'm here. What did you find?`];

      const greeting = pool[Math.floor(Math.random() * pool.length)];
      historyRef.current = [{ role: 'clover', content: greeting }];
      setLastReply(greeting);
      speak(greeting);
      startListen();
    } else {
      stopSpeak();
      stopListen();
      micRef.current.stop();
      setActive(false);
      setInterim('');
      setLastReply('');
      historyRef.current = [];
    }
  };

  const removeRipple = (id) => setRipples((r) => r.filter((rp) => rp.id !== id));

  const orbState = !active ? 'idle'
    : thinking  ? 'thinking'
    : speaking  ? 'speaking'
    : listening ? 'listening'
    : 'idle';

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={awaken}
          role="button"
          aria-label={active ? 'End conversation with Clover' : 'Talk to Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && awaken(e)}
          style={{ width: 140, height: 140 }}
        >
          <AmethystOrb
            size={140}
            orbState={orbState}
            getAmplitude={active ? getAmplitude : undefined}
            getSpectrum={active   ? getSpectrum  : undefined}
          />
          <VoiceprintRing
            size={192}
            active={active}
            getAmplitude={getAmplitude}
            getSpectrum={getSpectrum}
            getMicLevel={mic.getLevel}
            speaking={speaking || thinking}
            listening={listening}
          />
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => removeRipple(r.id)} />
          ))}
        </div>

        {/* Voice status HUD — shown when active */}
        {active && (
          <div className="mt-4 flex flex-col items-center gap-2 w-full max-w-[280px]">
            <VoiceStateHUD
              listening={listening}
              thinking={thinking}
              speaking={speaking}
              interim={interim}
              lastReply={lastReply}
            />
          </div>
        )}

        {!micSupported && !active && (
          <div className="mt-3 text-white/30 text-[11px] text-center">
            Voice not supported in this browser
          </div>
        )}

        {micError === 'denied' && (
          <div className="mt-3 px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-[11px] text-center max-w-[240px]">
            Mic access denied — enable it in your browser settings, then tap Clover again.
          </div>
        )}
        {micError === 'unavailable' && (
          <div className="mt-3 text-amber-400/60 text-[11px] text-center">
            Microphone unavailable on this device
          </div>
        )}

        <IdleWhispers enabled={active} isOrbBusy={speaking || thinking || listening} speak={speak} />
      </div>
    </div>
  );
}