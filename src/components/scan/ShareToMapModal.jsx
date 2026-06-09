/**
 * ShareToMapModal — lets the user opt-in to sharing their find
 * to the global hotspot map after saving a specimen.
 */
import React, { useState } from 'react';
import { MapPin, Globe, Lock, Loader2, CheckCircle2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ShareToMapModal({ open, specimen, result, onClose, onShared }) {
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [note, setNote] = useState('');

  if (!open) return null;

  const handleShare = async () => {
    if (!specimen?.id || !result) return;
    setSharing(true);
    try {
      await base44.functions.invoke('identifySpecimen', {
        image_url: specimen.image_url,
        lat: specimen.lat,
        lng: specimen.lng,
        save: false,
        share_to_map: true,
      });
      setShared(true);
      setTimeout(() => { onShared?.(); onClose(); }, 1800);
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-4"
      style={{
        paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
        background: 'hsla(260,80%,4%,0.82)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 relative"
        style={{
          background: 'linear-gradient(160deg, hsla(265,42%,11%,0.99), hsla(240,30%,7%,0.99))',
          border: '1px solid hsla(280,60%,45%,0.35)',
          boxShadow: '0 -8px 60px hsla(280,80%,30%,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white/70">
          <X size={16} />
        </button>

        {shared ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
            <div className="text-white font-bold text-base">Added to Global Map!</div>
            <p className="text-white/50 text-sm mt-1">Your find is now visible to other rockhounds nearby.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsla(195,100%,30%,0.3)', border: '1px solid hsla(195,100%,60%,0.35)' }}>
                <Globe size={18} className="text-hud-cyan" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Share to Global Map?</div>
                <div className="text-white/40 text-xs">Help other rockhounds find great sites</div>
              </div>
            </div>

            {/* Mineral preview */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl"
              style={{ background: 'hsla(265,30%,12%,0.7)', border: '1px solid hsla(280,30%,30%,0.3)' }}>
              {specimen?.image_url ? (
                <img src={specimen.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-amethyst/20 flex-shrink-0" />
              )}
              <div>
                <div className="text-white text-sm font-bold">{result?.top_match}</div>
                <div className="text-white/40 text-xs capitalize">{result?.rarity} · {(result?.confidence * 100)?.toFixed(0)}% confidence</div>
                {specimen?.lat && (
                  <div className="flex items-center gap-1 mt-1 text-hud-cyan/70 text-[10px]">
                    <MapPin size={9} />
                    {specimen.lat.toFixed(4)}, {specimen.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-2 mb-4 p-2.5 rounded-xl"
              style={{ background: 'hsla(220,40%,10%,0.5)', border: '1px solid hsla(220,40%,25%,0.25)' }}>
              <Lock size={12} className="text-white/30 mt-0.5 flex-shrink-0" />
              <p className="text-white/40 text-[10px] leading-relaxed">
                Your exact coordinates are rounded to protect privacy. Only the mineral type and general area are shared. Your profile is never shown.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 border border-white/10 hover:border-white/20 transition">
                Keep Private
              </button>
              <button
                onClick={handleShare}
                disabled={sharing || !specimen?.lat}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, hsla(195,80%,30%,0.8), hsla(215,80%,40%,0.8))',
                  border: '1px solid hsla(195,100%,60%,0.4)',
                  boxShadow: '0 0 16px hsla(195,100%,50%,0.2)',
                }}
              >
                {sharing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                {sharing ? 'Sharing…' : 'Share Find'}
              </button>
            </div>

            {!specimen?.lat && (
              <p className="text-center text-xs text-amber-400/60 mt-2">
                No GPS data — enable location to share to map.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}