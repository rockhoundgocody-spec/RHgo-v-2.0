import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import MineralStoryCard from './MineralStoryCard.jsx';
import { Sparkles, RotateCcw, GitCompare, Pencil, Microscope, CheckCircle2, Zap, FlaskConical, BookOpen, Star, ChevronDown, ChevronUp, Shield, Atom, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CorrectionModal from './CorrectionModal.jsx';
import RarityFireworks from './RarityFireworks.jsx';
import ClaimPathModal from './ClaimPathModal.jsx';

const RARITY_CFG = {
  common:    { label: 'Common',    color: '#94a3b8', glow: 'hsla(215,20%,55%,0.5)',  border: 'hsla(215,20%,55%,0.3)',  badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  uncommon:  { label: 'Uncommon',  color: '#34d399', glow: 'hsla(160,70%,50%,0.5)',  border: 'hsla(160,70%,50%,0.35)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  rare:      { label: 'Rare',      color: '#38bdf8', glow: 'hsla(200,90%,60%,0.55)', border: 'hsla(200,90%,60%,0.4)',  badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  legendary: { label: 'Legendary', color: '#a78bfa', glow: 'hsla(270,80%,65%,0.65)', border: 'hsla(270,80%,65%,0.5)', badge: 'bg-amethyst/20 text-amethyst-glow border-amethyst/40' },
};

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
  saved,
  savedId,
  modelVersion = 'gemini-flash',
}) {
  const tiltRef = useRef(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimPath, setClaimPath] = useState(null);
  const [fireworksTrigger, setFireworksTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('id'); // id | tests | features | lore
  const navigate = useNavigate();

  const handleClaimChoose = (path) => {
    setClaimPath(path);
    setClaimOpen(false);
    onSave(path);
  };

  useEffect(() => {
    if (saved) setFireworksTrigger((n) => n + 1);
  }, [saved]);

  // Parallax tilt on desktop
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
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
  }, []);

  const rarity = result?.rarity || 'common';
  const rc = RARITY_CFG[rarity] || RARITY_CFG.common;
  const conf = result?.confidence ?? 0;
  const confLabel = confidenceLabel(conf);
  const candidates = result?.candidates || [];
  const features = result?.observed_features || [];
  const tests = result?.verification_tests || [];
  const lookalikes = result?.lookalikes || [];

  const TABS = [
    { id: 'id',       icon: Sparkles,    label: 'ID' },
    { id: 'science',  icon: Atom,        label: 'Science' },
    { id: 'tests',    icon: FlaskConical, label: 'Tests' },
    { id: 'features', icon: Zap,         label: 'Features' },
    { id: 'lore',     icon: BookOpen,    label: 'Lore' },
  ];

  return (
    <>
      <RarityFireworks result={result} trigger={fireworksTrigger} />

      {/* ── HERO IMAGE CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: `1px solid ${rc.border}`,
          boxShadow: `0 0 60px -10px ${rc.glow}, 0 0 0 1px ${rc.border}`,
        }}
      >
        {/* Tilt-parallax image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ perspective: '1000px' }}>
          <div ref={tiltRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
            {primaryImageUrl ? (
              <img src={primaryImageUrl} alt="specimen" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Sparkles size={48} style={{ color: rc.color, opacity: 0.4 }} />
              </div>
            )}
            {/* Holographic color wash */}
            <div className="absolute inset-0 mix-blend-screen pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 40%, ${rc.glow} 0%, transparent 65%)` }} />
            {/* Scan lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, hsla(195,100%,70%,0.4) 0 1px, transparent 1px 4px)' }} />
          </div>

          {/* Rarity badge — top left */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`text-[10px] font-bold uppercase tracking-[0.25em] px-2.5 py-1 rounded-full border ${rc.badge}`}>
              {rc.label}
            </span>
          </div>

          {/* Confidence chip — top right */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
            <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
              style={{ background: 'hsla(220,40%,5%,0.85)', color: confLabel.color, border: `1px solid ${confLabel.color}50`, backdropFilter: 'blur(8px)' }}>
              {(conf * 100).toFixed(0)}% · {confLabel.text}
            </div>
          </div>

          {/* Mineral name overlay at bottom */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-4"
            style={{ background: 'linear-gradient(0deg, hsla(220,60%,4%,0.95) 0%, transparent 100%)' }}>
            <div className="text-2xl font-black text-white leading-tight" style={{ textShadow: `0 0 30px ${rc.glow}` }}>
              {result?.top_match || 'Unknown Specimen'}
            </div>
            <p className="text-white/60 text-xs mt-0.5 line-clamp-2">{result?.description}</p>
          </div>
        </div>
      </div>

      </motion.div>

      {/* ── SAVE / ACTIONS ── */}
      <div className="mt-3 flex gap-2">
        {!saved ? (
          <Button
            onClick={() => setClaimOpen(true)}
            className="flex-1 h-12 text-sm font-bold rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, hsla(270,80%,40%,0.9), hsla(280,100%,55%,0.7))`, border: `1px solid ${rc.border}`, boxShadow: `0 0 20px ${rc.glow}` }}
          >
            <Sparkles size={15} className="mr-2" />
            Claim This Find
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-emerald-400 text-sm font-bold border border-emerald-500/30 bg-emerald-900/20">
            <CheckCircle2 size={16} />
            {claimPath === 'chattel' ? '⛏️ Added to Hoard' : claimPath === 'affixed' ? '🌍 Logged to Atlas' : 'Saved ✓'}
          </div>
        )}
        <Button onClick={onCompare} variant="outline" className="h-12 px-3 border-white/15 text-white/70 hover:bg-white/5 rounded-xl" title="Compare">
          <GitCompare size={16} />
        </Button>
        <Button onClick={onReset} variant="outline" className="h-12 px-3 border-white/15 text-white/70 hover:bg-white/5 rounded-xl" title="Scan again">
          <RotateCcw size={16} />
        </Button>
      </div>

      {/* ── TAB BAR ── */}
      <div className="mt-4 flex gap-1 p-1 rounded-xl" style={{ background: 'hsla(220,40%,6%,0.8)', border: '1px solid hsla(270,30%,30%,0.25)' }}>
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-all text-[10px] font-semibold uppercase tracking-[0.15em]"
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
      <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: 'hsla(220,40%,5%,0.7)', border: '1px solid hsla(270,30%,25%,0.3)' }}>

        {/* ID TAB */}
        {activeTab === 'id' && (
          <div className="p-4 space-y-4">
            {/* Reasoning */}
            {result?.reasoning && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                  <Sparkles size={9} /> Why we think this
                </div>
                <p className="text-white/75 text-sm leading-relaxed">{result.reasoning}</p>
              </div>
            )}

            {/* Candidates */}
            {candidates.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Other Candidates</div>
                <div className="space-y-2">
                  {candidates.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'hsla(220,30%,8%,0.6)', border: '1px solid hsla(270,20%,25%,0.3)' }}>
                      <div className="text-[10px] font-mono text-white/30 w-4">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/90 text-sm font-semibold">{c.name}</div>
                        <div className="text-white/40 text-[10px] mt-0.5 line-clamp-1">{c.rationale || c.features}</div>
                      </div>
                      <div className="font-mono text-xs font-bold shrink-0" style={{ color: rc.color }}>
                        {(c.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lookalikes */}
            {lookalikes.length > 0 && (
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2 flex items-center gap-1.5">
                  <Shield size={9} /> Could be confused with
                </div>
                <div className="space-y-1.5">
                  {lookalikes.map((l, i) => (
                    <div key={i} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'hsla(220,30%,8%,0.5)', border: '1px solid hsla(0,0%,100%,0.06)' }}>
                      <span className="text-amber-300 font-semibold">{l.name}</span>
                      <span className="text-white/45 ml-2">{l.differentiator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collection value */}
            {result?.collection_value && (
              <div className="px-3 py-3 rounded-xl" style={{ background: `linear-gradient(135deg, ${rc.glow.replace('0.5', '0.08')}, transparent)`, border: `1px solid ${rc.border}` }}>
                <div className="text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: rc.color }}>
                  <Star size={9} /> Collector's Note
                </div>
                <p className="text-white/70 text-xs">{result.collection_value}</p>
              </div>
            )}
          </div>
        )}

        {/* SCIENCE TAB */}
        {activeTab === 'science' && (
          <div className="p-4 space-y-3">
            {/* Scientific classification grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Scientific Name', value: result?.scientific_name },
                { label: 'Formula',         value: result?.chemical_formula },
                { label: 'Hardness (Mohs)', value: result?.hardness_mohs != null ? `${result.hardness_mohs}` : null },
                { label: 'Crystal System',  value: result?.crystal_system },
                { label: 'Value Estimate',  value: result?.value_estimate },
                { label: 'Image Quality',   value: result?.image_quality_score != null ? `${Math.round(result.image_quality_score * 100)}%` : null },
              ].filter(row => row.value).map((row, i) => (
                <div key={i} className="px-3 py-2.5 rounded-xl" style={{ background: 'hsla(220,40%,7%,0.7)', border: '1px solid hsla(270,20%,20%,0.3)' }}>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">{row.label}</div>
                  <div className="text-sm font-semibold text-white/90">{row.value}</div>
                </div>
              ))}
            </div>

            {/* Formation story */}
            {result?.formation && (
              <div className="px-4 py-3 rounded-xl" style={{ background: 'hsla(220,40%,7%,0.7)', border: '1px solid hsla(270,20%,20%,0.3)' }}>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 flex items-center gap-1.5">
                  <Atom size={9} /> Formation Story
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{result.formation}</p>
              </div>
            )}

            {/* Where to find */}
            {result?.where_to_find?.length > 0 && (
              <div className="px-4 py-3 rounded-xl" style={{ background: 'hsla(220,40%,7%,0.7)', border: '1px solid hsla(270,20%,20%,0.3)' }}>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-2 flex items-center gap-1.5">
                  <MapPin size={9} /> Where To Find
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.where_to_find.map((loc, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'hsla(195,80%,15%,0.6)', color: '#67e8f9', border: '1px solid hsla(195,80%,50%,0.25)' }}>
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TESTS TAB */}
        {activeTab === 'tests' && (
          <div className="p-4 space-y-3">
            {tests.length === 0 && (
              <p className="text-white/30 text-sm text-center py-6">No verification tests available.</p>
            )}
            {tests.map((t, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsla(270,20%,25%,0.35)' }}>
                <div className="px-3 py-2.5 flex items-start gap-3" style={{ background: 'hsla(220,40%,7%,0.7)' }}>
                  <div className="mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: rc.glow, color: '#fff' }}>{i + 1}</div>
                  <div>
                    <div className="text-white/90 text-sm font-semibold">{t.test}</div>
                    <div className="text-white/45 text-xs mt-1 flex items-center gap-1.5">
                      <FlaskConical size={9} />
                      Expected: <span className="text-white/70">{t.expected}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Progressive verify CTA */}
            <button
              onClick={() => navigate('/verify')}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.2em] transition"
              style={{ border: `1px solid ${rc.border}`, color: rc.color, background: 'hsla(270,40%,15%,0.3)' }}
            >
              <Microscope size={13} />
              Run 6-Agent Deep Analysis
            </button>
          </div>
        )}

        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="p-4">
            {features.length === 0 && (
              <p className="text-white/30 text-sm text-center py-6">No features extracted.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {features.map((f, i) => (
                <div key={i} className="px-3 py-2.5 rounded-xl" style={{ background: 'hsla(220,40%,7%,0.7)', border: '1px solid hsla(270,20%,20%,0.3)' }}>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">{f.feature}</div>
                  <div className="text-sm font-semibold text-white/90">{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LORE TAB */}
        {activeTab === 'lore' && (
          <div className="p-4 space-y-4">
            {/* Great Lakes origin story card */}
            <MineralStoryCard mineralName={result?.top_match} />
            {result?.fun_fact && (
              <div className="px-4 py-4 rounded-xl" style={{ background: `linear-gradient(135deg, hsla(270,50%,15%,0.5), hsla(220,40%,8%,0.6))`, border: `1px solid ${rc.border}` }}>
                <div className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: rc.color }}>
                  <BookOpen size={9} /> Geological Lore
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{result.fun_fact}</p>
              </div>
            )}
            {result?.description && (
              <p className="text-white/60 text-sm leading-relaxed">{result.description}</p>
            )}
            {/* Correct ID link */}
            <button
              onClick={() => setCorrectionOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.25em] text-white/25 hover:text-amethyst-glow transition py-2"
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
      <ClaimPathModal
        open={claimOpen}
        onChoose={handleClaimChoose}
        onClose={() => setClaimOpen(false)}
      />
    </>
  );
}