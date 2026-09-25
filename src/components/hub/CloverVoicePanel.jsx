import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2, X, Target, Gem, Mic, Keyboard, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { lookupMineralIntelligence } from '@/lib/mindatApi';
import useKidMode from '@/lib/useKidMode';
import { getKidFriendlyMineral } from '@/lib/kidFriendlyData';

const PHASE_TEXT = {
  thinking:  'thinking…',
  speaking:  'talking — just jump in any time',
  listening: 'listening',
  resting:   'here whenever you are — tap to talk',
  idle:      '',
};

/**
 * CloverVoicePanel — the conversation surface. Voice-first: no text box unless
 * the browser can't do speech input.
 */
export default function CloverVoicePanel({
  phase, messages, interim, onClose, onHunt, huntLoading,
  suggestions, onDismissSuggestions, voiceSupported, onSend, onListen,
}) {
  const transcriptRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [expandedIntel, setExpandedIntel] = useState(false);
  const isKid = useKidMode();

  const lastMsg = messages[messages.length - 1]?.content || '';
  const detectedMineral = useMemo(() => lookupMineralIntelligence(lastMsg), [lastMsg]);
  const kidMineral = useMemo(() => detectedMineral ? getKidFriendlyMineral(detectedMineral.name) : null, [detectedMineral]);

  // Scroll only the panel's internal transcript — never the page.
  // This keeps the orb in place while Clover talks.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, interim, suggestions, detectedMineral, expandedIntel]);

  return (
    <div
      id="clover-voice-panel"
      role="region"
      aria-label="Clover Voice Companion"
      className="mt-4 w-full max-w-[300px] rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'hsla(255,30%,14%,0.97)',
        border: '1px solid hsla(270,50%,55%,0.25)',
        boxShadow: '0 8px 40px -8px hsla(270,80%,40%,0.4)',
        maxHeight: 300,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
        <span className="text-[11px] font-semibold text-amethyst-glow tracking-wide flex items-center gap-1.5">
          Clover 🍀 {isKid && <span className="text-[9px] text-amber-300 font-bold">(Explorer Buddy)</span>}
          {phase === 'listening' && (
            <span className="flex items-center gap-1 text-[9px] font-normal text-hud-cyan">
              <Mic size={9} className="animate-pulse" /> listening
            </span>
          )}
        </span>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onHunt}
            disabled={huntLoading}
            className="flex items-center gap-1 text-[10px] font-semibold text-amethyst-glow disabled:opacity-40 active:scale-90 transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
            aria-label="Get hunt suggestions"
          >
            {huntLoading ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
            <span>Hunt</span>
          </button>
          <button onClick={onClose} aria-label="End conversation" className="text-white/25 hover:text-white/60 transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Transcript */}
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 90 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed"
              style={m.role === 'user'
                ? { background: 'hsla(270,60%,40%,0.4)', border: '1px solid hsla(270,60%,60%,0.2)', color: 'hsl(280,80%,93%)' }
                : { background: 'hsla(255,25%,20%,0.6)', border: '1px solid hsla(255,20%,40%,0.2)', color: 'rgba(255,255,255,0.78)' }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* Mindat Scientific Mineral Intelligence Card */}
        {detectedMineral && (
          <div
            className="rounded-xl p-2.5 space-y-1.5 transition-all text-[11px]"
            style={{
              background: 'hsla(270,40%,18%,0.75)',
              border: '1px solid hsla(280,70%,60%,0.35)',
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-expanded={expandedIntel}
              aria-controls="mindat-intel-details"
              className="flex items-center justify-between cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              onClick={() => setExpandedIntel(!expandedIntel)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setExpandedIntel(!expandedIntel);
                }
              }}
            >
              <div className="flex items-center gap-1.5 font-bold text-amethyst-glow">
                <Gem size={12} />
                <span>Mindat: {detectedMineral.name}</span>
              </div>
              <span className="text-[9px] text-white/50 font-mono flex items-center gap-0.5">
                {detectedMineral.hardness} {expandedIntel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </span>
            </div>

            {kidMineral && (
              <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1 pt-0.5">
                <Sparkles size={11} className="text-yellow-400" />
                <span>Superpower: {kidMineral.superpower}</span>
              </div>
            )}

            {expandedIntel && (
              <div id="mindat-intel-details" className="pt-1.5 space-y-1 text-[10px] text-white/70 border-t border-white/10">
                <div><span className="text-white/40">Formula:</span> <span className="font-mono text-cyan-300 font-semibold">{detectedMineral.formula}</span></div>
                <div><span className="text-white/40">System:</span> {detectedMineral.crystal_system}</div>
                <div><span className="text-white/40">Cleavage:</span> {detectedMineral.cleavage}</div>
                {detectedMineral.uv_fluorescence && (
                  <div><span className="text-amber-400 font-semibold">UV:</span> {detectedMineral.uv_fluorescence}</div>
                )}
                <div className="text-white/60 italic pt-0.5 leading-snug">{detectedMineral.field_test}</div>
              </div>
            )}
          </div>
        )}

        {/* What she's hearing right now */}
        {interim && (
          <div className="flex justify-end">
            <div
              className="max-w-[90%] px-3 py-2 rounded-xl text-[11px] leading-relaxed italic"
              style={{ background: 'hsla(270,50%,35%,0.22)', border: '1px dashed hsla(270,60%,60%,0.25)', color: 'hsla(280,70%,90%,0.6)' }}
            >
              {interim}
            </div>
          </div>
        )}

        {phase === 'thinking' && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl" style={{ background: 'hsla(255,25%,20%,0.6)' }}>
              <Loader2 size={12} className="animate-spin opacity-50" />
            </div>
          </div>
        )}

        {suggestions && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'hsla(270,40%,20%,0.35)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
            <div
              className="px-3 py-2 text-[10px] font-bold text-amethyst-glow tracking-wide"
              style={{ borderBottom: '1px solid hsla(280,80%,60%,0.2)', background: 'hsla(270,60%,30%,0.25)' }}
            >
              🎯 Hunt Next — {suggestions.collection_size} in collection
            </div>
            <div className="space-y-2 p-2">
              {suggestions.clover_intro && (
                <p className="text-[10px] text-white/70 italic px-1">{suggestions.clover_intro}</p>
              )}
              {suggestions.suggestions.map((s, i) => (
                <div key={i} className="rounded-lg p-2" style={{ background: 'hsla(255,30%,14%,0.6)', border: '1px solid hsla(280,60%,50%,0.18)' }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-amethyst-glow flex items-center gap-1">
                      <Gem size={9} /> {s.mineral_name}
                    </span>
                    {s.distance_mi != null && (
                      <span className="text-[8px] font-mono text-hud-cyan/70">{s.distance_mi}mi</span>
                    )}
                  </div>
                  {s.hotspot_name && <p className="text-[9px] text-hud-cyan/80 mb-1">📍 {s.hotspot_name}</p>}
                  <p className="text-[9px] text-white/65 leading-relaxed mb-1">{s.what_to_look_for}</p>
                  <p className="text-[9px] text-white/40 italic leading-relaxed">{s.why}</p>
                </div>
              ))}
              <button onClick={onDismissSuggestions} className="w-full text-[9px] text-white/35 hover:text-white/60 transition py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50">
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/8 space-y-2">
        <button
          type="button"
          onClick={() => onListen?.()}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] text-white/45 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
        >
          <VoiceDots active={phase === 'listening'} />
          <span>{PHASE_TEXT[phase] || 'tap to talk'}</span>
        </button>
        <div className="flex items-center gap-2">
          <Keyboard size={12} className="text-white/25 shrink-0" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) { onSend(draft.trim()); setDraft(''); }
            }}
            aria-label="Type message to Clover"
            placeholder={voiceSupported ? 'Or type if it is noisy out' : "Voice isn't available — type"}
            className="flex-1 bg-transparent text-[11px] text-white/75 placeholder-white/25 outline-none rounded px-1.5 py-0.5 focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          />
        </div>
      </div>
    </div>
  );
}

function VoiceDots({ active }) {
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block rounded-full"
          style={{
            width: 3, height: 3,
            background: active ? 'hsl(195,100%,75%)' : 'hsla(0,0%,100%,0.2)',
            animation: active ? `pp-breath 1s ease-in-out ${i * 0.15}s infinite` : 'none',
          }}
        />
      ))}
    </span>
  );
}