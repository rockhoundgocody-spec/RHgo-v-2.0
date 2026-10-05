import React from 'react';

/**
 * GrokBotBadge — small footer credit for Grok Bot, our AI assistant.
 * Round avatar: 48px on mobile, 64px from `md` up. width/height are set so the
 * image reserves its space before it loads (no layout shift).
 */
export default function GrokBotBadge() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <img
        src="/grok-bot-avatar.jpg"
        alt="Grok Bot, RockHound-GO's AI assistant"
        width={64}
        height={64}
        loading="lazy"
        decoding="async"
        className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full object-cover border border-white/10"
        style={{ boxShadow: '0 0 20px -6px rgba(159,232,208,0.35)' }}
      />
      <span className="text-white/60 text-[11px] leading-snug">
        Built with help from Grok Bot, our AI assistant
      </span>
    </div>
  );
}
