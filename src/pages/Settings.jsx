import React, { useState, useEffect } from 'react';
import { Bell, Eye, Zap, HardDrive, MapPin, Trash2, Mic2, Shield, Gem, ChevronRight } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import PrivacySelectSheet from '@/components/nav/PrivacySelectSheet.jsx';
import DeleteAccountDialog from '@/components/nav/DeleteAccountDialog.jsx';
import PermissionsPrompt from '@/components/PermissionsPrompt.jsx';
import { dumpAllCaches } from '@/lib/dumpCache.js';

const DEFAULT_VOICE = { rate: 0.92, pitch: 1.18, volume: 0.95 };

function loadVoice() {
  try { return { ...DEFAULT_VOICE, ...JSON.parse(localStorage.getItem('clover_voice') || '{}') }; }
  catch { return DEFAULT_VOICE; }
}

function VoiceSlider({ label, hint, min, max, step, value, onChange }) {
  const inputId = `voice-slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm text-white/70 cursor-pointer">{label}</label>
        <span className="text-xs font-mono text-hud-cyan">{value.toFixed(2)}</span>
      </div>
      <input
        id={inputId}
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-amethyst cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:ring-offset-2 ring-offset-background"
      />
      <p className="text-[11px] text-white/35">{hint}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, iconColor = 'text-white/60', badge }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <Icon size={18} className={iconColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white">{title}</h3>
          {badge && (
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
              style={badge.style}>{badge.text}</span>
          )}
        </div>
        {subtitle && <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    const defaults = {
      notifications: true,
      collectionUpdates: true,
      marketplaceActivity: true,
      locationTracking: false,
      offlineMode: true,
      privacyLevel: 'friends',
    };
    try { return { ...defaults, ...JSON.parse(localStorage.getItem('rhgo_settings') || '{}') }; }
    catch { return defaults; }
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [voice, setVoice] = useState(loadVoice);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const [cacheDumping, setCacheDumping] = useState(false);
  const [cacheDumped, setCacheDumped] = useState(false);

  const handleDumpCache = async () => {
    if (cacheDumping) return;
    setCacheDumping(true);
    await dumpAllCaches();
    setCacheDumping(false);
    setCacheDumped(true);
    setTimeout(() => {
      setCacheDumped(false);
      window.location.reload();
    }, 900);
  };

  const saveVoice = () => {
    localStorage.setItem('clover_voice', JSON.stringify(voice));
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2000);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Hey! How does my voice sound now?");
      u.rate = voice.rate; u.pitch = voice.pitch; u.volume = voice.volume;
      window.speechSynthesis.speak(u);
    }
  };

  const resetVoice = () => setVoice(DEFAULT_VOICE);
  const handleToggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleChange = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const saveSettings = () => {
    localStorage.setItem('rhgo_settings', JSON.stringify(settings));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Real device storage usage — no fabricated numbers
  useEffect(() => {
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(setStorageEstimate).catch(() => {});
    }
  }, []);

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <div className="text-[10px] uppercase tracking-[0.35em] text-white/30 mb-1 font-semibold">Field Controls</div>
        <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
        <p className="text-white/40 text-sm mt-1">Configure your field companion</p>
      </div>

      {/* Pricing / upgrade CTA */}
      <a href="/pricing"
        className="block mb-6 rounded-2xl p-4 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform no-underline"
        style={{
          background: 'linear-gradient(135deg, hsla(270,60%,20%,0.55), hsla(280,80%,15%,0.65))',
          border: '1px solid hsla(280,70%,60%,0.22)',
          boxShadow: '0 4px 24px -8px hsla(270,80%,60%,0.3)',
        }}>
        <div className="flex items-center gap-3">
          <Gem size={16} className="text-amethyst-glow" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white">View Subscription Plans</div>
            <div className="text-white/40 text-xs mt-0.5">Free · Field Pro · Family — see what's included</div>
          </div>
          <ChevronRight size={14} className="text-white/30 flex-shrink-0" />
        </div>
      </a>

      {/* Field Pro banner */}
      <div className="mb-6 rounded-2xl p-4 relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
        style={{
          background: 'linear-gradient(135deg, hsla(270,60%,20%,0.55), hsla(280,80%,15%,0.65))',
          border: '1px solid hsla(280,70%,60%,0.22)',
          boxShadow: '0 4px 24px -8px hsla(270,80%,60%,0.3)',
        }}>
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsla(280,100%,65%,0.1) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div className="flex items-center gap-3 mb-2">
          <Gem size={16} className="text-amethyst-glow" />
          <div className="text-sm font-black text-white">Field Pro Companion</div>
          <div className="ml-auto text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
            style={{ background: 'hsla(280,80%,55%,0.2)', color: 'hsl(280,100%,85%)', border: '1px solid hsla(280,70%,60%,0.3)' }}>
            Now Live
          </div>
        </div>
        <p className="text-white/45 text-xs leading-relaxed ml-7">
          Offline AI identification, advanced rarity heatmaps, unlimited private logs, and priority Clover voice sessions — all designed for serious field work.
        </p>
      </div>

      {/* Permissions prompt */}
      <PermissionsPrompt />

      {/* Stealth Mode & Privacy — elevated as field-critical */}
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
              <PrivacySelectSheet value={settings.privacyLevel} onChange={(v) => handleChange('privacyLevel', v)} />
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

      {/* Notifications */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <SectionHeader icon={Bell} iconColor="text-hud-cyan" title="Notifications" />
          <div className="space-y-2 ml-9">
            {[
              { label: 'Scan results ready', key: 'notifications' },
              { label: 'Collection updates', key: 'collectionUpdates' },
              { label: 'Marketplace activity', key: 'marketplaceActivity' },
            ].map(({ label, key }) => (
              <label key={key} className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1 focus-within:text-white transition">
                <input
                  type="checkbox"
                  checked={!!settings[key]}
                  onChange={() => handleToggle(key)}
                  className="w-4 h-4 rounded border-white/30 accent-amethyst focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
                />
                {label}
              </label>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Field Mode */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <SectionHeader
            icon={Zap}
            iconColor="text-emerald-400"
            title="Field Mode"
            subtitle="Optimised for weak signal and bright outdoor conditions. Keeps scans and maps functional when off-grid."
          />
          <div className="space-y-2 ml-9">
            <label className="flex items-center gap-3 text-sm text-white/60 cursor-pointer py-1 focus-within:text-white transition">
              <input
                type="checkbox"
                checked={settings.offlineMode}
                onChange={() => handleToggle('offlineMode')}
                className="w-4 h-4 rounded border-white/30 accent-amethyst focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2 ring-offset-background"
              />
              Offline mode enabled
            </label>
            <p className="text-xs text-white/30 ml-7 leading-relaxed">
              Field records load from local cache when signal is weak or absent.
            </p>
          </div>
        </GlassPanel>
      </div>

      {/* Storage */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <SectionHeader icon={HardDrive} iconColor="text-hud-cyan" title="Storage" />
          <div className="ml-9 space-y-2">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Local cache</span>
              <span className="font-mono">
                {storageEstimate ? `${Math.round((storageEstimate.usage || 0) / 1048576)} MB` : '—'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: storageEstimate?.quota ? `${Math.min(100, Math.round(((storageEstimate.usage || 0) / storageEstimate.quota) * 100))}%` : '0%',
                background: 'linear-gradient(90deg, hsl(270,80%,55%), hsl(280,100%,70%))',
              }} />
            </div>
            <button
              onClick={handleDumpCache}
              disabled={cacheDumping}
              className="text-xs text-amethyst-glow/70 hover:text-amethyst-glow mt-1 transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background rounded-sm"
            >
              {cacheDumping ? 'Dumping…' : cacheDumped ? '✓ Dumped — reloading' : 'Clear cache'}
            </button>
          </div>
        </GlassPanel>
      </div>

      {/* Site Packs */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <SectionHeader icon={MapPin} iconColor="text-rose-300" title="Saved Site Packs" subtitle="Offline map packs for field-ready exploration without data." />
          <div className="ml-9 text-sm text-white/40 p-2.5 rounded-xl"
            style={{ background: 'hsla(255,20%,12%,0.5)', border: '1px solid hsla(255,20%,30%,0.15)' }}>
            No offline packs saved yet — download map areas from the Explore page to use them without signal.
          </div>
        </GlassPanel>
      </div>

      {/* Clover Voice */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <SectionHeader icon={Mic2} iconColor="text-amethyst-glow" title="Clover 🍀 Voice" subtitle="Tune how Clover sounds in the field. Press Preview to hear the result live." />
          <div className="ml-9 space-y-5">
            <VoiceSlider label="Speed" hint="0.5 = slow & deliberate · 1.0 = natural · 1.5 = quick" min={0.5} max={1.5} step={0.01} value={voice.rate} onChange={(v) => setVoice((p) => ({ ...p, rate: v }))} />
            <VoiceSlider label="Pitch" hint="0.8 = deeper · 1.0 = neutral · 1.5 = higher / more expressive" min={0.8} max={1.5} step={0.01} value={voice.pitch} onChange={(v) => setVoice((p) => ({ ...p, pitch: v }))} />
            <VoiceSlider label="Volume" hint="0.5 = quiet · 1.0 = full" min={0.5} max={1.0} step={0.01} value={voice.volume} onChange={(v) => setVoice((p) => ({ ...p, volume: v }))} />
            <div className="flex gap-3 pt-1">
              <button onClick={saveVoice}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60 focus-visible:ring-offset-2 ring-offset-background"
                style={{ background: 'hsla(270,60%,30%,0.5)', border: '1px solid hsla(280,60%,55%,0.35)' }}>
                {voiceSaved ? '✓ Saved!' : 'Preview & Save'}
              </button>
              <button onClick={resetVoice}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 ring-offset-background">
                Reset
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Save button */}
      <button onClick={saveSettings}
        className="w-full py-3.5 rounded-2xl font-black text-white text-sm transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow focus-visible:ring-offset-2 ring-offset-background"
        style={{ background: 'linear-gradient(135deg, hsl(265,70%,48%), hsl(280,90%,60%))', boxShadow: '0 6px 28px -6px hsla(270,80%,60%,0.5)' }}>
        {settingsSaved ? '✓ Settings Saved' : 'Save Settings'}
      </button>

      {/* Danger zone */}
      <div className="mt-8 mb-6">
        <GlassPanel className="p-4" style={{ borderColor: 'hsla(0,80%,50%,0.15)' }}>
          <SectionHeader icon={Trash2} iconColor="text-rose-400" title="Danger Zone" subtitle="Permanently delete your account and all associated field data. This action cannot be undone." />
          <button onClick={() => setShowDeleteDialog(true)}
            className="ml-9 px-4 py-2.5 rounded-xl text-rose-400 text-sm font-semibold transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background"
            style={{ background: 'hsla(0,80%,50%,0.08)', border: '1px solid hsla(0,80%,50%,0.22)' }}>
            Delete Account
          </button>
        </GlassPanel>
      </div>

      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
    </div>
  );
}