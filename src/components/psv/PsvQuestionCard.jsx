import React, { useState } from 'react';
import { HelpCircle, SkipForward } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PsvQuestionCard({ question, revisions, onAnswer, onSkip }) {
  const [textVal, setTextVal] = useState('');
  if (!question) return null;
  const { key, question: q, type, options = [] } = question;

  return (
    <GlassPanel variant="hud" className="p-5">
      <div className="flex items-start gap-2 mb-4">
        <HelpCircle size={14} className="text-hud-cyan mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/60 mb-1">Field Question {revisions + 1}</div>
          <div className="text-white text-base font-medium leading-snug">{q}</div>
        </div>
      </div>

      {type === 'choice' && options.length > 0 && (
        <div className="grid gap-2">
          {options.map((opt, i) => (
            <button key={i} onClick={() => onAnswer(key, opt)}
              className="w-full text-left px-4 py-3.5 rounded-xl border border-hud-cyan/20 bg-hud-cyan/5 text-white/85 text-sm hover:bg-hud-cyan/15 hover:border-hud-cyan/50 transition active:scale-[0.98]">
              {opt}
            </button>
          ))}
        </div>
      )}

      {(type === 'text' || type === 'number') && (
        <div className="space-y-2">
          <input type={type} value={textVal} onChange={(e) => setTextVal(e.target.value)}
            placeholder="Type your answer…"
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-white text-base placeholder-white/30 focus:outline-none focus:border-amethyst/50" />
          <button onClick={() => { if (textVal.trim()) { onAnswer(key, textVal.trim()); setTextVal(''); } }}
            disabled={!textVal.trim()}
            className="w-full py-3 rounded-xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-40 text-white font-semibold transition">
            Submit answer
          </button>
        </div>
      )}

      {type === 'photo' && (
        <div className="text-white/50 text-sm italic bg-white/5 rounded-xl px-4 py-3 border border-white/10">
          Take a close-up photo of this area, then re-upload via the photo stage.
        </div>
      )}

      <button onClick={onSkip}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-white/30 hover:text-white/60 transition py-2">
        <SkipForward size={11} /> I don't know / Skip
      </button>
    </GlassPanel>
  );
}