/**
 * HeroOrb — Clover's orb on the Hub.
 * Tap once and she starts talking. From there it's hands-free: she listens
 * when she finishes, you can talk over her to interrupt, and nothing needs
 * to be typed or pressed.
 */
import React, { useState, useRef, useEffect } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import useCloverConversation from './useCloverConversation';
import CloverVoicePanel from './CloverVoicePanel.jsx';
import { base44 } from '@/api/base44Client';
import { Gem } from 'lucide-react';

const GREETINGS = (c, name) => {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const pool = [];
  const streak = c?.streak_days || 0;
  const mood = c?.mood || 'calm';
  if (streak >= 7) pool.push(`Seven days in a row, huh? That's lovely. Any plans this ${time}?`);
  if (streak >= 3) pool.push(`Hey, day ${streak + 1} together. How's it going out there?`);
  if (mood === 'radiant') pool.push('You sound like you\'re having a good one. What happened?');
  if (mood === 'drowsy') pool.push('Hey. No pressure today — I\'m just glad you\'re here.');
  pool.push(`Good ${time}, ${name}. Whatcha looking at?`);
  pool.push('Hey there. I\'m around if you want to chat.');
  pool.push('Oh hey. Find anything fun, or just wandering?');
  return pool;
};

export default function HeroOrb({ companion, todaysSpecimens = 0, size = 141 }) {
  const [ripples, setRipples] = useState([]);
  const [loggedFind, setLoggedFind] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const containerRef = useRef(null);
  const { getInteraction, injectTap } = useLiquidInteraction();

  const clover = useCloverConversation({
    companion,
    todaysSpecimens,
    onFindLogged: (name) => {
      setLoggedFind(name);
      setTimeout(() => setLoggedFind(null), 4000);
    },
  });

  const open = clover.phase !== 'idle';

  // Capture GPS once for distance-aware hunt suggestions
  useEffect(() => {
    if (!navigator.geolocation) return;
    if (sessionStorage.getItem('rhgo_last_gps')) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => sessionStorage.setItem('rhgo_last_gps', JSON.stringify({
        lat: pos.coords.latitude, lng: pos.coords.longitude,
      })),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const addRipple = (e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? e.clientX - rect.left : size / 2;
    const y = rect ? e.clientY - rect.top : size / 2;
    setRipples((r) => [...r, { id: Date.now() + Math.random(), x, y }]);
  };

  const handleOrbTap = (e) => {
    addRipple(e);
    if (e.clientX != null) injectTap(e.clientX, e.clientY);

    if (!open) {
      const pool = GREETINGS(companion, 'explorer');
      clover.start(pool[Math.floor(Math.random() * pool.length)]);
    } else {
      // Already talking — a tap means "my turn"
      clover.nudge();
    }
  };

  const handleHunt = async () => {
    if (suggestLoading) return;
    setSuggestLoading(true);
    try {
      const cached = sessionStorage.getItem('rhgo_last_gps');
      const gps = cached ? JSON.parse(cached) : {};
      const res = await base44.functions.invoke('suggestNextFinds', {
        lat: gps.lat ?? null, lng: gps.lng ?? null,
      });
      if (res?.data?.suggestions?.length) setSuggestions(res.data);
    } catch (err) {
      console.error('suggestNextFinds failed:', err);
    } finally {
      setSuggestLoading(false);
    }
  };

  const orbState = clover.phase === 'thinking' ? 'thinking'
    : clover.phase === 'speaking' ? 'speaking'
    : clover.phase === 'listening' ? 'listening'
    : 'idle';

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={handleOrbTap}
          role="button"
          aria-label={open ? 'Talk to Clover now' : 'Start talking with Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOrbTap(e)}
          style={{ width: size, height: size }}
        >
          <AmethystOrb
            size={size}
            orbState={orbState}
            level={companion?.level || 1}
            getInteraction={getInteraction}
            getAmplitude={clover.getAmplitude}
            getSpectrum={clover.getSpectrum}
          />
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => setRipples((rs) => rs.filter((rp) => rp.id !== r.id))} />
          ))}
        </div>

        {loggedFind && (
          <div
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'hsla(150,70%,40%,0.15)', border: '1px solid hsla(150,70%,50%,0.4)', color: 'hsl(150,75%,65%)' }}
          >
            <Gem size={11} /> Logged: {loggedFind}
          </div>
        )}

        {open && (
          <CloverVoicePanel
            phase={clover.phase}
            messages={clover.messages}
            interim={clover.interim}
            onClose={clover.end}
            onHunt={handleHunt}
            huntLoading={suggestLoading}
            suggestions={suggestions}
            onDismissSuggestions={() => setSuggestions(null)}
            voiceSupported={clover.voiceSupported}
            onSend={clover.send}
          />
        )}
      </div>
    </div>
  );
}