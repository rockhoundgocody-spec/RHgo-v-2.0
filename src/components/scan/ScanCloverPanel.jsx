import React, { useState } from 'react';
import { Mic, MicOff, X, ChevronDown } from 'lucide-react';

export default function ScanCloverPanel({ clover, onClose, onMinimize }) {
  const [draft, setDraft] = useState('');
  const lastReply = [...clover.messages].reverse().find(m => m.role === 'assistant')?.content;
  const lastUser = [...clover.messages].reverse().find(m => m.role === 'user')?.content;
  const status = { listening: 'Listening…', thinking: 'Thinking…', speaking: 'Clover is speaking', resting: 'Microphone paused' }[clover.phase];
  return <section aria-label="Clover scan conversation" className="mx-auto w-full max-w-sm rounded-2xl border border-showcase-line bg-showcase-ink text-showcase-frost shadow-xl p-3 space-y-2">
    <header className="flex items-center justify-between">
      <h2 className="font-semibold">Clover · Field voice</h2>
      <div className="flex"><button type="button" onClick={onMinimize} aria-label="Minimize Clover" className="min-h-11 min-w-11 grid place-items-center focus-visible:ring-2 focus-visible:ring-showcase-amber"><ChevronDown size={20} /></button>
        <button type="button" onClick={onClose} aria-label="End scan conversation" className="min-h-11 min-w-11 grid place-items-center focus-visible:ring-2 focus-visible:ring-showcase-amber"><X size={20} /></button></div>
    </header>
    <div className="max-h-[22vh] overflow-y-auto space-y-2 text-sm leading-relaxed">
      {lastUser && <p className="text-showcase-muted">You: {lastUser}</p>}
      <p aria-live="polite">{lastReply}</p>
      {clover.interim && <p className="text-showcase-amber">{clover.interim}</p>}
      {clover.voiceError && <p role="alert" className="text-showcase-amber">{clover.voiceError}</p>}
    </div>
    <button type="button" disabled={clover.phase === 'thinking' || !clover.voiceSupported} onClick={clover.phase === 'resting' ? clover.nudge : clover.pause}
      aria-label={clover.phase === 'resting' ? 'Resume scan microphone' : 'Pause scan microphone'}
      className="min-h-11 w-full flex items-center justify-center gap-2 rounded-xl border border-showcase-amber/50 text-showcase-amber disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-showcase-amber">
      {clover.phase === 'resting' ? <Mic size={18} /> : <MicOff size={18} />} {status}
    </button>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (draft.trim()) { clover.unlock(); clover.send(draft.trim()); setDraft(''); } }}>
      <input aria-label="Message Clover during scan" placeholder="Or type a question" value={draft} onChange={e => setDraft(e.target.value)} disabled={clover.phase === 'thinking'} className="min-h-11 w-full min-w-0 rounded-xl border border-showcase-line bg-showcase-panel px-3 text-base placeholder:text-showcase-muted focus-visible:outline-showcase-amber" />
      <button type="submit" disabled={!draft.trim() || clover.phase === 'thinking'} className="min-h-11 rounded-xl bg-showcase-amber text-showcase-ink px-3 font-semibold disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-showcase-frost">Send</button>
    </form>
    {!clover.voiceSupported && <p className="text-sm text-showcase-muted">Voice input is unavailable in this browser. You can still type.</p>}
  </section>;
}