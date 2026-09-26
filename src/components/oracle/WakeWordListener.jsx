import React from 'react';
import { Mic } from 'lucide-react';
import useWakeWord from '@/hooks/useWakeWord';

/** Runs the always-on "Hey Clover" listener and shows a small mic-live pill. */
export default function WakeWordListener() {
  const live = useWakeWord();
  if (!live) return null;
  return (
    <div
      className="fixed top-[max(env(safe-area-inset-top,0px),10px)] right-3 z-50 flex items-center gap-1.5 px-2 py-1 rounded-full pointer-events-none select-none"
      style={{ background: 'hsla(240,25%,8%,0.8)', border: '1px solid hsla(160,70%,55%,0.3)', backdropFilter: 'blur(10px)' }}
      role="status"
      aria-label="Listening for Hey Clover"
    >
      <span className="relative flex w-1.5 h-1.5">
        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#9FE8D0', opacity: 0.6 }} />
        <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: '#9FE8D0' }} />
      </span>
      <Mic size={10} className="text-[#9FE8D0]" />
      <span className="text-[9px] uppercase tracking-[0.18em] text-white/55">Hey Clover</span>
    </div>
  );
}