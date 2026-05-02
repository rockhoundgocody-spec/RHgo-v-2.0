import React from 'react';

/**
 * HudActionBar — angular bottom action row styled like a cockpit console.
 * Children are rendered inside the angled frame.
 */
export default function HudActionBar({ children }) {
  return (
    <div
      className="relative px-3 py-3"
      style={{
        background:
          'linear-gradient(180deg, hsla(215,80%,8%,0.6) 0%, hsla(220,70%,4%,0.85) 100%)',
        borderTop: '1px solid hsla(195,100%,60%,0.35)',
        clipPath:
          'polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
        boxShadow: 'inset 0 1px 0 hsla(195,100%,80%,0.08), 0 -8px 24px hsla(195,100%,50%,0.05)',
      }}
    >
      {/* tiny stencil markers */}
      <div className="absolute top-1 left-3 right-3 flex justify-between text-[7px] font-mono uppercase tracking-[0.4em] text-hud-cyan/40 pointer-events-none">
        <span>·CTRL·</span>
        <span>·CMD·BAR·</span>
        <span>·EXEC·</span>
      </div>
      <div className="pt-2">{children}</div>
    </div>
  );
}