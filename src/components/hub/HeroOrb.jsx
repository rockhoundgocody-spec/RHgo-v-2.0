/**
 * HeroOrb — Clover on the Hub. Tap to talk: she speaks, listens, and stays
 * in a hands-free loop. Visual state follows listening / thinking / speaking.
 */
import React, { useState, useRef, useEffect } from 'react';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));
import WaterRipple from '@/components/visuals/WaterRipple.jsx';
import useLiquidInteraction from '@/lib/useLiquidInteraction';
import OrbAbilitiesModal from './OrbAbilitiesModal.jsx';
import CloverVoicePanel from './CloverVoicePanel.jsx';
import useCloverConversation from './useCloverConversation.js';
import { playOrbChime, playOrbBreath, triggerOrbHaptic, getLuckyMineralOfTheDay } from '@/lib/orbAudio';
import { Zap } from 'lucide-react';
import { on } from '@/lib/cloverWake';

const OPENERS = [
  "Here, hound. What are we checking?",
  "Clover's up. Find or site?",
  "Talk. I'll pull the vault or open scan.",
  "I'm listening. What did you find?",
];

export default function HeroOrb({ companion, size = 148 }) {
  const [ripples, setRipples] = useState([]);
  const [abilitiesModal, setAbilitiesModal] = useState(null);
  const [customOrbState, setCustomOrbState] = useState(null);
  const containerRef = useRef(null);
  const { getInteraction, injectTap } = useLiquidInteraction();
  const clover = useCloverConversation({ companion });

  const [wakePulse, setWakePulse] = useState(false);
  const startRef = useRef(clover.start);
  startRef.current = clover.start;
  useEffect(() => on('wake', () => {
    setWakePulse(true);
    setTimeout(() => setWakePulse(false), 900);
    triggerOrbHaptic('pulse');
    startRef.current(OPENERS[Math.floor(Math.random() * OPENERS.length)]);
  }), []);

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
    clover.unlock?.();
    playOrbBreath(0.5);
    triggerOrbHaptic('tap');

    if (clover.phase === 'idle' || clover.phase === 'resting') {
      clover.start(OPENERS[Math.floor(Math.random() * OPENERS.length)]);
      return;
    }
    if (clover.phase === 'speaking' || clover.phase === 'thinking') {
      clover.nudge();
      return;
    }
    clover.nudge();
  };

  const orbState = customOrbState
    || (clover.phase === 'resting' ? 'idle' : clover.phase === 'idle' ? 'idle' : clover.phase);

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative flex flex-col items-center">

        <div
          className="relative cursor-pointer select-none active:scale-[0.97] transition-transform"
          ref={containerRef}
          onClick={handleOrbTap}
          role="button"
          aria-label={clover.active ? 'Talk to Clover' : 'Wake Clover'}
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOrbTap(e)}
          style={{ width: size, height: size }}
        >
          {wakePulse && (
            <span className="absolute inset-0 rounded-full pointer-events-none animate-ping"
              style={{ border: '2px solid #9FE8D0', boxShadow: '0 0 30px #9FE8D080' }} />
          )}
          {(orbState === 'listening' || orbState === 'speaking') && (
            <>
              <span className="clover-listen-ring" style={{ animationDelay: '0s' }} />
              <span className="clover-listen-ring" style={{ animationDelay: '0.7s' }} />
            </>
          )}
          <React.Suspense fallback={<div style={{ width: size, height: size }} />}>
            <AmethystOrb
              size={size}
              orbState={orbState}
              speaking={clover.phase === 'speaking'}
              listening={clover.phase === 'listening'}
              thinking={clover.phase === 'thinking'}
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

        <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/35">
          {clover.phase === 'listening' ? 'Listening'
            : clover.phase === 'speaking' ? 'Speaking'
            : clover.phase === 'thinking' ? 'Thinking'
            : clover.phase === 'resting' ? 'Tap to keep talking'
            : 'Tap Clover to talk'}
        </p>

        {clover.phase !== 'idle' && (
          <div className="mt-3 w-full flex justify-center px-2">
            <CloverVoicePanel
              phase={clover.phase}
              messages={clover.messages}
              interim={clover.interim}
              onClose={clover.end}
              onHunt={() => {}}
              huntLoading={false}
              voiceSupported={clover.voiceSupported}
              onSend={clover.send}
              onListen={clover.nudge}
            />
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              playOrbChime(639, 2.0);
              triggerOrbHaptic('pulse');
              setAbilitiesModal('resonance');
            }}
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