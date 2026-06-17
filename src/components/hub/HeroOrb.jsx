import React, { useState, useRef, useEffect, useCallback } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import VoiceprintRing from './VoiceprintRing.jsx';
import IdleWhispers from './IdleWhispers.jsx';
import useMicLevel from './useMicLevel';
import useHaptic from './useHaptic';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';
import useVoiceInput from '@/components/oracle/useVoiceInput';
import useXaiVoice from '@/components/oracle/useXaiVoice';
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
  const [ripples,    setRipples]    = useState([]);
  const [active,     setActive]     = useState(false);
  const [loggedFind, setLoggedFind] = useState(null);

  const containerRef = useRef(null);
  const activeRef    = useRef(false);
  activeRef.current  = active;

  const mic    = useMicLevel();
  const micRef = useRef(mic);
  micRef.current = mic;
  const micError = mic.error;

  // xAI Realtime Voice — primary backend
  const xai = useXaiVoice({ onFindLogged: (name) => setLoggedFind(name) });

  // Legacy TTS for the greeting only (spoken before xAI session is warmed up)
  const { speak: legacySpeak, stop: legacyStop, speaking: legacySpeaking, getAmplitude, getSpectrum } = useSpeechSynthesis();

  const speaking  = xai.speaking  || legacySpeaking;
  const listening = xai.listening;
  const thinking  = xai.status === 'connecting';
  const interim   = xai.userTranscript;
  const lastReply = xai.transcript;

  useHaptic({ active: active && (speaking || listening), getAmplitude });

  useEffect(() => () => {
    legacyStop();
    xai.disconnect();
    try { micRef.current.stop(); } catch {}
  }, []); // eslint-disable-line

  const awaken = async (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x    = rect ? e.clientX - rect.left : 70;
    const y    = rect ? e.clientY - rect.top  : 70;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);

    if (!active) {
      setActive(true);
      setLoggedFind(null);

      // Greeting via legacy TTS while xAI warms up
      const c    = companion;
      const pool = GREETINGS(c, 'explorer');
      const greeting = pool[Math.floor(Math.random() * pool.length)];
      legacySpeak(greeting);

      // Connect xAI Realtime (parallel — mic buffering starts immediately)
      xai.connect();

    } else if (speaking) {
      // Interrupt
      legacyStop();
      if (xai.status === 'active') {
        // xAI handles its own interruption via VAD — just stop legacy TTS
      }
    } else {
      // End session
      legacyStop();
      xai.disconnect();
      micRef.current.stop();
      setActive(false);
      setLoggedFind(null);
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
            size={size}
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

        {!xai.status && !active && (
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

        <IdleWhispers enabled={active} isOrbBusy={speaking || thinking || listening} speak={legacySpeak} />
      </div>
    </div>
  );
}