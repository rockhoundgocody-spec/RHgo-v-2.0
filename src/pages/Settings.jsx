import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Lock, MapPin } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications_enabled: true,
    location_tracking: true,
    offline_mode: true,
    data_sync: true,
  });

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const settingsGroups = [
    {
      label: 'Field Mode',
      icon: MapPin,
      items: [
        { key: 'offline_mode', label: 'Offline Mode', desc: 'Work in field without connection' },
        { key: 'data_sync', label: 'Auto-Sync', desc: 'Sync findings when connection returns' },
      ],
    },
    {
      label: 'Notifications',
      icon: Bell,
      items: [
        { key: 'notifications_enabled', label: 'Notifications', desc: 'Scan results, findings, community updates' },
      ],
    },
    {
      label: 'Privacy & Security',
      icon: Lock,
      items: [
        { key: 'location_tracking', label: 'Location Tracking', desc: 'Improve site discovery and locality data' },
      ],
    },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        {settingsGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-amethyst-glow" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">{group.label}</h2>
              </div>

              <div className="space-y-2">
                {group.items.map((item) => (
                  <GlassPanel key={item.key} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`w-12 h-6 rounded-full transition flex items-center px-1 ${
                        settings[item.key]
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-white/10 border border-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full transition ${
                          settings[item.key] ? 'translate-x-6 bg-emerald-400' : 'bg-white/40'
                        }`}
                      />
                    </button>
                  </GlassPanel>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}