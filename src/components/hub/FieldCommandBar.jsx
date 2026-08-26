import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, MapPin, Zap, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  FIELD_COMMAND_MAX_LENGTH,
  getSafeInternalRoute,
  normalizeFieldCommand,
} from './fieldCommandSafety';

const EXAMPLE_COMMANDS = [
  'Find fluorite near me',
  'Where can I find agates in Missouri?',
  'Compare my quartz to known Arkansas crystals',
  'Is it safe to collect at mine tailings?',
  'What minerals form with pyrite?',
  'Guide me to hydrothermal zones',
];

const CONFIDENCE_STYLE = {
  high: 'text-emerald-300',
  moderate: 'text-amber-300',
  speculative: 'text-rose-300',
};

const INTENT_LABEL = {
  scan: '→ Scan',
  explore: '→ Explore',
  collection: '→ Collection',
  compare: '→ Compare',
  verify: '→ Verify',
  safety: '→ Explore · Safety',
  docs: '→ Field Guide',
};

export default function FieldCommandBar({ collectionCount }) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [location, setLocation] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Try to grab location silently on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const submit = async (cmd) => {
    const text = normalizeFieldCommand(cmd || command);
    if (!text || loading) return;
    setLoading(true);
    setResult(null);
    setError('');
    setExpanded(true);
    try {
      const res = await base44.functions.invoke('fieldCommand.js', {
        command: text,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        collection_count: collectionCount ?? 0,
      });
      setResult(res.data);
    } catch {
      setError('Field Command could not complete that request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const handleNavigate = () => {
    const route = getSafeInternalRoute(result?.route);
    if (route) navigate(route);
  };

  return (
    <div className="rounded-2xl glass-panel overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-amethyst-glow" />
          <span className="text-[10px] uppercase tracking-[0.35em] text-amethyst/60">Field Command</span>
          {location && (
            <div className="ml-auto flex items-center gap-1 text-[9px] text-hud-cyan/50">
              <MapPin size={8} /> GPS
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            aria-label="Field command"
            maxLength={FIELD_COMMAND_MAX_LENGTH}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Give me a field goal…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amethyst/40 min-w-0"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={loading || !command.trim()}
            aria-label="Submit field command"
            className="px-4 py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-30 text-white transition flex items-center gap-1.5 text-sm font-medium shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          </button>
        </div>

        {/* Example chips */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {EXAMPLE_COMMANDS.slice(0, 3).map((ex) => (
            <button
              type="button"
              key={ex}
              onClick={() => { setCommand(ex); submit(ex); }}
              className="text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-amethyst/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Result */}
      {(loading || result) && (
        <div className="px-4 py-3">
          {loading && (
            <div className="flex items-center gap-2 text-amethyst/60 text-sm py-2">
              <Loader2 size={13} className="animate-spin" />
              <span className="text-xs font-mono uppercase tracking-[0.25em]">Analyzing field context…</span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              {/* Headline + intent */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm leading-snug">{result.result?.headline}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amethyst/10 border border-amethyst/20 text-amethyst/70 font-mono">
                      {INTENT_LABEL[result.intent] || result.intent}
                    </span>
                    {result.result?.confidence && (
                      <span className={`text-[10px] font-mono ${CONFIDENCE_STYLE[result.result.confidence]}`}>
                        {result.result.confidence}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(p => !p)}
                  aria-label={expanded ? 'Collapse details' : 'Expand details'}
                  aria-expanded={expanded}
                  aria-controls="field-command-details"
                  className="text-white/30 hover:text-white/60 transition shrink-0 mt-0.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {expanded && (
                <div id="field-command-details" className="contents">
                  {/* Geological brief */}
                  {result.result?.geological_brief && (
                    <p className="text-white/70 text-xs leading-relaxed border-l-2 border-amethyst/25 pl-3">
                      {result.result.geological_brief}
                    </p>
                  )}

                  {/* Field actions */}
                  {result.result?.field_actions?.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase tracking-[0.3em] text-white/30">Field Actions</div>
                      {result.result.field_actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/75">
                          <span className="text-amethyst-glow font-mono shrink-0">{i + 1}.</span>
                          {action}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Safety note */}
                  {result.result?.safety_note && (
                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                      <AlertTriangle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-amber-300 text-xs">{result.result.safety_note}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigate CTA */}
              <button
                type="button"
                onClick={handleNavigate}
                disabled={!getSafeInternalRoute(result.route)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amethyst/30 text-amethyst/80 hover:text-white hover:bg-amethyst/10 text-xs font-medium uppercase tracking-[0.25em] transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              >
                {INTENT_LABEL[result.intent] || 'Open'} <ArrowRight size={11} />
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p role="alert" className="px-4 py-3 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
