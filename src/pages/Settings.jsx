import React, { useState } from 'react';
import { Bell, Lock, Eye, Zap, HardDrive, MapPin } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: false,
    offlineMode: true,
    privacyLevel: 'friends'
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-white/50 text-sm mt-2">Customize your RockHound-GO experience</p>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={18} className="text-hud-cyan" />
            <h3 className="font-bold text-white">Notifications</h3>
          </div>
          <div className="space-y-2 ml-9">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleToggle('notifications')}
                className="w-4 h-4 rounded border-white/30"
              />
              Scan results ready
            </label>
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/30" />
              Collection updates
            </label>
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/30" />
              Marketplace activity
            </label>
          </div>
        </GlassPanel>
      </div>

      {/* Privacy */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Eye size={18} className="text-amethyst-glow" />
            <h3 className="font-bold text-white">Privacy</h3>
          </div>
          <div className="ml-9 space-y-3">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-[0.2em] font-mono mb-2">
                Location Privacy
              </label>
              <select
                value={settings.privacyLevel}
                onChange={(e) => handleChange('privacyLevel', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:border-amethyst/50"
              >
                <option value="private">Private (only me)</option>
                <option value="friends">Friends only</option>
                <option value="community">Community visible</option>
              </select>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Field Mode */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={18} className="text-emerald-400" />
            <h3 className="font-bold text-white">Field Mode</h3>
          </div>
          <div className="space-y-2 ml-9">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.offlineMode}
                onChange={() => handleToggle('offlineMode')}
                className="w-4 h-4 rounded border-white/30"
              />
              Offline mode enabled
            </label>
            <p className="text-xs text-white/40 ml-6">
              Keep scans, maps, and collections working without network signal.
            </p>
          </div>
        </GlassPanel>
      </div>

      {/* Storage */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive size={18} className="text-hud-cyan" />
            <h3 className="font-bold text-white">Storage</h3>
          </div>
          <div className="ml-9 space-y-2">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Local cache</span>
              <span className="font-mono">245 MB</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-amethyst/60" style={{ width: '65%' }} />
            </div>
            <button className="text-xs text-amethyst hover:text-amethyst-glow mt-2">Clear cache</button>
          </div>
        </GlassPanel>
      </div>

      {/* Site Packs */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <MapPin size={18} className="text-rose-300" />
            <h3 className="font-bold text-white">Saved Site Packs</h3>
          </div>
          <div className="ml-9 space-y-2 text-sm text-white/60">
            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span>Colorado hotspots</span>
              <span className="text-xs text-white/40">42 MB</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5">
              <span>Utah field regions</span>
              <span className="text-xs text-white/40">38 MB</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Save button */}
      <button className="w-full py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-bold transition">
        Save Settings
      </button>
    </div>
  );
}