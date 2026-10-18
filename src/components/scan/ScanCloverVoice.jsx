import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Mic } from 'lucide-react';
import useCloverConversation from '@/components/hub/useCloverConversation';
import ScanCloverPanel from '@/components/scan/ScanCloverPanel';

const ScanCloverVoice = forwardRef(function ScanCloverVoice({ result, eyes, paused, onActiveChange }, ref) {
  const [expanded, setExpanded] = useState(false);
  const scanContext = result ? { label: result.top_match, confidence: result.confidence, evidence: JSON.stringify({ description: result.description, observed_features: result.observed_features, candidates: result.candidates }).slice(0, 900), preview: false }
    : eyes?.candidates?.[0] && !eyes.stale ? { label: eyes.candidates[0].name, confidence: eyes.candidates[0].confidence, evidence: 'Tentative live preview only.', preview: true } : null;
  const clover = useCloverConversation({ scanContext });
  const { phase, pause } = clover;
  const open = () => {
    setExpanded(true);
    if (phase === 'idle') clover.start('Ask me about this specimen. I will use the current scan when available.', { listenFirst: true });
  };
  useImperativeHandle(ref, () => ({ open }));
  useEffect(() => { onActiveChange?.(phase !== 'idle'); }, [phase, onActiveChange]);
  useEffect(() => { if (paused) pause(); }, [paused, pause]);
  if (paused) return null;
  return <div className={`absolute inset-x-4 z-[60] pointer-events-none ${result ? 'top-16' : 'bottom-36'}`}>
    <div className="pointer-events-auto w-fit max-w-full mx-auto">
      {expanded ? <ScanCloverPanel clover={clover} onMinimize={() => setExpanded(false)} onClose={() => { clover.end(); setExpanded(false); }} />
        : <button type="button" onClick={open} aria-expanded={expanded} aria-label="Talk to Clover during scan" className="min-h-12 px-4 rounded-full border border-showcase-amber/60 bg-showcase-ink text-showcase-frost flex items-center gap-2 font-semibold text-sm shadow-xl focus-visible:ring-2 focus-visible:ring-showcase-amber">
          <Mic size={20} className="text-showcase-amber" /> {phase === 'idle' ? 'Talk to Clover' : 'Show Clover'}
        </button>}
    </div>
  </div>;
});
export default ScanCloverVoice;