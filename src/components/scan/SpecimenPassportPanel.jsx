import React from 'react';
import { Brain, Eye, AlertTriangle, FlaskConical, MapPin } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

/**
 * SpecimenPassportPanel — explainable AI panel for a scan/result.
 * Renders reasoning, observed features, lookalikes, verification tests,
 * and quality/plausibility meters in a calm, scientific layout.
 *
 * Designed to read like a field-notebook page rather than a dashboard.
 */
export default function SpecimenPassportPanel({ result }) {
  if (!result) return null;
  const {
    reasoning,
    observed_features = [],
    lookalikes = [],
    verification_tests = [],
    image_quality_score,
    geological_plausibility,
  } = result;

  const hasContent =
    reasoning ||
    observed_features.length > 0 ||
    lookalikes.length > 0 ||
    verification_tests.length > 0;

  if (!hasContent) return null;

  return (
    <GlassPanel className="mt-4">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-amethyst-glow" />
          <span className="text-amethyst-glow text-[11px] uppercase tracking-[0.3em]">
            Specimen Passport · Why this ID
          </span>
        </div>

        {(image_quality_score != null || geological_plausibility != null) && (
          <div className="grid grid-cols-2 gap-2">
            {image_quality_score != null && (
              <Meter label="Image quality" value={image_quality_score} icon={Eye} />
            )}
            {geological_plausibility != null && (
              <Meter label="Geological fit" value={geological_plausibility} icon={MapPin} />
            )}
          </div>
        )}

        {reasoning && (
          <p className="text-white/80 text-sm leading-relaxed border-l-2 border-amethyst/40 pl-3 italic">
            {reasoning}
          </p>
        )}

        {observed_features.length > 0 && (
          <Section title="Observed features" icon={Eye}>
            <div className="grid grid-cols-2 gap-1.5">
              {observed_features.slice(0, 8).map((f, i) => (
                <div key={i} className="text-[11px] py-1 px-2 rounded bg-white/5 border border-white/5">
                  <div className="text-white/40 uppercase tracking-wide text-[9px]">{f.feature}</div>
                  <div className="text-white/85 truncate">{f.value}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {lookalikes.length > 0 && (
          <Section title="Could be confused with" icon={AlertTriangle}>
            <ul className="space-y-1.5">
              {lookalikes.slice(0, 4).map((l, i) => (
                <li key={i} className="text-xs text-white/75">
                  <span className="text-amber-300 font-medium">{l.name}</span>
                  <span className="text-white/50"> — {l.differentiator}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {verification_tests.length > 0 && (
          <Section title="Verify in the field" icon={FlaskConical}>
            <ul className="space-y-1.5">
              {verification_tests.slice(0, 4).map((t, i) => (
                <li key={i} className="text-xs text-white/80 flex gap-2">
                  <span className="text-hud-cyan font-mono uppercase text-[10px] tracking-wider w-16 shrink-0 pt-0.5">
                    {t.test}
                  </span>
                  <span className="text-white/70">{t.expected}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </GlassPanel>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-white/45 mb-2">
        <Icon size={10} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Meter({ label, value, icon: Icon }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const tone = pct >= 70 ? 'emerald' : pct >= 40 ? 'amber' : 'rose';
  const colors = {
    emerald: { bar: 'bg-emerald-400', text: 'text-emerald-300' },
    amber: { bar: 'bg-amber-400', text: 'text-amber-300' },
    rose: { bar: 'bg-rose-400', text: 'text-rose-300' },
  }[tone];
  return (
    <div className="rounded-md bg-white/5 border border-white/10 p-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/50">
          <Icon size={10} />
          {label}
        </div>
        <span className={`text-[11px] font-mono ${colors.text}`}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${colors.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}