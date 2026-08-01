import React from 'react';
import { Bell } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

export default function NotificationsSection({ settings, onToggle }) {
  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader icon={Bell} iconColor="text-hud-cyan" title="Notifications" />
        <div className="space-y-2 ml-9">
          {[
            { label: 'Scan results ready', key: 'notifications' },
            { label: 'Collection updates', key: 'collectionUpdates' },
            { label: 'Marketplace activity', key: 'marketplaceActivity' },
          ].map(({ label, key }) => (
            <label key={key} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={!!settings[key]}
                onChange={() => onToggle(key)}
                className="w-4 h-4 rounded border-white/30 accent-amethyst"
              />
              {label}
            </label>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
