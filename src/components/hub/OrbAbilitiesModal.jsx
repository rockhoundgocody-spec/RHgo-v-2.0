import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Compass, Zap, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLuckyMineralOfTheDay, playOrbChime, triggerOrbHaptic } from '@/lib/orbAudio';
import { fetchGeologyAt } from '@/lib/macrostrat';
import { base44 } from '@/api/base44Client';

export default function OrbAbilitiesModal({ open, mode, onClose, onAction }) {
  const [loading, setLoading] = useState(false);
  const [strataData, setStrataData] = useState(null);
  const [claimed, setClaimed] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const luckyMineral = getLuckyMineralOfTheDay();

  const todayKey = `rhgo_resonance_${luckyMineral.dateKey}`;

  useEffect(() => {
    if (!open) return;
    setClaimed(localStorage.getItem(todayKey) === '1');
    setJustClaimed(false);

    if (mode === 'radar') {
      loadStrata();
    }
  }, [open, mode, todayKey]);

  const loadStrata = async () => {
    setLoading(true);
    try {
      let lat = 45.1, lng = -85.9; // Default Great Lakes basin if no GPS
      const cached = sessionStorage.getItem('rhgo_last_gps');
      if (cached) {
        const parsed = JSON.parse(cached);
        lat = parsed.lat || lat;
        lng = parsed.lng || lng;
      } else if (navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => {
              lat = p.coords.latitude;
              lng = p.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      const units = await fetchGeologyAt(lat, lng);
      setStrataData({
        lat: lat.toFixed(3),
        lng: lng.toFixed(3),
        units: units.slice(0, 3),
      });
    } catch {
      setStrataData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimResonance = async () => {
    if (claimed) return;
    playOrbChime(639, 2.2);
    triggerOrbHaptic('blessing');
    localStorage.setItem(todayKey, '1');
    setClaimed(true);
    setJustClaimed(true);

    // Award +50 Exploration XP to user profile
    try {
      const me = await base44.auth.me().catch(() => null);
      if (me?.email) {
        const profiles = await base44.entities.PlayerProfile.filter({ owner_email: me.email });
        if (profiles[0]) {
          const cats = { ...(profiles[0].xp_categories || {}) };
          cats.explorer = (cats.explorer || 0) + 50;
          await base44.entities.PlayerProfile.update(profiles[0].id, {
            total_xp: (profiles[0].total_xp || 0) + 50,
            xp_categories: cats,
          });
        }
      }
    } catch {}

    onAction?.('blessing');
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[6500] flex items-end sm:items-center justify-center p-4 pb-safe"
        style={{
          background: 'hsla(250,50%,4%,0.82)',
          backdropFilter: 'blur(12px)',
          paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-3xl p-5 overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(165deg, hsl(250 30% 12%) 0%, hsl(245 25% 7%) 100%)',
            border: '1px solid hsla(270,50%,55%,0.35)',
            boxShadow: '0 16px 60px hsla(260,80%,4%,0.85), inset 0 1px 0 hsla(270,80%,90%,0.15)',
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* ── RESONANCE / BLESSING MODE ── */}
          {mode === 'resonance' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsla(45,100%,50%,0.2)', border: '1px solid hsla(45,100%,60%,0.4)' }}
                >
                  <Zap size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Daily Geode Resonance</h3>
                  <p className="text-[11px] text-white/50">Clover's planetary harmonic blessing</p>
                </div>
              </div>

              {/* Lucky Mineral Card */}
              <div
                className="p-4 rounded-2xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, hsla(270,40%,18%,0.6), hsla(240,30%,10%,0.7))',
                  border: '1px solid hsla(270,50%,50%,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                    <Star size={10} /> Lucky Mineral of the Day
                  </span>
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold"
                    style={{ background: `${luckyMineral.color}25`, color: luckyMineral.color, border: `1px solid ${luckyMineral.color}40` }}
                  >
                    {luckyMineral.rarity}
                  </span>
                </div>

                <div className="text-lg font-black text-white">{luckyMineral.name}</div>
                <div className="text-xs font-semibold text-amethyst-glow mt-0.5">{luckyMineral.buff}</div>

                <div className="mt-3 p-2.5 rounded-xl bg-black/25 border border-white/5 text-[11px] text-white/70 leading-relaxed">
                  <span className="text-amber-300 font-bold">Field Tip: </span>
                  {luckyMineral.tip}
                </div>
              </div>

              {/* Action Button */}
              {!claimed ? (
                <Button
                  onClick={handleClaimResonance}
                  className="w-full h-12 text-sm font-extrabold rounded-2xl text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, hsl(45 95% 50%), hsl(28 90% 48%))',
                    boxShadow: '0 4px 25px hsla(45,95%,50%,0.4)',
                  }}
                >
                  <Sparkles size={16} />
                  Harmonize & Claim (+50 XP)
                </Button>
              ) : (
                <div className="p-3 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 text-xs font-bold">
                  <CheckCircle2 size={16} />
                  {justClaimed ? 'Harmonized! +50 XP Active Today' : 'Resonance Active Today ✓'}
                </div>
              )}
            </div>
          )}

          {/* ── STRATA RADAR MODE ── */}
          {mode === 'radar' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsla(195,100%,50%,0.2)', border: '1px solid hsla(195,100%,60%,0.4)' }}
                >
                  <Compass size={20} className="text-hud-cyan animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Lithosphere Strata Radar</h3>
                  <p className="text-[11px] text-white/50">Real-time bedrock & formation scan</p>
                </div>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 size={28} className="animate-spin text-hud-cyan" />
                  <p className="text-xs text-white/60 font-semibold">Probing Macrostrat geological layers…</p>
                </div>
              ) : strataData && strataData.units.length > 0 ? (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  <div className="text-[10px] uppercase font-mono text-white/40 flex items-center justify-between">
                    <span>GPS: {strataData.lat}°N, {strataData.lng}°W</span>
                    <span className="text-hud-cyan font-bold">Bedrock Mapped</span>
                  </div>

                  {strataData.units.map((u, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl space-y-1"
                      style={{ background: 'hsla(240,25%,12%,0.7)', border: '1px solid hsla(195,80%,50%,0.2)' }}
                    >
                      <div className="text-xs font-bold text-white leading-snug">
                        {u.name || u.strat_name || 'Geological Unit'}
                      </div>
                      {u.age && (
                        <div className="text-[10px] text-hud-cyan font-mono">
                          Era / Age: <span className="text-white/80">{u.age}</span>
                        </div>
                      )}
                      {u.lith && (
                        <div className="text-[10px] text-white/60 leading-snug">
                          <span className="text-white/40">Lithology: </span>{u.lith}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-white/80">Glacial Drift & Superficial Sediments</p>
                  <p className="text-xs text-white/50 max-w-[240px] mx-auto leading-relaxed">
                    Bedrock is blanketed by Pleistocene glacial gravels. Prime terrain for agates, chert, and float copper!
                  </p>
                </div>
              )}

              <Button
                onClick={loadStrata}
                variant="outline"
                className="w-full h-10 text-xs font-bold rounded-xl border-white/15 text-white/80 hover:bg-white/5"
              >
                Refresh Coordinates
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
