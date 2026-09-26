import React, { useEffect, useState } from 'react';
import { Ear } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';
import { isWakeEnabled, on, setWakeEnabled } from '@/lib/cloverWake';

const supported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function WakeWordSection() {
  const [enabled, setEnabled] = useState(isWakeEnabled);

  const [denied, setDenied] = useState(false);

  useEffect(() => on('enabled', (v) => setEnabled(!!v)), []);
  useEffect(() => on('denied', () => setDenied(true)), []);

  const toggle = () => {
    setDenied(false);
    setWakeEnabled(!enabled);
  };

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={Ear}
          iconColor="text-[#9FE8D0]"
          title='"Hey Clover" wake word'
          subtitle="Say Hey Clover, Hi Clover, OK Clover, or just Clover. Accents and near-miss pronunciations work too."
        />
        <div className="ml-9 flex items-center justify-between gap-3">
          <p className="text-[11px] text-white/40 leading-relaxed">
            {denied
              ? 'Microphone access is blocked. Allow the mic for this site in your browser settings, then turn this on again.'
              : supported
              ? 'Keeps the mic on while the app is open. Pauses when the app is in the background.'
              : 'Not supported in this browser. Use Chrome or Edge, or tap the orb.'}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Always-on Hey Clover listening"
            disabled={!supported}
            onClick={toggle}
            className="relative w-11 h-6 rounded-full shrink-0 transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
            style={{ background: enabled ? '#9FE8D0' : 'hsla(0,0%,100%,0.12)' }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
              style={{ background: enabled ? '#0a0a14' : 'hsla(0,0%,100%,0.7)', transform: enabled ? 'translateX(20px)' : 'none' }}
            />
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}