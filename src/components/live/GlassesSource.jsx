import React from 'react';
import { Glasses, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';

const supported = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getDisplayMedia === 'function';

/**
 * "Connect glasses" source — mirrors the glasses companion app's live preview
 * into our broadcast viewport. Works in the native mobile app (screen capture);
 * degrades to a calm install prompt where capture isn't available.
 */
export default function GlassesSource({ connected, connecting, onConnect }) {
  if (!supported()) {
    return (
      <div className="rounded-2xl p-3.5 flex gap-3"
        style={{ background: 'hsla(270,40%,20%,0.45)', border: '1px solid hsla(280,100%,70%,0.22)' }}>
        <Smartphone size={16} className="text-amethyst-glow shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-white/90">Glasses need the mobile app</p>
          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
            Streaming from AI glasses mirrors their preview from your phone screen — install
            RockHound-GO on your phone to use this source. Phone camera works here meanwhile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onConnect}
      disabled={connecting}
      className="w-full rounded-2xl p-3.5 flex items-center gap-3 text-left transition-colors disabled:opacity-60"
      style={{
        background: connected ? 'hsla(270,60%,32%,0.6)' : 'hsla(270,40%,20%,0.45)',
        border: `1px solid ${connected ? 'hsla(280,100%,75%,0.55)' : 'hsla(280,100%,70%,0.22)'}`,
      }}
    >
      {connecting
        ? <Loader2 size={16} className="text-amethyst-glow shrink-0 animate-spin" />
        : connected
          ? <CheckCircle2 size={16} className="text-amethyst-glow shrink-0" />
          : <Glasses size={16} className="text-amethyst-glow shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs font-bold text-white/90">
          {connected ? 'Glasses connected' : 'Connect AI glasses'}
        </p>
        <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
          {connected
            ? 'Mirroring your glasses preview — AI reads this feed live.'
            : 'Open your glasses app preview first, then pick it when asked.'}
        </p>
      </div>
    </button>
  );
}