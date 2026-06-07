import React, { useState } from 'react';
import { Zap, GraduationCap } from 'lucide-react';

// Global chaos mode state — stored in localStorage so it persists across sessions
const STORAGE_KEY = 'rhgo_chaos_mode';

export function useChaosMode() {
  const [chaos, setChaos] = React.useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true'; // default ON (kids mode)
  });

  const toggle = () => {
    setChaos((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { chaos, toggle };
}

export default function ChaosModeToggle({ chaos, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 select-none"
      style={{
        background: chaos
          ? 'linear-gradient(135deg, hsla(280,80%,30%,0.5), hsla(30,90%,30%,0.4))'
          : 'hsla(200,60%,15%,0.4)',
        border: chaos
          ? '1px solid hsla(280,80%,55%,0.4)'
          : '1px solid hsla(200,60%,45%,0.3)',
      }}
      title={chaos ? 'Switch to Scholar Mode' : 'Switch to Chaos Mode'}
    >
      {chaos ? (
        <>
          <span className="text-base leading-none">⚡</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-orange-300">Chaos</span>
        </>
      ) : (
        <>
          <GraduationCap size={13} className="text-hud-cyan" />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-hud-cyan">Scholar</span>
        </>
      )}
    </button>
  );
}