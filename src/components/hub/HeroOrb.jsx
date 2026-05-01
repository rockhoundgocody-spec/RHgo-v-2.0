import React, { useState, useRef } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import { useSpeechSynthesis } from '@/components/oracle/useSpeech';

const pokeLines = [
  "Please don't poke me.",
  "Hey — I'm trying to meditate.",
  "Ouch. Rude.",
  "I am not a button.",
  "Poke me again and I'll turn you to quartz.",
];

export default function HeroOrb() {
  const [poke, setPoke] = useState(null);
  const { speak, speaking } = useSpeechSynthesis();
  const timerRef = useRef(null);

  const handlePoke = () => {
    const line = pokeLines[Math.floor(Math.random() * pokeLines.length)];
    const id = Date.now();
    setPoke({ id, line });
    speak(line);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setPoke((p) => (p && p.id === id ? null : p));
    }, 2500);
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* concave shadow ring beneath orb */}
      <div
        className="absolute -bottom-6 w-72 h-12 rounded-[50%] blur-2xl opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, hsla(280,100%,50%,0.45) 0%, transparent 70%)',
        }}
      />
      <div className="relative">
        <button
          onClick={handlePoke}
          aria-label="Poke the orb"
          className="rounded-full transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-amethyst-glow/60"
        >
          <AmethystOrb size={260} speaking={speaking || !!poke} />
        </button>

        {poke && (
          <div
            key={poke.id}
            className="absolute left-1/2 -translate-x-1/2 -top-6 px-3 py-1.5 rounded-full glass-panel text-white text-xs whitespace-nowrap animate-poke-bubble pointer-events-none"
          >
            {poke.line}
          </div>
        )}
      </div>
    </div>
  );
}