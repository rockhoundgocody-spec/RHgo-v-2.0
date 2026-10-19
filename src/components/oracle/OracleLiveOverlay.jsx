import React, { useEffect } from 'react';
import { X, Mic } from 'lucide-react';
import { useOracle } from '@/components/oracle/OracleContext';
import useCloverConversation from '@/components/hub/useCloverConversation';
import VoiceStateHUD from '@/components/oracle/VoiceStateHUD';
const AmethystOrb = React.lazy(() => import('@/components/visuals/AmethystOrb.jsx'));

export default function OracleLiveOverlay() {
  const { open, closeOracle } = useOracle();
  const clover = useCloverConversation();
  const { end } = clover;
  useEffect(() => { if (!open) end(); }, [open, end]);
  if (!open) return null;
  const start = () => {
    if (clover.phase === 'idle') clover.start('I am here. Ask me about a specimen or a field question.', { listenFirst: true });
    else clover.nudge();
  };
  const lastUser = [...clover.messages].reverse().find(m => m.role === 'user')?.content;
  const lastReply = [...clover.messages].reverse().find(m => m.role === 'assistant')?.content;
  return <section aria-label="Clover live conversation" className="fixed inset-0 z-[60] bg-background text-foreground flex flex-col items-center justify-between gap-4 p-6 overflow-y-auto">
    <header className="w-full flex items-center justify-between"><h2 className="font-semibold">Clover · Live conversation</h2><button type="button" aria-label="End live" onClick={() => { end(); closeOracle(); }} className="min-w-11 min-h-11 grid place-items-center"><X size={20} /></button></header>
    <div className="flex flex-col items-center text-center max-w-md gap-4">
      <button type="button" onClick={start} disabled={clover.phase === 'thinking'} aria-label={clover.phase === 'idle' ? 'Start live conversation' : 'Speak to Clover'} className="rounded-full focus-visible:ring-2 focus-visible:ring-showcase-amber">
        <React.Suspense fallback={<Mic size={80} />}><AmethystOrb size={240} speaking={clover.phase === 'speaking'} listening={clover.phase === 'listening'} getAmplitude={clover.getAmplitude} getSpectrum={clover.getSpectrum} /></React.Suspense>
      </button>
      <VoiceStateHUD listening={clover.phase === 'listening'} thinking={clover.phase === 'thinking'} speaking={clover.phase === 'speaking'} interim={clover.interim} />
      {lastUser && <p className="text-muted-foreground">{lastUser}</p>}
      <p aria-live="polite" className="text-lg leading-relaxed">{lastReply || 'Tap the microphone to begin.'}</p>
      {clover.voiceError && <p role="alert" className="text-showcase-amber">{clover.voiceError}</p>}
    </div>
    <button type="button" onClick={clover.phase === 'idle' || clover.phase === 'resting' ? start : clover.pause} disabled={clover.phase === 'thinking' || !clover.voiceSupported}
      className="min-h-12 px-5 rounded-xl bg-showcase-amber text-showcase-ink font-semibold disabled:opacity-50">
      {clover.phase === 'idle' ? 'Start microphone' : clover.phase === 'resting' ? 'Resume microphone' : 'Pause microphone'}
    </button>
    {!clover.voiceSupported && <p className="text-muted-foreground">Voice input is unavailable in this browser.</p>}
  </section>;
}