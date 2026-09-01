import React, { useState } from 'react';
import { Hammer, Sparkles, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { triggerOrbHaptic } from '@/lib/orbAudio';

const TEST_TOOLS = [
  { id: 'fingernail', name: 'Fingernail', hardness: 2.5, icon: '💅', desc: 'Tests soft minerals (Gypsum, Talc)' },
  { id: 'penny',      name: 'Copper Penny', hardness: 3.5, icon: '🪙', desc: 'Tests carbonates (Calcite)' },
  { id: 'knife',      name: 'Steel Knife',  hardness: 5.5, icon: '🔪', desc: 'Standard steel pocketblade' },
  { id: 'glass',      name: 'Glass Plate',  hardness: 6.5, icon: '🪟', desc: 'Hardened silica glass plate' },
  { id: 'quartz',     name: 'Quartz Point', hardness: 7.0, icon: '💎', desc: 'Natural quartz reference point' },
  { id: 'streak',     name: 'Streak Plate', hardness: 6.5, icon: '🪨', desc: 'Unglazed porcelain tile (streak color)' },
];

export default function MohsScratchLab({
  specimenHardness = 7.0,
  mineralName = 'Specimen',
  streakColor = 'White / Colorless',
  isKidMode = false,
}) {
  const [selectedTool, setSelectedTool] = useState(TEST_TOOLS[2]); // Default steel knife
  const [scratchTestResult, setScratchTestResult] = useState(null);
  const [scratchCount, setScratchCount] = useState(0);

  const handleTest = (tool) => {
    setSelectedTool(tool);
    triggerOrbHaptic('tap');
    setScratchCount(c => c + 1);

    if (tool.id === 'streak') {
      setScratchTestResult({
        scratched: false,
        streak: true,
        text: isKidMode
          ? `🎨 Color Chalk Streak! Rubbed on unglazed tile, your rock leaves a cool "${streakColor}" powder line!`
          : `Powder Streak Test: Produced ${streakColor} powder streak on porcelain. Diagnostic for ${mineralName}.`,
      });
      return;
    }

    const scratched = tool.hardness >= specimenHardness;
    if (scratched) {
      setScratchTestResult({
        scratched: true,
        streak: false,
        text: isKidMode
          ? `💥 OUCH! The ${tool.name} cut right into the rock! That means the ${tool.name} won this hardness battle!`
          : `SCRATCH FORMED! The ${tool.name} (${tool.hardness} Mohs) cut a visible groove into the surface. Specimen is softer than or equal to ${tool.hardness} Mohs.`,
      });
    } else {
      setScratchTestResult({
        scratched: false,
        streak: false,
        text: isKidMode
          ? `🛡️ SHIELD BLOCKED! The ${tool.name} glided right off without leaving a single mark! Your rock is too tough to scratch!`
          : `NO SCRATCH (Resisted): The ${tool.name} (${tool.hardness} Mohs) glided across without scratching. Specimen hardness is GREATER than ${tool.hardness} Mohs.`,
      });
    }
  };

  return (
    <div
      className="rounded-2xl p-3.5 space-y-3"
      style={{
        background: 'hsla(240,25%,10%,0.75)',
        border: '1px solid hsla(270,30%,40%,0.25)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1.5">
          <Hammer size={12} /> {isKidMode ? '🎮 Rock Battle Scratch Challenge' : 'Mohs Field Scratch & Streak Lab'}
        </div>
        <span className="text-[9px] font-mono text-white/40">Lab Hardness: {specimenHardness} Mohs</span>
      </div>

      {/* Tool Selector Chips */}
      <div className="grid grid-cols-3 gap-1.5">
        {TEST_TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTest(t)}
            className="p-2 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between"
            style={{
              background: selectedTool.id === t.id ? 'hsla(270,50%,30%,0.5)' : 'hsla(240,20%,14%,0.6)',
              border: selectedTool.id === t.id ? '1px solid hsla(280,80%,60%,0.5)' : '1px solid hsla(270,20%,30%,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{t.icon}</span>
              <span className="text-[8px] font-mono font-bold text-white/50">{t.hardness}M</span>
            </div>
            <div className="text-[10px] font-bold text-white mt-1 leading-tight">{t.name}</div>
          </button>
        ))}
      </div>

      {/* Interactive Scratch Plate Feedback */}
      <div
        className="p-3 rounded-xl relative overflow-hidden"
        style={{
          background: 'hsla(250,30%,8%,0.9)',
          border: '1px solid hsla(0,0%,100%,0.08)',
        }}
      >
        {scratchTestResult ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: scratchTestResult.scratched ? 'hsla(0,70%,40%,0.4)' : 'hsla(160,70%,40%,0.4)',
                  color: scratchTestResult.scratched ? '#f87171' : '#34d399',
                }}
              >
                {scratchTestResult.scratched ? '✗' : '✓'}
              </div>
              <span className="text-xs font-black text-white">
                {selectedTool.name} vs. {mineralName}
              </span>
            </div>
            <p className="text-[11px] text-white/75 leading-relaxed">
              {scratchTestResult.text}
            </p>
          </div>
        ) : (
          <div className="py-2 text-center text-[11px] text-white/40 flex items-center justify-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            Tap any tool above to simulate a field hardness test!
          </div>
        )}
      </div>
    </div>
  );
}
