import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * OracleTranscript — dedicated bottom-sheet transcript surface for the
 * Amethyst Oracle. Renders BELOW the hero, never overlapping cards/title.
 *
 * Props:
 *   - active        : whether the oracle session is alive
 *   - reply         : latest oracle reply string
 *   - interim       : interim user transcription
 *   - status        : 'thinking' | 'speaking' | 'listening' | 'awake'
 *   - onClose       : sleep / dismiss callback
 */
export default function OracleTranscript({ active, reply, interim, status, onClose }) {
  const visible = active && (reply || interim || status);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (visible && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reply, interim, visible]);

  if (!visible) return null;

  const statusLabel =
    status === 'thinking' ? 'Thinking…' :
    status === 'speaking' ? 'Speaking' :
    status === 'listening' ? 'Listening' :
    'Awake';

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{
        bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className={cn(
          'pointer-events-auto mx-auto max-w-md rounded-2xl glass-panel',
          'border border-amethyst/30 shadow-[0_18px_40px_-12px_hsla(280,80%,30%,0.5)]',
          'animate-in fade-in slide-in-from-bottom-4 duration-300'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-amethyst/15">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amethyst-glow" size={14} />
            <span className="text-[11px] uppercase tracking-[0.3em] text-amethyst-glow font-mono">
              Oracle
            </span>
            <span className="ml-1 inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full bg-emerald-400',
                  (status === 'speaking' || status === 'listening' || status === 'thinking') && 'animate-pulse'
                )}
              />
              {statusLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 active:scale-95 transition"
            aria-label="Close oracle"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="px-4 py-3 max-h-[180px] overflow-y-auto scrollbar-none"
        >
          {reply && (
            <p
              className="text-white/95 text-[15px] leading-relaxed"
              style={{ textShadow: '0 0 14px hsla(280,90%,70%,0.35)' }}
            >
              {reply}
            </p>
          )}
          {interim && (
            <p className="mt-2 text-amethyst/75 text-[13px] italic flex items-start gap-1.5">
              <Mic size={12} className="mt-0.5 shrink-0 opacity-70" />
              <span>{interim}</span>
            </p>
          )}
          {!reply && !interim && status === 'listening' && (
            <p className="text-amethyst/60 text-[13px] italic">Go ahead — I'm listening…</p>
          )}
        </div>
      </div>
    </div>
  );
}