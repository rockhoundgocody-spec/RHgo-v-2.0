import React, { useState, useEffect } from 'react';
import { Zap, GraduationCap, Lock } from 'lucide-react';

const STORAGE_KEY = 'rhgo_chaos_mode';
const PARENTAL_LOCK_KEY = 'rhgo_parental_lock_chaos';

// Call this from Parental Dashboard to lock/unlock chaos mode
export function setParentalChaosLock(locked) {
  localStorage.setItem(PARENTAL_LOCK_KEY, locked ? 'locked' : 'unlocked');
  // If locking to scholar, force chaos OFF
  if (locked) localStorage.setItem(STORAGE_KEY, 'false');
  // Dispatch event so open tabs react
  window.dispatchEvent(new Event('chaos-lock-change'));
}

export function useChaosMode() {
  const [chaos, setChaos] = React.useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const [locked, setLocked] = React.useState(() => {
    return localStorage.getItem(PARENTAL_LOCK_KEY) === 'locked';
  });

  // Listen for parental lock changes (e.g. from Parental Dashboard in another component)
  React.useEffect(() => {
    const onLockChange = () => {
      const nowLocked = localStorage.getItem(PARENTAL_LOCK_KEY) === 'locked';
      setLocked(nowLocked);
      if (nowLocked) setChaos(false);
    };
    window.addEventListener('chaos-lock-change', onLockChange);
    return () => window.removeEventListener('chaos-lock-change', onLockChange);
  }, []);

  const toggle = () => {
    if (locked) return; // parental lock blocks toggle
    setChaos((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return { chaos, toggle, locked };
}

export default function ChaosModeToggle({ chaos, onToggle, locked }) {
  return (
    <button
      onClick={onToggle}
      disabled={locked}
      aria-pressed={!locked ? chaos : undefined}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all active:scale-95 select-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background ${
        locked
          ? 'focus-visible:ring-white/30'
          : chaos
            ? 'focus-visible:ring-orange-400/50'
            : 'focus-visible:ring-hud-cyan/50'
      }`}
      style={{
        background: locked
          ? 'hsla(0,0%,15%,0.5)'
          : chaos
            ? 'linear-gradient(135deg, hsla(280,80%,30%,0.5), hsla(30,90%,30%,0.4))'
            : 'hsla(200,60%,15%,0.4)',
        border: locked
          ? '1px solid hsla(0,0%,40%,0.3)'
          : chaos
            ? '1px solid hsla(280,80%,55%,0.4)'
            : '1px solid hsla(200,60%,45%,0.3)',
        opacity: locked ? 0.6 : 1,
      }}
      title={locked ? 'Locked by Parental Dashboard' : chaos ? 'Switch to Scholar Mode' : 'Switch to Chaos Mode'}
    >
      {locked ? (
        <>
          <Lock size={11} className="text-white/40" />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">Locked</span>
        </>
      ) : chaos ? (
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