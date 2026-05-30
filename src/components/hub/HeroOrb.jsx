import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useSpeechSynthesis, useSpeechRecognition } from '@/components/oracle/useSpeech';
import { base44 } from '@/api/base44Client';
import { Mic, MicOff } from 'lucide-react';

export default function HeroOrb({ companion, todaysSpecimens = 0 }) {
  const [ripples, setRipples] = useState([]);
  const [active, setActive] = useState(false);
  const [interim, setInterim] = useState('');
  const [thinking, setThinking] = useState(false);
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
  const micRef = useRef(mic);
  micRef.current = mic;
  const micError = mic.error; // 'denied' | 'unavailable' | null

  const handleTranscript = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;
    setInterim('');
    historyRef.current.push({ role: 'user', content: transcript });
    setThinking(true);

    try {
      const res = await base44.functions.invoke('cloverChat', {
        history: historyRef.current.slice(-6),
        companion: companionRef.current,
        todays_finds: todaysFindsRef.current,
      });
      const text = res?.data?.reply || "I'm here with you.";
      historyRef.current.push({ role: 'clover', content: text });
      setThinking(false);
      speak(text);
    } catch {
      setThinking(false);
      speak("I'm here. Something went quiet — try again.");
    }
  }, [speak]);

  const { start: startListen, stop: stopListen, listening, supported: micSupported } =
    useSpeechRecognition({ onResult: handleTranscript, onInterim: setInterim });

  // Resume listening after Clover finishes speaking.
  // Key: only watching `speaking` — when it flips false after an utterance,
  // we wait a short breath then start a fresh recognition session.
  // Guard with activeRef (not `active`) to avoid stale closure captures.
  const speakingRef = useRef(speaking);
  speakingRef.current = speaking;
  const thinkingRef = useRef(thinking);
  thinkingRef.current = thinking;

  useEffect(() => {
    if (!active || thinking || speaking) return;
    // Small breath between Clover speaking and mic opening — prevents
    // the mic from catching the tail-end of speech synthesis audio
    const t = setTimeout(() => {
      if (activeRef.current && !speakingRef.current && !thinkingRef.current) {
        startListen();
      }
    }, 700);
    return () => clearTimeout(t);
  }, [active, speaking, thinking, startListen]);

  // Mic level mirrors listening state
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
    const x = rect ? e.clientX - rect.left : 96;
    const y = rect ? e.clientY - rect.top : 96;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);

    if (!active) {
      // Eagerly request mic permission so the browser prompt fires on tap
      // (required on mobile where getUserMedia must happen in a user gesture)
      try {
        const stream = await navigator.mediaDevices?.getUserMedia({ audio: true, video: false });
        stream?.getTracks().forEach((t) => t.stop()); // immediately release — useMicLevel will re-open it
      } catch {}

      setActive(true);
      const c = companionRef.current;
      const pool = c
        ? c.streak_days >= 3
          ? [`${c.streak_days} days in a row — I'm so proud of us.`, `Hey, day ${c.streak_days + 1}. Let's make it count.`]
          : [`I'm here. How are you, really?`, `Hey friend. Tell me what's on your mind.`, `Good to see you. What did you find today?`]
        : [`I'm here. What did you find?`];
      const greeting = pool[Math.floor(Math.random() * pool.length)];
      historyRef.current = [{ role: 'clover', content: greeting }];
      speak(greeting);
      // Start listening directly inside the user gesture so iOS Safari
      // honours the permission grant — the useEffect restarts it after speech.
      startListen();
    } else {
      stopSpeak();
      stopListen();
      micRef.current.stop();
      setActive(false);
      setInterim('');
      historyRef.current = [];
    }
  };

  const removeRipple = (id) => setRipples((r) => r.filter((rp) => rp.id !== id));

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">
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

        {active && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-200 text-[13px] font-medium tracking-wider uppercase">
              {thinking ? 'thinking…' : speaking ? 'speaking…' : listening ? 'listening…' : 'here'}
            </span>
            {listening
              ? <Mic size={14} className="text-emerald-300" />
              : <MicOff size={14} className="text-emerald-300/50" />}
          </div>
        )}

        {interim && (
          <div className="mt-2 text-white/50 text-xs italic max-w-[240px] text-center truncate">
            "{interim}"
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