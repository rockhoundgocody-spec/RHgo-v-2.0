import React from "react";
import { motion } from "framer-motion";
import { FlaskConical, DollarSign, Clock, Shield, Zap, ArrowRight } from "lucide-react";

const CATEGORY_CFG = {
  no_equipment:    { label: "No Equipment",     color: "#34d399", icon: Zap },
  home:            { label: "Home Test",         color: "#38bdf8", icon: FlaskConical },
  expert:          { label: "Expert Test",       color: "#fbbf24", icon: FlaskConical },
  laboratory:      { label: "Laboratory",        color: "#a78bfa", icon: FlaskConical },
  non_destructive: { label: "Non-Destructive",   color: "#34d399", icon: Shield },
};

function TestHeader({ testName, cat }) {
  const Icon = cat.icon;
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: cat.bg || `${cat.color}20`, border: `1px solid ${cat.color}40` }}
      >
        <Icon size={15} style={{ color: cat.color }} />
      </div>
      <div className="flex-1">
        <div className="text-[8px] uppercase tracking-widest text-white/30">Optimal Next Test</div>
        <div className="text-sm font-bold text-white/90">{testName}</div>
      </div>
      <span
        className="text-[8px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
        style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
      >
        {cat.label}
      </span>
    </div>
  );
}

function UncertaintyReduction({ gain }) {
  return (
    <div
      className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl"
      style={{ background: "hsla(40,90%,40%,0.08)", border: "1px solid hsla(40,90%,50%,0.15)" }}
    >
      <div className="text-3xl font-black font-mono" style={{ color: "#fbbf24" }}>
        {gain}<span className="text-sm">%</span>
      </div>
      <div>
        <div className="text-[9px] uppercase tracking-widest text-white/40">Expected Uncertainty Reduction</div>
        <div className="text-xs text-white/60">This test eliminates ~{gain}% of remaining uncertainty</div>
      </div>
    </div>
  );
}

function TestMetrics({ cost, time, risk }) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      <div className="px-2.5 py-2 rounded-lg" style={{ background: "hsla(220,40%,6%,0.6)" }}>
        <div className="text-[8px] uppercase tracking-widest text-white/30 flex items-center gap-1 mb-0.5">
          <DollarSign size={8} /> Cost
        </div>
        <div className="text-xs font-semibold text-white/80">{cost || "—"}</div>
      </div>
      <div className="px-2.5 py-2 rounded-lg" style={{ background: "hsla(220,40%,6%,0.6)" }}>
        <div className="text-[8px] uppercase tracking-widest text-white/30 flex items-center gap-1 mb-0.5">
          <Clock size={8} /> Time
        </div>
        <div className="text-xs font-semibold text-white/80">{time || "—"}</div>
      </div>
      <div className="px-2.5 py-2 rounded-lg" style={{ background: "hsla(220,40%,6%,0.6)" }}>
        <div className="text-[8px] uppercase tracking-widest text-white/30 flex items-center gap-1 mb-0.5">
          <Shield size={8} /> Risk
        </div>
        <div className="text-xs font-semibold text-white/80">{risk || "—"}</div>
      </div>
    </div>
  );
}

function ExpectedOutcomes({ leading, alternative }) {
  if (!leading && !alternative) return null;
  return (
    <div className="space-y-1.5 mb-3">
      {leading && (
        <div
          className="px-3 py-2 rounded-lg"
          style={{ background: "hsla(145,70%,25%,0.1)", border: "1px solid hsla(145,70%,40%,0.2)" }}
        >
          <div className="text-[8px] uppercase tracking-widest text-emerald-400/70 mb-0.5">
            Leading hypothesis predicts
          </div>
          <div className="text-xs text-white/60">{leading}</div>
        </div>
      )}
      {alternative && (
        <div
          className="px-3 py-2 rounded-lg"
          style={{ background: "hsla(0,70%,25%,0.08)", border: "1px solid hsla(0,70%,40%,0.15)" }}
        >
          <div className="text-[8px] uppercase tracking-widest text-red-400/70 mb-0.5">
            Alternative predicts
          </div>
          <div className="text-xs text-white/60">{alternative}</div>
        </div>
      )}
    </div>
  );
}

export default function TestSelector({ nextTest, onEnterResult, loading }) {
  if (!nextTest) return null;
  const cat = CATEGORY_CFG[nextTest.category] || CATEGORY_CFG.home;
  const gain = Math.round((nextTest.expected_info_gain || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsla(40,90%,35%,0.12), hsla(220,40%,5%,0.85))`,
        border: "1px solid hsla(40,90%,50%,0.3)",
        boxShadow: "0 0 24px -4px hsla(40,90%,50%,0.15)",
      }}
    >
      {/* Header */}
      <div className="p-4">
        <TestHeader testName={nextTest.test_name} cat={cat} />
        <UncertaintyReduction gain={gain} />
        <TestMetrics cost={nextTest.cost} time={nextTest.time} risk={nextTest.risk} />

        {/* Rationale */}
        {nextTest.rationale && (
          <p className="text-xs text-white/55 leading-relaxed mb-3">{nextTest.rationale}</p>
        )}

        <ExpectedOutcomes
          leading={nextTest.expected_outcome_leading}
          alternative={nextTest.expected_outcome_alternative}
        />
      </div>

      {/* Action */}
      <button
        onClick={onEnterResult}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, hsla(40,90%,45%,0.8), hsla(35,100%,52%,0.7))",
          color: "white",
          borderTop: "1px solid hsla(40,90%,50%,0.3)",
        }}
      >
        {loading ? "Reconstructing histories…" : <>Enter Test Result <ArrowRight size={15} /></>}
      </button>
    </motion.div>
  );
}
