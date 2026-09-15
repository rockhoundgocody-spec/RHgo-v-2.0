/**
 * HeroOrb — Clover's companion orb on the Hub.
 * Purely visual + tactile: tap for breath sound, haptic, and ripple.
 * The conversation panel has been removed to prevent page scroll.
 * The Daily Challenge (Geode Resonance) button remains below the orb.
 */
import React, { useState, useRef, useEffect } from 'react';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import OrbAbilitiesModal from './OrbAbilitiesModal.jsx';
import { playOrbChime, playOrbBreath, triggerOrbHaptic, getLuckyMineralOfTheDay } from '@/lib/orbAudio';
import { Zap } from 'lucide-react';

export default function HeroOrb({ companion, size = 120 }) {
  const [ripples, setRipples] = useState([]);
  const [abilitiesModal, setAbilitiesModal] = useState(null);
  const [customOrbState, setCustomOrbState] = useState(null);
  const containerRef = useRef(null);
  const { getInteraction, injectTap } = useLiquidInteraction();

  const luckyMineral = getLuckyMineralOfTheDay();
  const isResonanceClaimed = typeof window !== 'undefined' && localStorage.getItem(`rhgo_resonance_${luckyMineral.dateKey}`) === '1';

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
    playOrbBreath(0.5);
    triggerOrbHaptic('tap');
  };

  const handleResonanceTap = () => {
    playOrbChime(639, 2.0);
    triggerOrbHaptic('pulse');
    setAbilitiesModal('resonance');
  };

  const orbState = customOrbState || 'idle';

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        {/* ── CORE COMPANION ORB ── */}
        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={handleOrbTap}
          role="button"
          aria-label="Clover companion"
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
            />
          </React.Suspense>
          {ripples.map((r) => (
            <WaterRipple key={r.id} x={r.x} y={r.y} onDone={() => setRipples((rs) => rs.filter((rp) => rp.id !== r.id))} />
          ))}
        </div>

        {/* ── DAILY CHALLENGE BUTTON ── */}
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