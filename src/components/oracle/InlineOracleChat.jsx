import React, { useEffect, useRef } from 'react';
import { Sparkles, Mic, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * InlineOracleChat — embedded conversation surface that lives directly
 * inside the Hub, not as a popup. Shows full back-and-forth history with
 * the Oracle, plus live interim transcription and current status.
 *
 * Props:
 *   - active   : whether the oracle session is alive
 *   - history  : [{ role: 'user' | 'oracle', content: string }]
 *   - interim  : in-progress user transcription
 *   - status   : 'thinking' | 'speaking' | 'listening' | 'awake'
 */
export default function InlineOracleChat({ active, history = [], interim, status }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, interim, status]);

  const statusLabel =
    status === 'thinking' ? 'Thinking…' :
    status === 'speaking' ? 'Speaking' :
    status === 'listening' ? 'Listening' :
    active ? 'Awake' : 'Asleep';

  return (
    <div className="glass-panel rounded-2xl border border-amethyst/25 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-amethyst/15">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amethyst-glow" size={14} />
          <span className="text-[11px] uppercase tracking-[0.3em] text-amethyst-glow font-mono">
            Oracle Conversation
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90">
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              active ? 'bg-emerald-400' : 'bg-white/30',
              (status === 'speaking' || status === 'listening' || status === 'thinking') && 'animate-pulse'
            )}
          />
          {statusLabel}
        </span>
      </div>

      {/* Message stream */}
      <div
        ref={scrollRef}
        className="px-4 py-4 max-h-[340px] min-h-[180px] overflow-y-auto scrollbar-none space-y-3"
      >
        {history.length === 0 && !interim && (
          <p className="text-amethyst/60 text-[13px] italic text-center py-6">
            Tap the orb to begin a conversation.
          </p>
        )}

        {history.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}

        {interim && (
          <div className="flex items-start gap-2 opacity-70">
            <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Mic size={10} className="text-emerald-300" />
            </div>
            <p className="text-emerald-200/80 text-[13px] italic leading-relaxed">
              {interim}
            </p>
          </div>
        )}

        {status === 'thinking' && (
          <div className="flex items-center gap-1.5 pl-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Message({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={cn('flex items-start gap-2', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 border',
          isUser
            ? 'bg-emerald-500/15 border-emerald-400/30'
            : 'bg-amethyst/20 border-amethyst-glow/40'
        )}
      >
        {isUser
          ? <User size={11} className="text-emerald-300" />
          : <Sparkles size={11} className="text-amethyst-glow" />}
      </div>
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2 max-w-[80%] text-[14px] leading-relaxed',
          isUser
            ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-50'
            : 'bg-amethyst/10 border border-amethyst-glow/20 text-white/95'
        )}
        style={!isUser ? { textShadow: '0 0 14px hsla(280,90%,70%,0.25)' } : undefined}
      >
        {content}
      </div>
    </div>
  );
}