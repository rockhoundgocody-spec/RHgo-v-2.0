import React, { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'private', label: 'Private', description: 'Only you can see your locations' },
  { value: 'friends', label: 'Friends only', description: 'Shared with people you follow' },
  { value: 'community', label: 'Community visible', description: 'Visible to all rockhounds' },
];

export default function PrivacySelectSheet({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value) || OPTIONS[0];

  return (
    <>
      {/* Trigger row */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm select-none"
      >
        <span>{current.label}</span>
        <ChevronRight size={14} className="text-white/40" />
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          <div
            className="relative rounded-t-2xl overflow-hidden"
            style={{ background: 'hsl(240 20% 10%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pb-2 pt-1">
              <div className="text-[11px] uppercase tracking-[0.3em] text-white/40 font-mono text-center mb-3">
                Location Privacy
              </div>
              <div className="space-y-1">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl transition select-none',
                      value === opt.value
                        ? 'bg-amethyst/20 border border-amethyst/40'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{opt.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{opt.description}</div>
                    </div>
                    {value === opt.value && <Check size={16} className="text-amethyst-glow shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-8 pt-3">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm select-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}