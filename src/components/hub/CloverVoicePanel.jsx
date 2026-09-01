import React, { useEffect, useRef } from 'react';
import { Loader2, X, Target, Gem, Mic, Keyboard } from 'lucide-react';

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
  suggestions, onDismissSuggestions, voiceSupported, onSend,
}) {
  const bottomRef = useRef(null);
  const [draft, setDraft] = React.useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interim, suggestions]);

  return (
    <div
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
          Clover 🍀
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
            className="flex items-center gap-1 text-[10px] font-semibold text-amethyst-glow disabled:opacity-40 active:scale-90 transition"
            aria-label="Get hunt suggestions"
          >
            {huntLoading ? <Loader2 size={12} className="animate-spin" /> : <Target size={12} />}
            <span>Hunt</span>
          </button>
          <button onClick={onClose} aria-label="End conversation" className="text-white/25 hover:text-white/60 transition">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: 90 }}>
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

        {/* Quick prompt chips for fast 1-tap inquiries */}
        {messages.length <= 2 && !interim && phase !== 'thinking' && (
          <div className="pt-1.5 pb-1 flex flex-wrap gap-1.5 justify-start">
            {[
              'Where can I hunt nearby?',
              'How to spot agates?',
              'Field hardness test tips',
              'Tell me a rock secret',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => onSend?.(chip)}
                className="text-[10px] font-medium px-2 py-1 rounded-lg transition-all active:scale-95 text-white/70 hover:text-white"
                style={{
                  background: 'hsla(270,50%,25%,0.4)',
                  border: '1px solid hsla(270,60%,50%,0.25)',
                }}
              >
                {chip}
              </button>
            ))}
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
              <button onClick={onDismissSuggestions} className="w-full text-[9px] text-white/35 hover:text-white/60 transition py-1">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Status line — replaces the old text box */}
      <div className="px-3 py-2 border-t border-white/8">
        {voiceSupported ? (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/35">
            <VoiceDots active={phase === 'listening'} />
            <span>{PHASE_TEXT[phase] || ''}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Keyboard size={12} className="text-white/25 shrink-0" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim()) { onSend(draft.trim()); setDraft(''); }
              }}
              placeholder="Voice isn't available here — type instead"
              className="flex-1 bg-transparent text-[11px] text-white/75 placeholder-white/25 outline-none"
            />
          </div>
        )}
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