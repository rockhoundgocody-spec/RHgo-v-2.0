import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { X, FlaskConical, Save, MessageCircle, RotateCcw, Leaf, ShoppingBag, GitCompareArrows, ShieldCheck } from 'lucide-react';
import FoundLocationPicker from '@/components/scan/FoundLocationPicker.jsx';

const CONFIDENCE_BAND = (c) => {
  if (c >= 0.85) return { label: 'high', color: '#9FE8D0' };
  if (c >= 0.6) return { label: 'likely', color: '#fbbf24' };
  return { label: 'uncertain', color: '#fb7185' };
};

/**
 * ScanResultSheet — bottom sheet that slides up after the shutter.
 * Shows name + confidence, 3 why-bullets, Keep/Leave/Observed, then Tests/Save/Ask.
 */
export default function ScanResultSheet({
  open, result, imageUrl, saved,
  onKeep, onLeave, onObserve, onAsk, onRetry, onClose,
  provenance, onProvenanceChange, locationExhausted,
  foundLocation, onFoundLocationChange,
}) {
  const navigate = useNavigate();
  const [testsOpen, setTestsOpen] = useState(false);
  const [legalOk, setLegalOk] = useState(false);
  const [fieldReport, setFieldReport] = useState({
    field_habit: '', field_luster: '', field_matrix: '', field_next_test: '',
  });

  useEffect(() => {
    if (!result) return;
    setFieldReport({
      field_habit: result.field_habit || '',
      field_luster: result.field_luster || '',
      field_matrix: result.field_matrix || '',
      field_next_test: result.field_next_test || '',
    });
    setTestsOpen((result.confidence ?? 1) < 0.6);
    setLegalOk(false);
  }, [result]);

  if (!result) return null;

  const isFail = (result.image_quality_score ?? 1) < 0.3;
  const confidence = Math.round((result.confidence ?? 0) * 100);
  const band = CONFIDENCE_BAND(result.confidence ?? 0);
  const bullets = (result.observed_features || []).slice(0, 3);
  const tests = result.verification_tests || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dim backdrop over the camera */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute bottom-0 inset-x-0 z-50 rounded-t-3xl overflow-hidden max-h-[88vh] overflow-y-auto"
            style={{ background: '#0a0a14', borderTop: '1px solid hsla(0,0%,100%,0.12)' }}
          >
            {/* Drag handle + close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto" style={{ margin: '0 auto' }} />
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full flex items-center justify-center absolute right-4 top-3"
                style={{ background: 'hsla(0,0%,100%,0.06)' }}
              >
                <X size={16} className="text-white/50" />
              </button>
            </div>

            {isFail ? (
              /* ── Fail state ── */
              <div className="px-5 pb-8 pt-3">
                <div className="text-white font-bold text-lg">Need more light</div>
                <p className="text-white/45 text-[13px] mt-1 leading-relaxed">
                  The photo is too dark to identify. Try again in daylight or use the flash.
                </p>
                <button
                  onClick={onRetry}
                  className="mt-5 w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: '#9FE8D0', color: '#0a0a14' }}
                >
                  <RotateCcw size={16} /> Retry
                </button>
              </div>
            ) : (
              /* ── Result ── */
              <div className="px-5 pb-8 pt-2">
                {/* Name + confidence */}
                <div className="flex items-start gap-3 mb-4 p-3 -mx-1 rounded-2xl result-holo">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={result.top_match}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-[17px] leading-tight truncate">
                      {result.top_match}
                    </div>
                    {result.scientific_name && (
                      <div className="text-white/40 text-[11px] italic truncate">{result.scientific_name}</div>
                    )}
                    {result.chemical_formula && (
                      <div className="text-white/30 text-[10px] font-mono mt-0.5">{result.chemical_formula}</div>
                    )}
                  </div>
                  <div
                    className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: `${band.color}20`, color: band.color, border: `1px solid ${band.color}40` }}
                  >
                    {confidence}%
                  </div>
                </div>

                {result.description && (
                  <p className="text-white/60 text-[12px] leading-relaxed mb-3">{result.description}</p>
                )}

                {/* 3 why-bullets */}
                {bullets.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-white/65 text-[12px] leading-snug">
                        <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: '#9FE8D0' }} />
                        <span>
                          <b className="text-white/85 capitalize">{b.feature}</b>: {b.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {typeof result.geological_plausibility === 'number' && (
                  <div className="mb-4 text-[11px] text-white/45">
                    Local geology fit:{' '}
                    <span style={{ color: result.geological_plausibility >= 0.6 ? '#9FE8D0' : '#fbbf24' }}>
                      {Math.round(result.geological_plausibility * 100)}%
                    </span>
                    {result.geological_plausibility < 0.45 && (
                      <span className="text-white/35"> — could be glacial, fill, or store-bought.</span>
                    )}
                  </div>
                )}

                {Array.isArray(result.candidates) && result.candidates.length > 1 && (
                  <div className="mb-4">
                    <div className="text-white/35 text-[10px] uppercase tracking-[0.18em] mb-1.5">Also possible</div>
                    <div className="space-y-1">
                      {result.candidates.slice(0, 3).map((c, i) => (
                        <div key={c.name || i} className="flex items-center justify-between text-[12px]">
                          <span className="text-white/70 truncate">{c.name}</span>
                          {typeof c.confidence === 'number' && (
                            <span className="text-white/35 tabular-nums ml-2">{Math.round(c.confidence * 100)}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(result.lookalikes) && result.lookalikes.length > 0 && (
                  <div className="mb-4 rounded-xl px-3 py-2.5" style={{ background: 'hsla(38,80%,20%,0.18)', border: '1px solid hsla(38,80%,50%,0.2)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-amber-200/80 text-[10px] uppercase tracking-[0.18em]">Don’t confuse with</div>
                      <button
                        type="button"
                        onClick={() => navigate('/compare', { state: { result, primaryImageUrl: imageUrl } })}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#9FE8D0]"
                      >
                        <GitCompareArrows size={11} /> Compare
                      </button>
                    </div>
                    {result.lookalikes.slice(0, 3).map((l, i) => (
                      <div key={l.name || i} className="text-[11px] text-white/65 leading-snug mt-1">
                        <b className="text-white/85">{l.name}</b>
                        {l.differentiator ? ` — ${l.differentiator}` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {((result.candidates?.length || 0) > 1 || (result.lookalikes?.length || 0) > 0) && (
                  <button
                    type="button"
                    onClick={() => navigate('/compare', { state: { result, primaryImageUrl: imageUrl } })}
                    className="mb-4 w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    style={{ background: 'hsla(280,60%,30%,0.25)', border: '1px solid hsla(280,70%,55%,0.35)', color: 'hsl(280,90%,85%)' }}
                  >
                    <GitCompareArrows size={14} /> Side-by-side lookalike lab
                  </button>
                )}

                {/* Field Report card — AI-filled, user-editable */}
                <div className="mb-4">
                  <div className="text-white/35 text-[11px] mb-2">Your eye still checks</div>
                  <div className="space-y-2">
                    <FieldInput
                      label="Habit"
                      value={fieldReport.field_habit}
                      onChange={(v) => setFieldReport(f => ({ ...f, field_habit: v }))}
                    />
                    <FieldInput
                      label="Luster"
                      value={fieldReport.field_luster}
                      onChange={(v) => setFieldReport(f => ({ ...f, field_luster: v }))}
                    />
                    <FieldInput
                      label="Matrix"
                      value={fieldReport.field_matrix}
                      onChange={(v) => setFieldReport(f => ({ ...f, field_matrix: v }))}
                    />
                    <FieldInput
                      label="Next test"
                      value={fieldReport.field_next_test}
                      onChange={(v) => setFieldReport(f => ({ ...f, field_next_test: v }))}
                    />
                  </div>
                </div>

                {onFoundLocationChange && (
                  <FoundLocationPicker
                    compact
                    value={foundLocation}
                    onChange={onFoundLocationChange}
                  />
                )}

                {/* Provenance toggle — nature vs store-bought */}
                {onProvenanceChange && (
                  <div className="mb-4">
                    <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2">Where's it from?</div>
                    <div className="grid grid-cols-2 gap-2">
                      <ProvenancePill
                        active={provenance === 'nature'}
                        onClick={() => onProvenanceChange('nature')}
                        icon={Leaf}
                        label="Found in nature"
                        sub="Field, gravel, driveway"
                      />
                      <ProvenancePill
                        active={provenance === 'store_bought'}
                        onClick={() => onProvenanceChange('store_bought')}
                        icon={ShoppingBag}
                        label="Store-bought"
                        sub="Shop, gift, trade"
                      />
                    </div>
                    {locationExhausted && provenance === 'nature' && (
                      <div className="mt-2 text-[11px] text-amber-400/80 leading-snug">
                        You've scanned 5+ here — move 250m+ to earn XP again, or mark it store-bought.
                      </div>
                    )}
                  </div>
                )}

                <label className="mb-3 flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer"
                  style={{ background: legalOk ? 'hsla(160,50%,20%,0.25)' : 'hsla(0,0%,100%,0.04)', border: `1px solid ${legalOk ? 'hsla(160,70%,50%,0.4)' : 'hsla(0,0%,100%,0.1)'}` }}>
                  <input
                    type="checkbox"
                    checked={legalOk}
                    onChange={(e) => setLegalOk(e.target.checked)}
                    className="mt-0.5 accent-emerald-400"
                  />
                  <span className="text-[11px] text-white/65 leading-snug">
                    <span className="inline-flex items-center gap-1 text-white/85 font-semibold">
                      <ShieldCheck size={12} /> I can legally collect here
                    </span>
                    <span className="block text-white/40 mt-0.5">Required to Keep. Leave / Observed never remove material.</span>
                  </span>
                </label>

                {/* Primary: Keep / Leave / Observed */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <SheetButton
                    label="Keep"
                    onClick={() => onKeep(fieldReport, { legalConfirmed: true })}
                    disabled={saved || !legalOk}
                    primary
                  />
                  <SheetButton label="Leave" onClick={() => onLeave(fieldReport, { legalConfirmed: false })} disabled={saved} />
                  <SheetButton label="Observed" onClick={() => onObserve(fieldReport, { legalConfirmed: false })} disabled={saved} />
                </div>

                {/* Secondary: Tests / Save / Ask */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <SheetButton
                    label="Tests" icon={FlaskConical}
                    onClick={() => setTestsOpen(t => !t)}
                    active={testsOpen}
                  />
                  <SheetButton label="Save" icon={Save} onClick={() => onObserve(fieldReport, { legalConfirmed: false })} disabled={saved} />
                  <SheetButton label="Ask" icon={MessageCircle} onClick={onAsk} />
                </div>

                {saved && (
                  <div className="text-center mb-3 space-y-2">
                    <div className="text-[11px] text-[#9FE8D0]">Saved to your cabinet</div>
                    <Link to="/explore" className="inline-flex text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white">
                      Hunt nearby next →
                    </Link>
                  </div>
                )}

                {/* Tests panel */}
                <AnimatePresence>
                  {testsOpen && tests.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1">Field Tests</div>
                        {tests.map((t, i) => (
                          <div key={i} className="text-[12px] leading-snug">
                            <span className="text-white/80 font-medium">{t.test}</span>
                            <span className="text-white/40"> — {t.expected}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SheetButton({ label, icon: Icon, onClick, disabled, primary, active }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40"
      style={{
        background: primary ? '#9FE8D020' : active ? 'hsla(0,0%,100%,0.1)' : 'hsla(0,0%,100%,0.04)',
        border: `1px solid ${primary ? '#9FE8D050' : active ? 'hsla(0,0%,100%,0.2)' : 'hsla(0,0%,100%,0.08)'}`,
        color: primary ? '#9FE8D0' : 'rgba(255,255,255,0.7)',
      }}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

function FieldInput({ label, value, onChange }) {
  return (
    <div>
      <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full px-3 py-2 rounded-lg text-white text-[12px] outline-none placeholder:text-white/20"
        style={{
          background: 'hsla(255,30%,12%,0.6)',
          border: '1px solid hsla(0,0%,100%,0.08)',
        }}
      />
    </div>
  );
}

function ProvenancePill({ active, onClick, icon: Icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-2.5 p-3 rounded-xl text-left transition-all active:scale-95"
      style={{
        background: active ? '#9FE8D015' : 'hsla(0,0%,100%,0.04)',
        border: `1px solid ${active ? '#9FE8D050' : 'hsla(0,0%,100%,0.08)'}`,
      }}
    >
      <Icon size={16} className="mt-0.5 shrink-0" style={{ color: active ? '#9FE8D0' : 'rgba(255,255,255,0.5)' }} />
      <div className="min-w-0">
        <div className="text-[12px] font-semibold leading-tight" style={{ color: active ? '#9FE8D0' : 'rgba(255,255,255,0.8)' }}>
          {label}
        </div>
        <div className="text-[10px] text-white/35 leading-tight mt-0.5">{sub}</div>
      </div>
    </button>
  );
}