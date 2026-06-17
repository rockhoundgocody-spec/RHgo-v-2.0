import React, { useState } from 'react';
import { Bell, Eye, Zap, HardDrive, MapPin, Trash2, Mic2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import PrivacySelectSheet from '@/components/nav/PrivacySelectSheet.jsx';
import DeleteAccountDialog from '@/components/nav/DeleteAccountDialog.jsx';
import PermissionsPrompt from '@/components/PermissionsPrompt.jsx';

const DEFAULT_VOICE = { rate: 0.92, pitch: 1.18, volume: 0.95 };

function loadVoice() {
  try { return { ...DEFAULT_VOICE, ...JSON.parse(localStorage.getItem('clover_voice') || '{}') }; }
  catch { return DEFAULT_VOICE; }
}

function VoiceSlider({ label, hint, min, max, step, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <span className="text-xs font-mono text-hud-cyan">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-amethyst cursor-pointer"
      />
      <p className="text-[11px] text-white/35">{hint}</p>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    locationTracking: false,
    offlineMode: true,
    privacyLevel: 'friends'
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [voice, setVoice] = useState(loadVoice);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const saveVoice = () => {
    localStorage.setItem('clover_voice', JSON.stringify(voice));
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2000);
    // Quick preview
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Hey! How does my voice sound now?");
      u.rate = voice.rate; u.pitch = voice.pitch; u.volume = voice.volume;
      window.speechSynthesis.speak(u);
    }
  };

  const resetVoice = () => setVoice(DEFAULT_VOICE);

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

      {/* Permissions prompt */}
      <PermissionsPrompt />

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
              <PrivacySelectSheet
                value={settings.privacyLevel}
                onChange={(v) => handleChange('privacyLevel', v)}
              />
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

      {/* Clover Voice */}
      <div className="mb-6">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 mb-1">
            <Mic2 size={18} className="text-amethyst-glow" />
            <h3 className="font-bold text-white">Clover 🍀 Voice</h3>
          </div>
          <p className="text-xs text-white/40 ml-9 mb-4">
            Tune how Clover sounds. Press "Preview" to hear the result live.
          </p>
          <div className="ml-9 space-y-5">
            <VoiceSlider
              label="Speed"
              hint="0.5 = slow & deliberate · 1.0 = natural · 1.5 = quick"
              min={0.5} max={1.5} step={0.01}
              value={voice.rate}
              onChange={(v) => setVoice((p) => ({ ...p, rate: v }))}
            />
            <VoiceSlider
              label="Pitch"
              hint="0.8 = deeper · 1.0 = neutral · 1.5 = higher / more expressive"
              min={0.8} max={1.5} step={0.01}
              value={voice.pitch}
              onChange={(v) => setVoice((p) => ({ ...p, pitch: v }))}
            />
            <VoiceSlider
              label="Volume"
              hint="0.5 = quiet · 1.0 = full"
              min={0.5} max={1.0} step={0.01}
              value={voice.volume}
              onChange={(v) => setVoice((p) => ({ ...p, volume: v }))}
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={saveVoice}
                className="flex-1 py-2 rounded-lg bg-amethyst/30 hover:bg-amethyst/50 border border-amethyst/40 text-white text-sm font-semibold transition select-none"
              >
                {voiceSaved ? '✓ Saved!' : 'Preview & Save'}
              </button>
              <button
                onClick={resetVoice}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm transition select-none"
              >
                Reset
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Save button */}
      <button className="w-full py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst text-white font-bold transition select-none">
        Save Settings
      </button>

      {/* Danger zone */}
      <div className="mt-8 mb-6">
        <GlassPanel className="p-4 border border-rose-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 size={18} className="text-rose-400" />
            <h3 className="font-bold text-white">Danger Zone</h3>
          </div>
          <p className="text-xs text-white/50 ml-9 mb-3">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="ml-9 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition select-none"
          >
            Delete Account
          </button>
        </GlassPanel>
      </div>

      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
    </div>
  );
}