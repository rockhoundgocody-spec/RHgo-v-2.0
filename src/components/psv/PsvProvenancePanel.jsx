/**
 * PsvProvenancePanel — Mangle-style derivation trace viewer
 *
 * Shows the deductive rule chain that produced the current confidence score,
 * analogous to Mangle's `mgwhy` provenance command.
 *
 * Each fired rule = one node in the derivation DAG.
 * Unfired rules show what evidence would still improve confidence.
 */
import React, { useState, useId } from 'react';
import { GitBranch, ChevronDown, ChevronUp, Circle, TrendingUp, TrendingDown } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PsvProvenancePanel({ engine, revision }) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  if (!engine || !engine.fired_rules) return null;

  const { fired_rules = [], unfired_rules = [], base_llm_score, rule_contribution, final_score } = engine;
  const positiveUnfired = unfired_rules.filter(r => r.weight > 0);

  return (
    <GlassPanel variant="hud" className="p-4">
      <button
        onClick={() => setOpen(p => !p)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          <GitBranch size={13} className="text-hud-cyan" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/70">
            Deductive Derivation
          </span>
          <span className="text-[10px] font-mono text-white/30">
            {fired_rules.length} rules · rev {revision}
          </span>
        </div>
        {open ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
      </button>

      {open && (
        <div id={contentId} className="mt-4 space-y-4">
          {/* Score decomposition */}
          <div className="bg-black/20 rounded-xl p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Score Derivation</div>
            <ScoreLine
              label="LLM base (image)"
              value={base_llm_score}
              used={Math.min(base_llm_score * 0.6, 0.5)}
              note="capped at 50%"
            />
            <ScoreLine
              label="Rule contribution"
              value={rule_contribution}
              note={`${fired_rules.filter(r => r.weight > 0).length} positive, ${fired_rules.filter(r => r.weight < 0).length} negative`}
              signed
            />
            <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold font-mono">
              <span className="text-white/60">Final deductive score</span>
              <span className={final_score >= 0.75 ? 'text-emerald-300' : final_score >= 0.45 ? 'text-amber-300' : 'text-rose-300'}>
                {(final_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Fired rules — derivation chain */}
          {fired_rules.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Fired Rules (evidence collected)</div>
              <div className="space-y-1.5">
                {fired_rules.map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2.5 text-xs">
                    <div className={`shrink-0 mt-0.5 ${rule.weight > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {rule.weight > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white/70">{rule.description}</span>
                      <span className="text-white/25 ml-1 font-mono text-[10px]">{rule.id}</span>
                    </div>
                    <span className={`font-mono text-[11px] shrink-0 ${rule.weight > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {rule.weight > 0 ? '+' : ''}{(rule.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unfired rules — what would still help */}
          {positiveUnfired.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">
                Potential gain from remaining tests
              </div>
              <div className="space-y-1.5">
                {positiveUnfired.slice(0, 5).map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2.5 text-xs opacity-50">
                    <Circle size={11} className="text-white/30 shrink-0 mt-0.5" />
                    <span className="flex-1 text-white/50">{rule.description}</span>
                    <span className="font-mono text-[11px] text-white/30 shrink-0">+{(rule.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[10px] text-white/25 italic">
                Max possible gain: +{(positiveUnfired.reduce((s, r) => s + r.weight, 0) * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      )}
    </GlassPanel>
  );
}

function ScoreLine({ label, value, used, note, signed }) {
  const display = used !== undefined ? used : value;
  const isNeg = display < 0;
  return (
    <div className="flex items-center justify-between text-xs">
      <div>
        <span className="text-white/55">{label}</span>
        {note && <span className="text-white/25 ml-1.5 text-[10px]">({note})</span>}
      </div>
      <span className={`font-mono ${isNeg ? 'text-rose-400' : 'text-white/60'}`}>
        {signed && display > 0 ? '+' : ''}{(display * 100).toFixed(0)}%
      </span>
    </div>
  );
}