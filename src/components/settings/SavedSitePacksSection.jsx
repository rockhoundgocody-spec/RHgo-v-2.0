import React from 'react';
import { MapPin } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function SavedSitePacksSection() {
  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={MapPin}
          iconColor="text-rose-300"
          title="Saved Site Packs"
          subtitle="Offline map packs for field-ready exploration without data."
        />
        <div
          className="ml-9 text-sm text-white/40 p-2.5 rounded-xl"
          style={{ background: 'hsla(255,20%,12%,0.5)', border: '1px solid hsla(255,20%,30%,0.15)' }}
        >
          No offline packs saved yet — download map areas from the Explore page to use them without signal.
        </div>
      </GlassPanel>
    </div>
  );
}
