import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Gem } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PermissionsPrompt from '@/components/PermissionsPrompt.jsx';
import CloverVoiceSection from '@/components/settings/CloverVoiceSection.jsx';
import DangerZoneSection from '@/components/settings/DangerZoneSection.jsx';
import FieldModeSection from '@/components/settings/FieldModeSection.jsx';
import NotificationsSection from '@/components/settings/NotificationsSection.jsx';
import SavedSitePacksSection from '@/components/settings/SavedSitePacksSection.jsx';
import StealthPrivacySection from '@/components/settings/StealthPrivacySection.jsx';
import StorageSection from '@/components/settings/StorageSection.jsx';
import WakeWordSection from '@/components/settings/WakeWordSection.jsx';

const DEFAULT_SETTINGS = {
  notifications: true,
  collectionUpdates: true,
  marketplaceActivity: true,
  locationTracking: false,
  offlineMode: true,
  privacyLevel: 'friends',
};

function loadSettings() {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('rhgo_settings') || '{}') };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const savedTimer = useRef(null);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const handleToggle = (key) => setSettings((previous) => ({ ...previous, [key]: !previous[key] }));
  const handleChange = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }));

  const saveSettings = async () => {
    try {
      localStorage.setItem('rhgo_settings', JSON.stringify(settings));
      // Also persist to the user profile so settings survive device switches.
      await base44.auth.updateMe({ app_settings: settings }).catch(() => {});
    } catch {}
    setSettingsSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSettingsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-1 font-semibold">Field Controls</div>
        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Configure your field companion</p>
      </div>

      <a
        href="/pricing"
        className="block mb-6 rounded-2xl p-4 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70 motion-reduce:transform-none"
        style={{
          background: 'linear-gradient(135deg, hsla(270,60%,20%,0.55), hsla(280,80%,15%,0.65))',
          border: '1px solid hsla(280,70%,60%,0.22)',
          boxShadow: '0 4px 24px -8px hsla(270,80%,60%,0.3)',
        }}
      >
        <div className="flex items-center gap-3">
          <Gem size={16} className="text-amethyst-glow" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white">View Subscription Plans</div>
            <div className="text-white/40 text-xs mt-0.5">Free · Field Pro · Family — see what&apos;s included</div>
          </div>
          <ChevronRight size={14} className="text-white/30 flex-shrink-0" aria-hidden="true" />
        </div>
      </a>

      <div
        className="mb-6 rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsla(270,60%,20%,0.55), hsla(280,80%,15%,0.65))',
          border: '1px solid hsla(280,70%,60%,0.22)',
          boxShadow: '0 4px 24px -8px hsla(270,80%,60%,0.3)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsla(280,100%,65%,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="flex items-center gap-3 mb-2">
          <Gem size={16} className="text-amethyst-glow" aria-hidden="true" />
          <div className="text-sm font-black text-white">Field Pro Companion</div>
          <div
            className="ml-auto text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ background: 'hsla(280,80%,55%,0.2)', color: 'hsl(280,100%,85%)', border: '1px solid hsla(280,70%,60%,0.3)' }}
          >
            Now Live
          </div>
        </div>
        <p className="text-white/45 text-xs leading-relaxed ml-7">
          Offline AI identification, advanced rarity heatmaps, unlimited private logs, and priority Clover voice sessions — all designed for serious field work.
        </p>
      </div>

      <PermissionsPrompt />
      <StealthPrivacySection privacyLevel={settings.privacyLevel} onChange={(value) => handleChange('privacyLevel', value)} />
      <NotificationsSection settings={settings} onToggle={handleToggle} />
      <FieldModeSection offlineMode={settings.offlineMode} onToggle={() => handleToggle('offlineMode')} />
      <StorageSection />
      <SavedSitePacksSection />
      <CloverVoiceSection />
      <WakeWordSection />

      <button
        type="button"
        onClick={saveSettings}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70 motion-reduce:transform-none"
        style={{ background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))', boxShadow: '0 6px 28px -6px hsla(270,80%,60%,0.5)' }}
      >
        <span aria-live="polite">{settingsSaved ? '✓ Settings Saved' : 'Save Settings'}</span>
      </button>

      <DangerZoneSection />
    </div>
  );
}