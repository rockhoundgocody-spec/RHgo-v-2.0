import React, { useState } from 'react';
import { Mic2 } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

const DEFAULT_VOICE = { rate: 0.92, pitch: 1.18, volume: 0.95 };

function loadVoice() {
  try {
    return { ...DEFAULT_VOICE, ...JSON.parse(localStorage.getItem('clover_voice') || '{}') };
  } catch {
    return DEFAULT_VOICE;
  }
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
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-amethyst cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
      />
      <p className="text-[11px] text-white/35">{hint}</p>
    </div>
  );
}

export default function CloverVoiceSection() {
  const [voice, setVoice] = useState(loadVoice);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const saveVoice = () => {
    localStorage.setItem('clover_voice', JSON.stringify(voice));
    setVoiceSaved(true);
    setTimeout(() => setVoiceSaved(false), 2000);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Hey! How does my voice sound now?");
      u.rate = voice.rate; u.pitch = voice.pitch; u.volume = voice.volume;
      window.speechSynthesis.speak(u);
    }
  };

  const resetVoice = () => setVoice(DEFAULT_VOICE);

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={Mic2}
          iconColor="text-amethyst-glow"
          title="Clover 🍀 Voice"
          subtitle="Tune how Clover sounds in the field. Press Preview to hear the result live."
        />
        <div className="ml-9 space-y-5">
          <VoiceSlider
            label="Speed"
            hint="0.5 = slow & deliberate · 1.0 = natural · 1.5 = quick"
            min={0.5}
            max={1.5}
            step={0.01}
            value={voice.rate}
            onChange={(v) => setVoice((p) => ({ ...p, rate: v }))}
          />
          <VoiceSlider
            label="Pitch"
            hint="0.8 = deeper · 1.0 = neutral · 1.5 = higher / more expressive"
            min={0.8}
            max={1.5}
            step={0.01}
            value={voice.pitch}
            onChange={(v) => setVoice((p) => ({ ...p, pitch: v }))}
          />
          <VoiceSlider
            label="Volume"
            hint="0.5 = quiet · 1.0 = full"
            min={0.5}
            max={1.0}
            step={0.01}
            value={voice.volume}
            onChange={(v) => setVoice((p) => ({ ...p, volume: v }))}
          />
          <div className="flex gap-3 pt-1">
            <button
              onClick={saveVoice}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm transition active:scale-95 select-none cursor-pointer hover:bg-amethyst/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
              style={{ background: 'hsla(270,60%,30%,0.5)', border: '1px solid hsla(280,60%,55%,0.35)' }}
            >
              {voiceSaved ? '✓ Saved!' : 'Preview & Save'}
            </button>
            <button
              onClick={resetVoice}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm transition select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 focus-visible:ring-offset-2 ring-offset-background"
            >
              Reset
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
