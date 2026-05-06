import React, { useEffect, useRef, useState } from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import { Sparkles, Layers, RotateCcw, Save, GitCompare, Pencil, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import CorrectionModal from './CorrectionModal.jsx';
import SpecimenPassportPanel from './SpecimenPassportPanel.jsx';
import ReasoningSummary from '@/components/reasoning/ReasoningSummary.jsx';

/**
 * HolographicResult — shows the reconstructed specimen image with floating
 * holographic data overlays, identification results, and CTAs to save or
 * compare. The "3D" feel is achieved via parallax tilt + glowing data tags.
 */
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
  const navigate = useNavigate();

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      target.x = ((e.clientY - (r.top + r.height / 2)) / r.height) * -10;
      target.y = ((e.clientX - (r.left + r.width / 2)) / r.width) * 10;
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
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const candidates = result?.candidates || [];
  const top = candidates[0] || { name: result?.top_match, confidence: result?.confidence };

  return (
    <>
      <HudFrame label="Specimen Hologram">
        <div className="relative aspect-square w-full rounded-md overflow-hidden hud-grid-bg" style={{ perspective: '1000px' }}>
          <div
            ref={tiltRef}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
          >
            {primaryImageUrl && (
              <img
                src={primaryImageUrl}
                alt="specimen"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* holographic wash */}
            <div
              className="absolute inset-0 mix-blend-screen pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, hsla(280,100%,70%,0.35), transparent 70%), linear-gradient(180deg, hsla(195,100%,55%,0.15), transparent 50%)',
              }}
            />
            {/* scan lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, hsla(195,100%,70%,0.3) 0 1px, transparent 1px 3px)',
              }}
            />

            {/* floating data tags */}
            <DataTag style={{ top: '12%', left: '8%' }} label="ID" value={top?.name || '—'} accent="amethyst" />
            <DataTag
              style={{ top: '12%', right: '8%' }}
              label="CONF"
              value={top?.confidence != null ? `${(top.confidence * 100).toFixed(0)}%` : '—'}
              accent="hud"
            />
            <DataTag
              style={{ bottom: '14%', left: '8%' }}
              label="FEATURES"
              value={(top?.features || result?.description || '').slice(0, 32) + '…'}
              accent="hud"
              wide
            />
          </div>

          <div className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-hud-cyan/80 glow-hud">
            ◉ HOLOGRAM · TILT TO INSPECT
          </div>
        </div>
      </HudFrame>

      <GlassPanel className="mt-4">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-amethyst-glow" size={16} />
            <span className="text-amethyst-glow text-xs uppercase tracking-[0.3em]">
              Identification
            </span>
          </div>
          <div className="text-2xl font-bold text-white glow-amethyst mb-1">
            {result?.top_match}
          </div>
          <div className="text-amethyst/70 text-xs font-mono mb-3">
            {result?.confidence != null ? `${(result.confidence * 100).toFixed(0)}% confidence` : ''}
          </div>
          <p className="text-white/70 text-sm mb-4">{result?.description}</p>

          {candidates.length > 1 && (
            <div className="space-y-1.5 mb-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
                <Layers size={10} /> Candidates
              </div>
              {candidates.slice(1).map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-white/5 border border-white/5"
                >
                  <span className="text-white/80">{c.name}</span>
                  <span className="font-mono text-amethyst/70">
                    {(c.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={onSave}
              disabled={saved}
              className="flex-1 bg-amethyst-deep hover:bg-amethyst text-white border border-amethyst/40"
            >
              <Save size={14} className="mr-1.5" />
              {saved ? 'Saved ✓' : 'Save'}
            </Button>
            <Button
              onClick={onCompare}
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/5"
            >
              <GitCompare size={14} className="mr-1.5" />
              Compare
            </Button>
            <Button
              onClick={onReset}
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/5"
            >
              <RotateCcw size={16} />
            </Button>
          </div>

          <button
            onClick={() => navigate('/verify')}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-amethyst/30 text-amethyst/80 hover:text-white hover:bg-amethyst/10 text-xs font-semibold uppercase tracking-[0.25em] transition"
          >
            <Microscope size={13} />
            Progressive Verification (6-agent deep analysis)
          </button>

          <button
            onClick={() => setCorrectionOpen(true)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.25em] text-amethyst/50 hover:text-amethyst-glow transition py-2"
          >
            <Pencil size={11} />
            Not quite right? Correct identification
          </button>
        </div>
      </GlassPanel>

      <SpecimenPassportPanel result={result} />

      {reasoningResult && (
        <ReasoningSummary
          result={reasoningResult}
          className="mt-4"
          onAction={(action) => {
            if (action === 'save') onSave?.();
            if (action === 'compare') onCompare?.();
            if (action === 'rescan') onReset?.();
          }}
        />
      )}

      <CorrectionModal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        predictedLabel={result?.top_match}
        predictedConfidence={result?.confidence}
        modelVersion={modelVersion}
        imageUrl={primaryImageUrl}
        specimenId={savedId}
      />
    </>
  );
}

function DataTag({ style, label, value, accent = 'amethyst', wide }) {
  const color =
    accent === 'amethyst'
      ? { fg: 'hsl(280 100% 85%)', bd: 'hsla(280,100%,70%,0.5)', glow: 'hsla(280,100%,60%,0.6)' }
      : { fg: 'hsl(195 100% 80%)', bd: 'hsla(195,100%,60%,0.5)', glow: 'hsla(195,100%,50%,0.6)' };
  return (
    <div
      className="absolute pointer-events-none"
      style={{ ...style, transform: 'translateZ(40px)' }}
    >
      <div
        className={`px-2.5 py-1 rounded-md ${wide ? 'max-w-[180px]' : 'max-w-[140px]'}`}
        style={{
          background: 'hsla(220,40%,5%,0.7)',
          border: `1px solid ${color.bd}`,
          boxShadow: `0 0 12px ${color.glow}`,
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          className="text-[8px] font-mono uppercase tracking-[0.3em]"
          style={{ color: color.fg, opacity: 0.7 }}
        >
          {label}
        </div>
        <div
          className="text-[11px] font-semibold leading-tight"
          style={{ color: color.fg, textShadow: `0 0 8px ${color.glow}` }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}