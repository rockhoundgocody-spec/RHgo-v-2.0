import React, { useState, useRef } from 'react';
import { HelpCircle, SkipForward, Camera, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function PsvQuestionCard({ question, revisions, onAnswer, onSkip }) {
  const [textVal, setTextVal] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef(null);

  if (!question) return null;
  const { key, question: q, type, options = [] } = question;

  const handlePhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUploading(false);
    onAnswer(key, `Photo uploaded: ${file_url}`);
  };

  return (
    <GlassPanel variant="hud" className="p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-hud-cyan/15 border border-hud-cyan/30 flex items-center justify-center shrink-0">
          <HelpCircle size={15} className="text-hud-cyan" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-hud-cyan/60 mb-1">
            Field Question {revisions + 1}
          </div>
          <div className="text-white text-lg font-semibold leading-snug">{q}</div>
        </div>
      </div>

      {/* Choice — large tap targets */}
      {type === 'choice' && options.length > 0 && (
        <div className="grid gap-2.5">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(key, opt)}
              className="w-full text-left px-5 py-4 rounded-2xl border border-hud-cyan/20 bg-hud-cyan/5 text-white text-base font-medium hover:bg-hud-cyan/15 hover:border-hud-cyan/50 active:scale-[0.98] transition"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Text / Number */}
      {(type === 'text' || type === 'number') && (
        <div className="space-y-2.5">
          <input
            type={type === 'number' ? 'number' : 'text'}
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && textVal.trim() && onAnswer(key, textVal.trim())}
            placeholder="Your answer…"
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white text-base placeholder-white/30 focus:outline-none focus:border-amethyst/50"
            autoFocus
          />
          <button
            onClick={() => { if (textVal.trim()) { onAnswer(key, textVal.trim()); setTextVal(''); } }}
            disabled={!textVal.trim()}
            className="w-full py-4 rounded-2xl bg-amethyst-deep hover:bg-amethyst disabled:opacity-30 text-white font-bold text-base flex items-center justify-center gap-2 transition"
          >
            <Send size={16} /> Submit
          </button>
        </div>
      )}

      {/* Photo request */}
      {type === 'photo' && (
        <div className="space-y-2.5">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={photoUploading}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-hud-cyan/30 text-hud-cyan/70 hover:border-hud-cyan/60 hover:text-hud-cyan flex items-center justify-center gap-2 text-base font-medium transition"
          >
            <Camera size={18} />
            {photoUploading ? 'Uploading…' : 'Take close-up photo'}
          </button>
        </div>
      )}

      {/* Skip — prominent "I don't know" */}
      <button
        onClick={onSkip}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 text-sm font-medium transition"
      >
        <SkipForward size={14} /> I don't know / Not available
      </button>
    </GlassPanel>
  );
}