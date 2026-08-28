import React, { useEffect, useRef, useState } from 'react';
import { Mic2 } from 'lucide-react';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';

const DEFAULT_VOICE = { voice: 'honey', rate: 0.95, pitch: 1.0, volume: 0.95 };
const VOICE_PERSONAS = [
  { id: 'honey', label: 'Clover', desc: 'Irish lilt · educated' },
  { id: 'river', label: 'River', desc: 'American · calm' },
  { id: 'sunny', label: 'Sunny', desc: 'American · bright' },
  { id: 'storm', label: 'Storm', desc: 'American · steady' },
  { id: 'spark', label: 'Spark', desc: 'American · lively' },
];

function loadVoice() {
  if (typeof localStorage === 'undefined') return DEFAULT_VOICE;
  try {
    return { ...DEFAULT_VOICE, ...JSON.parse(localStorage.getItem('clover_voice') || '{}') };
  } catch {
    return DEFAULT_VOICE;
  }
}

function VoiceSlider({ id, label, hint, min, max, step, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-white/70">{label}</label>
        <span className="text-xs font-mono text-hud-cyan">{value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-amethyst cursor-pointer focus-visible:ring-2 focus-visible:ring-amethyst-glow/70"
      />
      <p className="text-[11px] text-white/35">{hint}</p>
    </div>
  );
}

export default function CloverVoiceSection() {
  const [voice, setVoice] = useState(loadVoice);
  const [voiceSaved, setVoiceSaved] = useState(false);
  const savedTimer = useRef(null);
  const { speak: previewSpeak, speaking } = useSpeechSynthesis();

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const saveVoice = () => {
    try {
      localStorage.setItem('clover_voice', JSON.stringify(voice));
    } catch {}
    setVoiceSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setVoiceSaved(false), 2000);
    previewSpeak('Hey! How does my voice sound now?');
  };

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
          <div className="space-y-1.5">
            <div className="text-sm text-white/70 font-medium">Voice Persona</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Voice persona">
              {VOICE_PERSONAS.map((persona) => {
                const selected = (voice.voice || 'honey') === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setVoice((previous) => ({ ...previous, voice: persona.id }))}
                    className="p-2.5 rounded-xl text-left transition border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70 motion-reduce:transition-none"
                    style={{
                      background: selected ? 'hsla(270,70%,40%,0.35)' : 'hsla(255,20%,12%,0.4)',
                      borderColor: selected ? 'hsla(280,80%,65%,0.6)' : 'hsla(255,20%,30%,0.2)',
                    }}
                  >
                    <span className="text-xs font-bold text-white flex items-center justify-between">
                      {persona.label}
                      {selected && <span className="text-[10px] text-amethyst-glow font-mono" aria-hidden="true">✓</span>}
                    </span>
                    <span className="block text-[10px] text-white/40 mt-0.5">{persona.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <VoiceSlider id="clover-voice-rate" label="Speed" hint="0.5 = slow & deliberate · 1.0 = natural · 1.5 = quick" min={0.5} max={1.5} step={0.01} value={voice.rate} onChange={(value) => setVoice((previous) => ({ ...previous, rate: value }))} />
          <VoiceSlider id="clover-voice-pitch" label="Pitch" hint="0.8 = deeper · 1.0 = neutral · 1.5 = higher / more expressive" min={0.8} max={1.5} step={0.01} value={voice.pitch} onChange={(value) => setVoice((previous) => ({ ...previous, pitch: value }))} />
          <VoiceSlider id="clover-voice-volume" label="Volume" hint="0.5 = quiet · 1.0 = full" min={0.5} max={1} step={0.01} value={voice.volume} onChange={(value) => setVoice((previous) => ({ ...previous, volume: value }))} />
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={saveVoice}
              aria-busy={speaking}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm transition active:scale-95 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70 motion-reduce:transform-none"
              style={{ background: 'hsla(270,60%,30%,0.5)', border: '1px solid hsla(280,60%,55%,0.35)' }}
            >
              <span aria-live="polite">{voiceSaved ? '✓ Saved!' : 'Preview & Save'}</span>
            </button>
            <button
              type="button"
              onClick={() => setVoice(DEFAULT_VOICE)}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 text-sm transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Reset
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}