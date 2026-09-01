import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MineralStoryCard from './MineralStoryCard.jsx';
import QuickIDStack from './QuickIDStack.jsx';
import DeepAnalysisPanel from './DeepAnalysisPanel.jsx';
import CrystalLatticeViewer from './CrystalLatticeViewer.jsx';
import MohsScratchLab from './MohsScratchLab.jsx';
import ProvenanceCertificateModal from './ProvenanceCertificateModal.jsx';
import JuniorExplorerCard from './JuniorExplorerCard.jsx';
import useKidMode from '@/lib/useKidMode';
import {
  Sparkles, RotateCcw, GitCompare, Pencil, Microscope, CheckCircle2,
  Zap, FlaskConical, BookOpen, Star, Shield, Cloud, Gem, Hammer,
  Compass, Camera, ArrowRight, Check, Award, Eye, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CorrectionModal from './CorrectionModal.jsx';
import RarityFireworks from './RarityFireworks.jsx';
import FieldRarityBadge from './FieldRarityBadge.jsx';
import ContextIntegrityCard from './ContextIntegrityCard.jsx';
import useReducedMotion from '@/lib/useReducedMotion';

const RARITY_CFG = {
  common:    { label: 'Common',    color: '#94a3b8', glow: 'hsla(215,20%,55%,0.4)',  border: 'hsla(215,20%,55%,0.3)',  badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  uncommon:  { label: 'Uncommon',  color: '#34d399', glow: 'hsla(160,70%,50%,0.45)', border: 'hsla(160,70%,50%,0.35)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rare:      { label: 'Rare',      color: '#38bdf8', glow: 'hsla(200,90%,60%,0.5)',  border: 'hsla(200,90%,60%,0.4)',  badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  legendary: { label: 'Legendary', color: '#a78bfa', glow: 'hsla(270,80%,65%,0.6)',  border: 'hsla(270,80%,65%,0.5)',  badge: 'bg-amethyst/20 text-amethyst-glow border-amethyst/40' },
};

const TABS = [
  { id: 'overview',   icon: Sparkles,     label: 'Field Guide' },
  { id: 'candidates', icon: Zap,          label: 'Matches' },
  { id: 'tests',      icon: FlaskConical, label: 'Tests' },
  { id: 'deep',       icon: BookOpen,     label: 'Deep & Lore' },
];

function confidenceLabel(c) {
  if (c >= 0.88) return { text: 'Near Certain', color: '#34d399' };
  if (c >= 0.72) return { text: 'High Confidence', color: '#38bdf8' };
  if (c >= 0.52) return { text: 'Moderate', color: '#fbbf24' };
  return { text: 'Low — Needs Tests', color: '#f87171' };
}

export default function HolographicResult({
  primaryImageUrl,
  result,
  reasoningResult,
  onSave,
  onReset,
  onCompare,
  onShareMap,
  saved,
  savedId,
  modelVersion = 'gemini-flash',
  onDeepAnalysis,
  deepAnalysis,
  deepLoading,
  gpsCoords,
}) {
  const navigate = useNavigate();
  const tiltRef = useRef(null);
  const tabRefs = useRef(new Map());
  const isKidDefault = useKidMode();
  const [kidMode, setKidMode] = useState(isKidDefault);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [uvMode, setUvMode] = useState(false);
  const [fireworksTrigger, setFireworksTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('overview'); // overview | candidates | tests | deep
  const reduceMotion = useReducedMotion();

  const toggleKidMode = () => {
    const next = !kidMode;
    setKidMode(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('rhgo_mode', next ? 'kid' : 'pro');
      window.dispatchEvent(new Event('rhgo-mode-change'));
    }
  };

  useEffect(() => {
    if (saved) setFireworksTrigger((n) => n + 1);
  }, [saved]);

  // Parallax tilt on desktop
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    if (reduceMotion) {
      el.style.transform = 'none';
      return;
    }
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientY - (r.top + r.height / 2)) / r.height) * -8;
      target.y = ((e.clientX - (r.left + r.width / 2)) / r.width) * 8;
    };
    let raf;
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      el.style.transform = `perspective(1000px) rotateX(${cur.x}deg) rotateY(${cur.y}deg)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, [reduceMotion]);

  const rarity = result?.rarity || 'common';
  const rc = RARITY_CFG[rarity] || RARITY_CFG.common;
  const conf = result?.confidence ?? 0;
  const confLabel = confidenceLabel(conf);
  const candidates = result?.candidates || [];
  const features = result?.observed_features || [];
  const tests = result?.verification_tests || [];
  const lookalikes = result?.lookalikes || [];

  // Scannable geological metrics
  const hardness = result?.hardness_mohs != null ? `${result.hardness_mohs} Mohs` : '5.5–6.5 Mohs';
  const crystalSystem = result?.crystal_system || 'Amorphous';
  const lusterFeature = features.find(f => f.feature?.toLowerCase().includes('luster'))?.value;
  const luster = lusterFeature || 'Vitreous';
  const valueEstimate = result?.value_estimate || '$10 – $35';
  const scientificFormula = [result?.scientific_name, result?.chemical_formula].filter(Boolean).join(' · ');
  const topMatchLower = (result?.top_match || '').toLowerCase();

  const focusTab = (index) => {
    const tab = TABS[(index + TABS.length) % TABS.length];
    setActiveTab(tab.id);
    tabRefs.current.get(tab.id)?.focus();
  };

  const handleTabKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') focusTab(index + 1);
    else if (event.key === 'ArrowLeft') focusTab(index - 1);
    else if (event.key === 'Home') focusTab(0);
    else if (event.key === 'End') focusTab(TABS.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <>
      <RarityFireworks result={result} trigger={fireworksTrigger} />

      {/* ── HERO SPECIMEN CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            border: `1px solid ${rc.border}`,
            boxShadow: `0 0 50px -10px ${rc.glow}, 0 0 0 1px ${rc.border}`,
          }}
        >
          {/* Tilt-parallax image frame */}
          <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ perspective: '1000px' }}>
            <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
              {primaryImageUrl ? (
                <img src={primaryImageUrl} alt={result?.top_match || 'specimen'} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Sparkles size={48} style={{ color: rc.color, opacity: 0.4 }} />
                </div>
              )}
              {/* Color wash */}
              <div
                className="absolute inset-0 mix-blend-screen pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 35%, ${rc.glow} 0%, transparent 65%)` }}
              />
              {/* Scanline grid */}
              <div
                className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, hsla(195,100%,70%,0.3) 0 1px, transparent 1px 4px)' }}
              />
              {/* 365nm UV Blacklight Excitation Overlay */}
              {uvMode && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500 animate-pulse"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${
                      topMatchLower.includes('yooperlite') || topMatchLower.includes('sodalite')
                        ? 'hsla(35, 100%, 55%, 0.85)'
                        : topMatchLower.includes('fluorite')
                        ? 'hsla(260, 100%, 65%, 0.8)'
                        : topMatchLower.includes('calcite')
                        ? 'hsla(340, 100%, 60%, 0.75)'
                        : 'hsla(280, 100%, 65%, 0.5)'
                    } 0%, hsla(270, 100%, 25%, 0.7) 50%, hsla(250, 100%, 6%, 0.92) 100%)`,
                    mixBlendMode: 'screen',
                  }}
                />
              )}
            </div>

            {/* Rarity badge — top left */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-[0.22em] px-3 py-1 rounded-full border shadow-sm ${rc.badge}`}>
                {rc.label}
              </span>
              <FieldRarityBadge
                mineralName={result?.top_match}
                lat={gpsCoords?.lat}
                lng={gpsCoords?.lng}
                baseRarity={rarity}
              />
            </div>

            {/* Calibrated confidence chip & 365nm UV Mode Toggle — top right */}
            <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
              <div
                className="px-3 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5"
                style={{
                  background: 'hsla(220,40%,5%,0.88)',
                  color: confLabel.color,
                  border: `1px solid ${confLabel.color}50`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: confLabel.color }} />
                {(conf * 100).toFixed(0)}% · {confLabel.text}
              </div>

              {/* 365nm UV Blacklight Toggle */}
              <button
                type="button"
                onClick={() => setUvMode(!uvMode)}
                className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-md active:scale-95"
                style={{
                  background: uvMode ? 'hsl(280 90% 55%)' : 'hsla(240,40%,6%,0.88)',
                  border: uvMode ? '1px solid hsl(280 100% 75%)' : '1px solid hsla(0,0%,100%,0.2)',
                  color: uvMode ? '#fff' : 'hsla(0,0%,100%,0.7)',
                  boxShadow: uvMode ? '0 0 15px hsla(280,100%,60%,0.6)' : 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Zap size={10} className={uvMode ? 'text-yellow-300 animate-pulse' : ''} />
                <span>{uvMode ? '365nm UV' : 'UV Mode'}</span>
              </button>
            </div>

            {/* Mineral name & formula overlay at bottom of photo */}
            <div
              className="absolute bottom-0 inset-x-0 z-10 p-4 pt-10"
              style={{ background: 'linear-gradient(0deg, hsla(240,40%,4%,0.98) 0%, hsla(240,40%,4%,0.7) 60%, transparent 100%)' }}
            >
              <div className="text-2xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                {result?.top_match || 'Unknown Specimen'}
              </div>
              {scientificFormula && (
                <div className="text-xs font-semibold text-amethyst-glow/90 mt-0.5 font-mono">
                  {scientificFormula}
                </div>
              )}
              {result?.description && (
                <p className="text-white/60 text-xs mt-1 line-clamp-2 leading-relaxed">
                  {result.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── INSTANT GEOLOGICAL SPECS BAR (Scannable in 1 glance) ── */}
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        <div
          className="rounded-2xl p-2.5 text-center"
          style={{ background: 'hsla(240,25%,10%,0.7)', border: '1px solid hsla(270,20%,30%,0.25)' }}
        >
          <div className="text-[8px] uppercase tracking-wider text-white/40 mb-0.5 flex items-center justify-center gap-1 font-semibold">
            <Hammer size={10} className="text-amber-400" /> Mohs
          </div>
          <div className="text-xs font-black text-white font-mono truncate">{hardness}</div>
        </div>

        <div
          className="rounded-2xl p-2.5 text-center"
          style={{ background: 'hsla(240,25%,10%,0.7)', border: '1px solid hsla(270,20%,30%,0.25)' }}
        >
          <div className="text-[8px] uppercase tracking-wider text-white/40 mb-0.5 flex items-center justify-center gap-1 font-semibold">
            <Compass size={10} className="text-cyan-400" /> System
          </div>
          <div className="text-xs font-black text-white truncate">{crystalSystem}</div>
        </div>

        <div
          className="rounded-2xl p-2.5 text-center"
          style={{ background: 'hsla(240,25%,10%,0.7)', border: '1px solid hsla(270,20%,30%,0.25)' }}
        >
          <div className="text-[8px] uppercase tracking-wider text-white/40 mb-0.5 flex items-center justify-center gap-1 font-semibold">
            <Sparkles size={10} className="text-emerald-400" /> Luster
          </div>
          <div className="text-xs font-black text-white truncate">{luster}</div>
        </div>

        <div
          className="rounded-2xl p-2.5 text-center"
          style={{ background: 'hsla(240,25%,10%,0.7)', border: '1px solid hsla(270,20%,30%,0.25)' }}
        >
          <div className="text-[8px] uppercase tracking-wider text-white/40 mb-0.5 flex items-center justify-center gap-1 font-semibold">
            <Gem size={10} className="text-purple-400" /> Value
          </div>
          <div className="text-xs font-black text-white truncate">{valueEstimate}</div>
        </div>
      </div>

      {/* ── DIGITAL COLLECTION ACTION BAR ── */}
      {!saved ? (
        <div className="mt-3 flex gap-2">
          <Button
            onClick={onSave}
            className="flex-1 h-13 text-sm font-extrabold rounded-2xl text-white active:scale-[0.98] transition-all shadow-lg"
            style={{
              background: `linear-gradient(135deg, hsl(280 75% 52%), hsl(260 80% 42%))`,
              border: `1px solid ${rc.border}`,
              boxShadow: `0 4px 25px ${rc.glow}`,
            }}
          >
            <Gem size={17} className="mr-2 text-amethyst-glow" />
            Add to Digital Collection (+25 XP)
          </Button>
          {onCompare && (
            <Button
              onClick={onCompare}
              variant="outline"
              className="h-13 px-3.5 border-white/15 text-white/70 hover:bg-white/5 rounded-2xl focus-visible:ring-2 focus-visible:ring-amethyst-glow"
              title="Compare with other specimens"
              aria-label="Compare with other specimens"
            >
              <GitCompare size={17} />
            </Button>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            className="h-13 px-3.5 border-white/15 text-white/70 hover:bg-white/5 rounded-2xl focus-visible:ring-2 focus-visible:ring-amethyst-glow"
            title="Scan a new specimen"
            aria-label="Scan a new specimen"
          >
            <RotateCcw size={17} />
          </Button>
        </div>
      ) : (
        /* SAVED CELEBRATION & NEXT ACTION BUTTONS */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl p-3.5 border"
          style={{
            background: 'linear-gradient(135deg, hsla(160,70%,14%,0.6), hsla(240,30%,8%,0.7))',
            borderColor: 'hsla(160,70%,45%,0.45)',
            boxShadow: '0 0 30px hsla(160,70%,45%,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-300 shrink-0"
                style={{ background: 'hsla(160,70%,40%,0.25)', border: '1px solid hsla(160,70%,50%,0.4)' }}
              >
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="text-white font-black text-sm leading-tight">Etched into Digital Collection!</div>
                <div className="text-emerald-400 text-[11px] font-semibold mt-0.5">+25 Collector XP Awarded</div>
              </div>
            </div>
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Cataloged
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              onClick={() => navigate(savedId ? `/specimen/${savedId}` : '/collection')}
              className="h-11 text-xs font-extrabold rounded-xl text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, hsl(160 75% 38%), hsl(175 80% 32%))',
                border: '1px solid hsla(160,80%,55%,0.5)',
                boxShadow: '0 2px 14px hsla(160,80%,35%,0.3)',
              }}
            >
              <BookOpen size={14} />
              View in GeoDex
            </Button>
            <Button
              onClick={onReset}
              className="h-11 text-xs font-extrabold rounded-xl text-white/90 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, hsl(270 50% 30%), hsl(250 40% 20%))',
                border: '1px solid hsla(270,50%,50%,0.35)',
              }}
            >
              <Camera size={14} />
              Scan Next Rock
            </Button>
          </div>

          <button
            onClick={() => setCertOpen(true)}
            type="button"
            className="mt-2.5 w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition active:scale-98"
          >
            <Award size={14} />
            Official Provenance Certificate
          </button>

          {onShareMap && (
            <button
              onClick={onShareMap}
              type="button"
              className="mt-2 w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-400/80 hover:text-emerald-300 transition-colors"
            >
              <MapPin size={12} />
              Submit find location for public map review
            </button>
          )}
        </motion.div>
      )}

      {/* ── JUNIOR EXPLORER CARD (KID-FRIENDLY SUPERPOWERS & DINOSAUR ERA) ── */}
      <div className="mt-3">
        <JuniorExplorerCard
          mineralName={result?.top_match}
          isKidMode={kidMode}
          onToggleMode={toggleKidMode}
        />
      </div>

      {/* ── TAB BAR ── */}
      <div
        role="tablist"
        aria-label="Specimen analysis"
        className="mt-3 flex gap-1 p-1 rounded-2xl"
        style={{ background: 'hsla(240,30%,6%,0.85)', border: '1px solid hsla(270,30%,30%,0.25)' }}
      >
        {TABS.map(({ id, icon: Icon, label }, index) => (
          <button
            key={id}
            ref={(node) => {
              if (node) tabRefs.current.set(id, node);
              else tabRefs.current.delete(id);
            }}
            id={`result-tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`result-panel-${id}`}
            tabIndex={activeTab === id ? 0 : -1}
            onClick={() => setActiveTab(id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all text-[10px] font-bold uppercase tracking-[0.15em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow"
            style={{
              background: activeTab === id ? `hsla(270,60%,30%,0.5)` : 'transparent',
              color: activeTab === id ? rc.color : 'hsla(0,0%,100%,0.4)',
              border: activeTab === id ? `1px solid ${rc.border}` : '1px solid transparent',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB PANELS ── */}
      <div
        className="mt-2.5 rounded-2xl overflow-hidden mb-6"
        style={{ background: 'hsla(240,25%,7%,0.75)', border: '1px solid hsla(270,25%,25%,0.3)' }}
      >
        {/* OVERVIEW / FIELD GUIDE TAB */}
        {activeTab === 'overview' && (
          <div
            id="result-panel-overview"
            role="tabpanel"
            aria-labelledby="result-tab-overview"
            tabIndex={0}
            className="p-4 space-y-4 focus-visible:outline-none"
          >
            {/* Physical Characteristics */}
            {features.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5 font-bold">
                  <Sparkles size={11} className="text-amethyst-glow" /> Observed Physical Features
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {features.map((f, i) => (
                    <div
                      key={i}
                      className="px-3 py-2 rounded-xl"
                      style={{ background: 'hsla(240,25%,11%,0.6)', border: '1px solid hsla(270,20%,25%,0.25)' }}
                    >
                      <div className="text-[9px] uppercase tracking-wider text-white/35 font-mono">{f.feature}</div>
                      <div className="text-xs font-bold text-white/90 mt-0.5 leading-snug">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D Crystal System Lattice Inspector */}
            <CrystalLatticeViewer
              crystalSystem={crystalSystem}
              mineralName={result?.top_match}
            />

            {/* Geological Formation & Origin */}
            {result?.formation && (
              <div
                className="p-3.5 rounded-xl space-y-1"
                style={{ background: 'hsla(240,25%,11%,0.5)', border: '1px solid hsla(270,20%,30%,0.2)' }}
              >
                <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Compass size={11} /> Geological Formation
                </div>
                <p className="text-white/75 text-xs leading-relaxed">{result.formation}</p>
              </div>
            )}

            {/* Known Habitats / Localities */}
            {result?.where_to_find && (
              <div
                className="p-3.5 rounded-xl space-y-1"
                style={{ background: 'hsla(240,25%,11%,0.5)', border: '1px solid hsla(270,20%,30%,0.2)' }}
              >
                <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                  <Shield size={11} /> Where Found in the Wild
                </div>
                <p className="text-white/75 text-xs leading-relaxed">
                  {Array.isArray(result.where_to_find) ? result.where_to_find.join(', ') : result.where_to_find}
                </p>
              </div>
            )}

            {/* Collector's Value Note */}
            {result?.collection_value && (
              <div
                className="p-3.5 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${rc.glow.replace('0.4', '0.1')}, transparent)`, border: `1px solid ${rc.border}` }}
              >
                <div className="text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold" style={{ color: rc.color }}>
                  <Star size={11} /> Collector's Value
                </div>
                <p className="text-white/80 text-xs leading-relaxed">{result.collection_value}</p>
              </div>
            )}
          </div>
        )}

        {/* CANDIDATES & MATCHES TAB */}
        {activeTab === 'candidates' && (
          <div
            id="result-panel-candidates"
            role="tabpanel"
            aria-labelledby="result-tab-candidates"
            tabIndex={0}
            className="p-4 space-y-4 focus-visible:outline-none"
          >
            <QuickIDStack
              result={result}
              candidates={candidates}
              onDeepAnalysis={() => { setActiveTab('deep'); onDeepAnalysis?.(); }}
              onCompare={onCompare}
              deepLoading={deepLoading}
              deepDone={!!deepAnalysis}
            />

            <ContextIntegrityCard
              integrity={result?.context_integrity}
              handbook={result?.handbook}
              essence={result?.essence}
              onRunTests={() => setActiveTab('tests')}
            />

            {/* Lookalikes / Could be confused with */}
            {lookalikes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2 flex items-center gap-1.5 font-bold">
                  <Shield size={11} /> Could Be Confused With
                </div>
                <div className="space-y-2">
                  {lookalikes.map((l, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl"
                      style={{ background: 'hsla(240,25%,11%,0.6)', border: '1px solid hsla(0,0%,100%,0.08)' }}
                    >
                      <div className="text-xs font-bold text-amber-300">{l.name}</div>
                      <div className="text-white/60 text-xs mt-1 leading-snug">
                        <span className="text-white/35 font-medium">Decisive test: </span>
                        {l.differentiator}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div
            id="result-panel-tests"
            role="tabpanel"
            aria-labelledby="result-tab-tests"
            tabIndex={0}
            className="p-4 space-y-3 focus-visible:outline-none"
          >
            {/* Interactive Mohs Scratch & Streak Lab */}
            <MohsScratchLab
              specimenHardness={result?.hardness_mohs || 7.0}
              mineralName={result?.top_match}
              streakColor={tests[0]?.expected || 'White'}
              isKidMode={kidMode}
            />

            {tests.length === 0 ? (
              <p className="text-white/35 text-sm text-center py-6">No verification tests available for this specimen.</p>
            ) : (
              tests.map((t, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid hsla(270,20%,30%,0.3)', background: 'hsla(240,25%,10%,0.6)' }}
                >
                  <div className="px-3.5 py-3 flex items-start gap-3">
                    <div
                      className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={{ background: rc.glow, color: '#fff' }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm leading-snug">{t.test}</div>
                      <div className="text-white/60 text-xs mt-1.5 flex items-center gap-1.5">
                        <FlaskConical size={11} className="text-amber-400 shrink-0" />
                        <span>Expected: <span className="text-white/90 font-semibold">{t.expected}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => { setActiveTab('deep'); onDeepAnalysis?.(); }}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all"
              style={{ border: `1px solid ${rc.border}`, color: rc.color, background: 'hsla(270,40%,15%,0.3)' }}
            >
              <Microscope size={14} />
              Run Deep Analysis
            </button>
          </div>
        )}

        {/* DEEP ANALYSIS & LORE TAB */}
        {activeTab === 'deep' && (
          <div
            id="result-panel-deep"
            role="tabpanel"
            aria-labelledby="result-tab-deep"
            tabIndex={0}
            className="p-4 space-y-4 focus-visible:outline-none"
          >
            {/* Deep Analysis Component or Trigger */}
            {deepLoading || deepAnalysis ? (
              <DeepAnalysisPanel analysis={deepAnalysis} loading={deepLoading} />
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'hsla(195,80%,30%,0.2)', border: '1px solid hsla(195,80%,55%,0.3)' }}
                >
                  <Cloud size={22} className="text-hud-cyan" />
                </div>
                <p className="text-white/80 text-sm font-bold mb-1">Deep Cloud Analysis</p>
                <p className="text-white/40 text-xs mb-4 max-w-[240px]">
                  Multi-modal geological cross-check, valuation modeling, and locality matrix verification.
                </p>
                <Button
                  onClick={onDeepAnalysis}
                  className="h-10 px-5 rounded-xl text-xs font-bold uppercase tracking-[0.15em]"
                  style={{
                    background: 'linear-gradient(135deg, hsla(195,80%,40%,0.6), hsla(215,70%,35%,0.5))',
                    border: '1px solid hsla(195,80%,60%,0.4)',
                    color: 'hsl(195,100%,88%)',
                  }}
                >
                  <Cloud size={14} className="mr-2" />
                  Run Deep Analysis
                </Button>
              </div>
            )}

            {/* Mineral Origin Story */}
            <MineralStoryCard mineralName={result?.top_match} />

            {/* Geological Fun Fact */}
            {result?.fun_fact && (
              <div
                className="px-4 py-3.5 rounded-xl space-y-1"
                style={{ background: 'linear-gradient(135deg, hsla(270,50%,15%,0.4), hsla(240,30%,9%,0.6))', border: `1px solid ${rc.border}` }}
              >
                <div className="text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold" style={{ color: rc.color }}>
                  <BookOpen size={11} /> Geological Fun Fact
                </div>
                <p className="text-white/80 text-xs leading-relaxed">{result.fun_fact}</p>
              </div>
            )}

            {/* Manual Correction link */}
            <button
              onClick={() => setCorrectionOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-white/30 hover:text-amethyst-glow transition py-2"
            >
              <Pencil size={11} />
              Not quite right? Correct identification
            </button>
          </div>
        )}
      </div>

      <CorrectionModal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        predictedLabel={result?.top_match}
        predictedConfidence={result?.confidence}
        modelVersion={modelVersion}
        imageUrl={primaryImageUrl}
        specimenId={savedId}
      />

      <ProvenanceCertificateModal
        open={certOpen}
        result={result}
        savedId={savedId}
        gpsCoords={gpsCoords}
        onClose={() => setCertOpen(false)}
      />
    </>
  );
}