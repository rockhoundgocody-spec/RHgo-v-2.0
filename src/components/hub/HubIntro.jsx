import React from 'react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import { Mic, Compass, Gem, Moon, Sparkles } from 'lucide-react';

const items = [
  {
    icon: Mic,
    title: 'Clover 🍀 Cole',
    desc: 'Tap the orb to talk to Clover, your AI rockhounding companion. She listens, replies, and remembers your conversations.',
  },
  {
    icon: Sparkles,
    title: 'Voiceprint Ring',
    desc: "The waveform around the orb pulses with Clover's voice when she speaks and your voice when you talk.",
  },
  {
    icon: Compass,
    title: 'Field Command',
    desc: 'Type or speak a field goal — "find fluorite near me" — and the AI routes you to the right tool instantly.',
  },
  {
    icon: Gem,
    title: 'Daily Check-In',
    desc: 'Tell Clover how you feel each day. Your mood and intention shape her energy and how she speaks to you.',
  },
  {
    icon: Moon,
    title: 'Celestial Dial',
    desc: 'Shows the live moon phase and sun altitude — useful for planning night digs and dawn scouts.',
  },
];

export default function HubIntro() {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-hud-cyan/70">
          Field Briefing
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-hud-cyan/40 to-transparent" />
      </div>

      <GlassPanel>
        <div className="p-5">
          <p className="text-white/75 text-sm leading-relaxed mb-5">
            Welcome to the Hub — your live field console. Clover 🍀 Cole is your AI rockhounding companion;
            everything orbiting her is a live readout of the world around you.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-amethyst/15 border border-amethyst/25 flex items-center justify-center">
                  <Icon size={16} className="text-amethyst" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold leading-tight">{title}</div>
                  <div className="text-white/55 text-xs leading-relaxed mt-0.5">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-amethyst/70 text-xs mt-5 leading-relaxed">
            Below: the Mission Console launches the four core tools. Field Telemetry shows your collector stats.
          </p>
        </div>
      </GlassPanel>
    </section>
  );
}