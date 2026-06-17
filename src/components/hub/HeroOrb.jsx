import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import { base44 } from '@/api/base44Client';
import { Gem } from 'lucide-react';
import VoiceStateHUD from '@/components/oracle/VoiceStateHUD.jsx';

const GREETINGS = (c, name) => {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  if (!c) return [`Hey ${name}! What did you find?`];

  const mood = c.mood || 'calm';
  const streak = c.streak_days || 0;
  const energy = c.energy ?? 80;
  const intention = c.last_intention;

  const pool = [];

  // Streak-based
  if (streak >= 7) pool.push(`Seven days running — you're unstoppable. What are we hunting this ${timeOfDay}?`);
  if (streak >= 3) pool.push(`Day ${streak + 1} of the streak. Still going strong. What did you find?`);

  // Mood-based
  if (mood === 'radiant') pool.push(`I can feel your energy from here. What amazing thing happened today?`);
  if (mood === 'happy')   pool.push(`Good ${timeOfDay}! You seem in great spirits. Find anything cool?`);
  if (mood === 'drowsy')  pool.push(`Hey, no pressure. I'm just glad you're here. What's on your mind?`);
  if (mood === 'tender')  pool.push(`Taking it slow is perfectly fine. I'm here. What did you find today?`);

  // Energy-based
  if (energy < 30) pool.push(`Low energy day? Let's keep it light. Anything catch your eye recently?`);
  if (energy > 90) pool.push(`You're charged up! I love it. What's the best thing you've spotted lately?`);

  // Intention callback
  if (intention) pool.push(`Good ${timeOfDay}! Did that intention — "${intention.slice(0, 40)}" — pan out for you?`);

  // Fallbacks
  pool.push(`Good ${timeOfDay}, ${name}. What did you find out there?`);
  pool.push(`Hey! Tell me what's on your mind.`);
  pool.push(`I'm here. What did you discover today?`);

  return pool;
};

export default function HeroOrb({ companion, todaysSpecimens = 0, size = 141 }) {
  const [ripples,       setRipples]       = useState([]);
  const [active,        setActive]        = useState(false);
  const [interim,       setInterim]       = useState('');
  const [thinking,      setThinking]      = useState(false);
  const [lastReply,     setLastReply]     = useState('');
  const [interrupted,   setInterrupted]   = useState(false);
  const [loggedFind,    setLoggedFind]    = useState(null);

  const gpsPosRef = useRef(null);

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
      const data = res?.data || {};
      let text = data.reply || "I'm here with you.";

      // Hands-free find logging — parse the dictation and save the specimen
      if (data.log_find && data.find_details) {
        try {
          const logRes = await base44.functions.invoke('parseSpecimenDictation', {
            transcript: data.find_details,
            create: true,
            lat: gpsPosRef.current?.lat,
            lng: gpsPosRef.current?.lng,
          });
          const created = logRes?.data?.created;
          if (created?.mineral_name) {
            text += ` ${created.mineral_name} is in your GeoDex.`;
            setLoggedFind(created.mineral_name);
          }
        } catch {
          text += " I couldn't save that one — try logging it again in a moment.";
        }
      }

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
    useVoiceInput({ onResult: handleTranscript, onInterim: setInterim });

  // Re-open mic after Clover finishes speaking
  // Shorter gap when user interrupted (they're ready to talk immediately)
  useEffect(() => {
    if (!active || thinking || speaking || listening) return;
    if (interrupted) {
      setInterrupted(false);
      // Very short gap — user already spoke intent by tapping
      const t = setTimeout(() => {
        if (activeRef.current && !speakingRef.current && !thinkingRef.current) startListen();
      }, 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      if (activeRef.current && !speakingRef.current && !thinkingRef.current) startListen();
    }, 450);
    return () => clearTimeout(t);
  }, [active, speaking, thinking, listening, startListen, interrupted]);

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
      setLoggedFind(null);

      // Capture GPS so dictated finds get geotagged
      navigator.geolocation?.getCurrentPosition(
        (pos) => { gpsPosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );

      const c    = companionRef.current;
      const name = 'explorer';
      const pool = GREETINGS(c, name);
      const greeting = pool[Math.floor(Math.random() * pool.length)];
      historyRef.current = [{ role: 'clover', content: greeting }];
      setLastReply(greeting);
      speak(greeting);
      startListen();

    } else if (speaking) {
      // INTERRUPT: user taps while Clover is speaking → cut her off, listen immediately
      stopSpeak();
      setInterrupted(true);
      setInterim('');
      // Don't close the session — just switch to listening

    } else {
      // Tap while idle/listening → close session
      stopSpeak();
      stopListen();
      micRef.current.stop();
      setActive(false);
      setInterim('');
      setLastReply('');
      setLoggedFind(null);
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
          aria-label={!active ? 'Talk to Clover' : speaking ? 'Interrupt Clover' : 'End conversation with Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && awaken(e)}
          style={{ width: size, height: size }}
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
            {loggedFind && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'hsla(150,70%,40%,0.15)',
                  border: '1px solid hsla(150,70%,50%,0.4)',
                  color: 'hsl(150,75%,65%)',
                }}
              >
                <Gem size={11} /> Logged: {loggedFind}
              </div>
            )}
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