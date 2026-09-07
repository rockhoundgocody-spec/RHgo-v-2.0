/**
 * LandAccessPanel — Ethical land access status module for hotspot detail.
 * Shows access status, permit requirements, seasonal closures, claim status,
 * and collecting rules in a clear, color-coded panel.
 */
import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock, FileText, DollarSign, Lock, MapPin } from 'lucide-react';
import { isUnverifiedQuickPin } from '@/api/coreLoop';

const ACCESS_CONFIG = {
  open:       { label: 'Open Access',     color: '#34d399', icon: CheckCircle2, desc: 'Collecting allowed — follow local rules' },
  restricted: { label: 'Restricted',      color: '#fbbf24', icon: AlertTriangle, desc: 'Permit or fee required to collect' },
  seasonal:   { label: 'Seasonal Access',  color: '#38bdf8', icon: Clock,       desc: 'Open only during specific dates' },
  closed:     { label: 'Closed',           color: '#fb7185', icon: Lock,        desc: 'Collecting is not permitted here' },
  unknown:    { label: 'Unknown Status',    color: '#94a3b8', icon: Shield,      desc: 'Verify access before visiting' },
};

const CLAIM_CONFIG = {
  none:        { label: 'No Mining Claims',  color: '#34d399' },
  unpatented:  { label: 'Unpatented Claim',  color: '#fbbf24', desc: 'Surface collecting may be allowed; check with claimholder' },
  patented:    { label: 'Patented Claim',    color: '#fb7185', desc: 'Private mineral rights — permission required' },
  active_mine: { label: 'Active Mine',       color: '#fb7185', desc: 'Active mining operation — do not enter without permission' },
  unknown:     { label: 'Claim Status Unknown', color: '#94a3b8' },
};

export default function LandAccessPanel({ hotspot }) {
  if (!hotspot) return null;

  const unverified = isUnverifiedQuickPin(hotspot);
  const access = unverified
    ? { label: 'Unverified Pin', color: '#94a3b8', icon: AlertTriangle, desc: 'Not an open collecting site until access metadata is confirmed' }
    : (ACCESS_CONFIG[hotspot.access_status] || ACCESS_CONFIG.unknown);
  const claim = CLAIM_CONFIG[hotspot.claim_type] || CLAIM_CONFIG.unknown;
  const AccessIcon = access.icon;

  const isClosed = hotspot.access_status === 'closed';
  const needsPermit = hotspot.permit_required || hotspot.access_status === 'restricted';

  return (
    <div className="mx-5 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: isClosed
          ? 'hsla(0,60%,14%,0.7)'
          : unverified
          ? 'hsla(220,15%,12%,0.7)'
          : needsPermit
          ? 'hsla(45,60%,14%,0.5)'
          : 'hsla(150,40%,12%,0.5)',
        border: `1px solid ${access.color}40`,
      }}
    >
      {/* Status header bar */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ background: `${access.color}18` }}>
        <AccessIcon size={16} style={{ color: access.color }} />
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: access.color }}>
            {access.label}
          </div>
          <div className="text-white/50 text-[10px] mt-0.5">{access.desc}</div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Seasonal dates */}
        {hotspot.seasonal_dates && (
          <div className="flex items-start gap-2">
            <Clock size={12} className="text-white/40 mt-0.5 shrink-0" />
            <div>
              <span className="text-white/40 text-[10px] uppercase tracking-wider">Season: </span>
              <span className="text-white/70 text-[11px]">{hotspot.seasonal_dates}</span>
            </div>
          </div>
        )}

        {/* Permit requirement */}
        {needsPermit && !unverified && (
          <div className="flex items-start gap-2">
            <FileText size={12} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Permit Required</span>
                {hotspot.permit_cost && (
                  <span className="flex items-center gap-0.5 text-amber-300/70 text-[10px]">
                    <DollarSign size={9} /> {hotspot.permit_cost}
                  </span>
                )}
              </div>
              {hotspot.permit_url && (
                <a href={hotspot.permit_url} target="_blank" rel="noopener noreferrer"
                  className="text-hud-cyan text-[10px] underline mt-0.5 inline-block">
                  Get permit →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Claim status */}
        {hotspot.claim_type && hotspot.claim_type !== 'none' && (
          <div className="flex items-start gap-2">
            <Shield size={12} style={{ color: claim.color }} className="mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: claim.color }}>
                {claim.label}
              </span>
              {claim.desc && <p className="text-white/45 text-[10px] mt-0.5 leading-relaxed">{claim.desc}</p>}
            </div>
          </div>
        )}

        {/* Access notes */}
        {hotspot.access_notes && (
          <div className="flex items-start gap-2">
            <MapPin size={12} className="text-white/40 mt-0.5 shrink-0" />
            <p className="text-white/55 text-[11px] leading-relaxed flex-1">{hotspot.access_notes}</p>
          </div>
        )}

        {/* Collecting rules */}
        {hotspot.collecting_rules && (
          <div className="flex items-start gap-2 pt-2 border-t" style={{ borderColor: 'hsla(255,30%,30%,0.15)' }}>
            <Shield size={12} className="text-emerald-400/70 mt-0.5 shrink-0" />
            <div>
              <span className="text-emerald-400/70 text-[9px] font-bold uppercase tracking-wider">Collecting Rules</span>
              <p className="text-white/55 text-[11px] mt-0.5 leading-relaxed">{hotspot.collecting_rules}</p>
            </div>
          </div>
        )}

        {/* Closed warning */}
        {isClosed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'hsla(0,60%,20%,0.4)', border: '1px solid hsla(0,70%,50%,0.3)' }}>
            <Lock size={12} className="text-rose-400" />
            <span className="text-rose-300 text-[10px] font-semibold">
              This site is currently closed to collecting. Do not enter.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
