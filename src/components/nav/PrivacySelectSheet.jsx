import React, { useId, useRef, useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/useFocusTrap';

const OPTIONS = [
  { value: 'private', label: 'Private', description: 'Only you can see your locations' },
  { value: 'friends', label: 'Friends only', description: 'Shared with people you follow' },
  { value: 'community', label: 'Community visible', description: 'Visible to all rockhounds' },
];

export default function PrivacySelectSheet({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value) || OPTIONS[0];
  const triggerRef = useRef(null);
  const sheetRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();

  useFocusTrap(sheetRef, {
    active: open,
    onClose: () => setOpen(false),
    onDeactivate: () => triggerRef.current?.focus(),
  });

  return (
    <>
      {/* Trigger row */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={dialogId}
        className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60"
      >
        <div>
          <div className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">Privacy</div>
          <div className="text-white font-medium mt-0.5">{current.label}</div>
        </div>
        <div className="flex items-center gap-1 text-amethyst-glow">
          <span className="text-[11px] font-semibold">Change</span>
          <ChevronRight size={14} />
        </div>
      </button>

      {/* Sheet Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
          <div
            id={dialogId}
            ref={sheetRef}
            className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
            style={{ background: 'hsl(240 20% 8%)' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 id={titleId} className="text-white font-bold text-sm">Location Privacy</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white text-xs px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60"
              >
                Done
              </button>
            </div>
            <div className="p-3 space-y-1.5 max-h-[60vh] overflow-y-auto">
              {OPTIONS.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-checked={isSelected}
                    onClick={() => {
                      onChange?.(opt.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-xl border transition flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/60',
                      isSelected
                        ? 'bg-amethyst-glow/10 border-amethyst-glow/40 text-white'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/70'
                    )}
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{opt.label}</div>
                      <div className="text-[11px] text-white/50 mt-0.5">{opt.description}</div>
                    </div>
                    {isSelected && <Check size={16} className="text-amethyst-glow shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
