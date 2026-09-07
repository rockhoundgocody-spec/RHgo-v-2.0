/**
 * HeroOrb — Clover's sentient companion orb on the Hub.
 * Upgraded with:
 * - High-performance WebGL/WebGPU shaders with viewport intersection culling
 * - Interactive crystal singing bowl harmonic audio synthesis (432/528/639/741 Hz) & haptics
 * - Daily Geode Resonance (+50 XP daily buff & lucky mineral generator)
 * - Lithosphere Strata Radar (live GPS bedrock & formation scanner)
 * - Multi-modal voice, quick prompt chips, and liquid touch response
 */
import React, { useState, useRef, useEffect } from 'react';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import useCloverConversation from './useCloverConversation';
import CloverVoicePanel from './CloverVoicePanel.jsx';
import OrbAbilitiesModal from './OrbAbilitiesModal.jsx';
import { playOrbChime, playOrbBreath, triggerOrbHaptic, getLuckyMineralOfTheDay } from '@/lib/orbAudio';
import { base44 } from '@/api/base44Client';
import { Gem, Zap } from 'lucide-react';

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
  const [abilitiesModal, setAbilitiesModal] = useState(null); // 'resonance' | 'radar' | null
  const [customOrbState, setCustomOrbState] = useState(null); // 'blessing' | 'radar' | null
  const containerRef = useRef(null);
  const { getInteraction, injectTap } = useLiquidInteraction();

  const luckyMineral = getLuckyMineralOfTheDay();
  const isResonanceClaimed = typeof window !== 'undefined' && localStorage.getItem(`rhgo_resonance_${luckyMineral.dateKey}`) === '1';

  const clover = useCloverConversation({
    companion,
    todaysSpecimens,
    onFindLogged: (name) => {
      setLoggedFind(name);
      setTimeout(() => setLoggedFind(null), 4000);
    },
  });

  const open = clover.phase !== 'idle';

  // Capture GPS once for distance-aware hunt suggestions and strata radar
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

    // Soft breath acknowledgment — she turns toward you, not a bell
    playOrbBreath(0.5);
    triggerOrbHaptic('tap');

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

  const handleResonanceTap = () => {
    playOrbChime(639, 2.0);
    triggerOrbHaptic('pulse');
    setAbilitiesModal('resonance');
  };

  const orbState = customOrbState || (
    clover.phase === 'thinking' ? 'thinking'
    : clover.phase === 'speaking' ? 'speaking'
    : clover.phase === 'listening' ? 'listening'
    : 'idle'
  );

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        {/* ── CORE COMPANION ORB ── */}
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
          <React.Suspense fallback={<div style={{ width: size, height: size }} />}>
            <AmethystOrb
              size={size}
              orbState={orbState}
              level={companion?.level || 1}
              getInteraction={getInteraction}
              getAmplitude={clover.getAmplitude}
              getSpectrum={clover.getSpectrum}
            />
          </React.Suspense>
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => setRipples((rs) => rs.filter((rp) => rp.id !== r.id))} />
          ))}
        </div>

        {/* ── ORB ABILITIES TRAY (Quick Access to Resonance & Radar) ── */}
        {!open && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={handleResonanceTap}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
              style={{
                background: isResonanceClaimed
                  ? 'hsla(45,70%,20%,0.3)'
                  : 'linear-gradient(135deg, hsla(45,100%,50%,0.35), hsla(28,95%,45%,0.35))',
                border: isResonanceClaimed
                  ? '1px solid hsla(45,60%,50%,0.3)'
                  : '1px solid hsla(45,100%,60%,0.5)',
                color: isResonanceClaimed ? 'hsl(45,80%,75%)' : '#fef08a',
              }}
              title="Daily Geode Resonance"
            >
              <Zap size={12} className={isResonanceClaimed ? 'text-amber-400' : 'text-amber-300 animate-pulse'} />
              <span>{isResonanceClaimed ? 'Resonance Active' : 'Daily Challenge'}</span>
            </button>
          </div>
        )}

        {loggedFind && (
          <div
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'hsla(150,70%,40%,0.15)', border: '1px solid hsla(150,70%,50%,0.4)', color: 'hsl(150,75%,65%)' }}
          >
            <Gem size={11} /> Logged: {loggedFind}
          </div>
        )}

        {/* ── CONVERSATION PANEL ── */}
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

      {/* ── ABILITIES MODAL (Resonance & Strata Radar) ── */}
      <OrbAbilitiesModal
        open={!!abilitiesModal}
        mode={abilitiesModal}
        onClose={() => setAbilitiesModal(null)}
        onAction={(action) => {
          if (action === 'blessing') {
            setCustomOrbState('blessing');
            setTimeout(() => setCustomOrbState((s) => s === 'blessing' ? null : s), 4500);
          }
        }}
      />
    </div>
  );
}