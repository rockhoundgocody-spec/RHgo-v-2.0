import React from 'react';
import { Shield } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import PrivacySelectSheet from '@/components/nav/PrivacySelectSheet.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function StealthPrivacySection({ privacyLevel, onChange }) {
  return (
    <div className="mb-6">
      <GlassPanel className="p-4" style={{ borderColor: 'hsla(160,70%,45%,0.22)' }}>
        <SectionHeader
          icon={Shield}
          iconColor="text-emerald-400"
          title="Stealth Mode & Privacy"
          subtitle="Your coordinates. Your secret. Choose exactly how your finds appear to the community."
          badge={{
            text: 'Field Critical',
            style: { background: 'hsla(160,70%,12%,0.6)', color: 'hsl(160,80%,65%)', border: '1px solid hsla(160,70%,45%,0.3)' }
          }}
        />
        <div className="ml-9 space-y-4">
          {/* Privacy level selector */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-[0.2em] font-mono mb-2">Location Privacy Level</label>
            <PrivacySelectSheet value={privacyLevel} onChange={onChange} />
          </div>
          {/* Privacy tier explainer */}
          <div className="space-y-2">
            {[
              { tier: 'Private — Exact', icon: '🔒', desc: 'Exact GPS stored privately. Never visible to anyone else.', color: '#34d399' },
              { tier: 'Public Fuzzed', icon: '📍', desc: 'Community sees a ~2km radius. Your real spot stays hidden.', color: '#38bdf8' },
              { tier: 'Region Only', icon: '🗺️', desc: 'Only county/region shown. Great for sensitive ecosystems.', color: '#a78bfa' },
              { tier: 'Hidden Sensitive', icon: '🛡️', desc: 'Site fully removed from public view. For protected or private land.', color: '#fbbf24' },
            ].map(({ tier, icon, desc, color }) => (
              <div key={tier} className="flex items-start gap-2.5 p-2.5 rounded-xl"
                style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color }}>{tier}</div>
                  <div className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-white/25 leading-relaxed">
            🛡 Exact coordinates are never shared publicly unless you explicitly choose "public exact." Sensitive archaeological or rare mineral sites are always hidden from community maps regardless of your setting.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
