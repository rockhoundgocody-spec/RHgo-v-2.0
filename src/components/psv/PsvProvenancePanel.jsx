/**
 * PsvProvenancePanel — Mangle-style derivation trace viewer
 *
 * Shows the deductive rule chain that produced the current confidence score,
 * analogous to Mangle's `mgwhy` provenance command.
 *
 * Each fired rule = one node in the derivation DAG.
 * Unfired rules show what evidence would still improve confidence.
 */
import React, { useId, useState } from 'react';
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
      <ProvenanceHeader
        open={open}
        setOpen={setOpen}
        contentId={contentId}
        firedRulesCount={fired_rules.length}
        revision={revision}
      />

      {open && (
        <div id={contentId} className="mt-4 space-y-4">
          <ScoreDecomposition
            baseLlmScore={base_llm_score}
            ruleContribution={rule_contribution}
            finalScore={final_score}
            firedRules={fired_rules}
          />
          <FiredRulesList firedRules={fired_rules} />
          <UnfiredRulesList positiveUnfired={positiveUnfired} />
        </div>
      )}
    </GlassPanel>
  );
}

function ProvenanceHeader({ open, setOpen, contentId, firedRulesCount, revision }) {
  return (
    <button
      type="button"
      onClick={() => setOpen(p => !p)}
      aria-expanded={open}
      aria-controls={contentId}
      className="w-full flex items-center justify-between gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
    >
      <div className="flex items-center gap-2">
        <GitBranch size={13} className="text-hud-cyan" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/70">
          Deductive Derivation
        </span>
        <span className="text-[10px] font-mono text-white/30">
          {firedRulesCount} rules · rev {revision}
        </span>
      </div>
      {open ? <ChevronUp size={12} className="text-white/30" /> : <ChevronDown size={12} className="text-white/30" />}
    </button>
  );
}

function ScoreDecomposition({ baseLlmScore, ruleContribution, finalScore, firedRules }) {
  const posCount = firedRules.filter(r => r.weight > 0).length;
  const negCount = firedRules.filter(r => r.weight < 0).length;
  const scoreClass = finalScore >= 0.75 ? 'text-emerald-300' : finalScore >= 0.45 ? 'text-amber-300' : 'text-rose-300';

  return (
    <div className="bg-black/20 rounded-xl p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-2">Score Derivation</div>
      <ScoreLine
        label="LLM base (image)"
        value={baseLlmScore}
        used={Math.min(baseLlmScore * 0.6, 0.5)}
        note="capped at 50%"
      />
      <ScoreLine
        label="Rule contribution"
        value={ruleContribution}
        note={`${posCount} positive, ${negCount} negative`}
        signed
      />
      <div className="border-t border-white/10 pt-2 flex justify-between text-sm font-bold font-mono">
        <span className="text-white/60">Final deductive score</span>
        <span className={scoreClass}>
          {(finalScore * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function FiredRulesList({ firedRules }) {
  if (!firedRules || firedRules.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">Fired Rules (evidence collected)</div>
      <div className="space-y-1.5">
        {firedRules.map((rule) => (
          <FiredRuleItem key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function FiredRuleItem({ rule }) {
  const isPositive = rule.weight > 0;
  const colorClass = isPositive ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div className="flex items-start gap-2.5 text-xs">
      <div className={`shrink-0 mt-0.5 ${colorClass}`}>
        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-white/70">{rule.description}</span>
        <span className="text-white/25 ml-1 font-mono text-[10px]">{rule.id}</span>
      </div>
      <span className={`font-mono text-[11px] shrink-0 ${colorClass}`}>
        {isPositive ? '+' : ''}{(rule.weight * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function UnfiredRulesList({ positiveUnfired }) {
  if (!positiveUnfired || positiveUnfired.length === 0) return null;

  const maxGain = positiveUnfired.reduce((s, r) => s + r.weight, 0);

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/30 mb-2">
        Potential gain from remaining tests
      </div>
      <div className="space-y-1.5">
        {positiveUnfired.slice(0, 5).map((rule) => (
          <UnfiredRuleItem key={rule.id} rule={rule} />
        ))}
      </div>
      <div className="mt-2 text-[10px] text-white/25 italic">
        Max possible gain: +{(maxGain * 100).toFixed(0)}%
      </div>
    </div>
  );
}

function UnfiredRuleItem({ rule }) {
  return (
    <div className="flex items-start gap-2.5 text-xs opacity-50">
      <Circle size={11} className="text-white/30 shrink-0 mt-0.5" />
      <span className="flex-1 text-white/50">{rule.description}</span>
      <span className="font-mono text-[11px] text-white/30 shrink-0">+{(rule.weight * 100).toFixed(0)}%</span>
    </div>
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
