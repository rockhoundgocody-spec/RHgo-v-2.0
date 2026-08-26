import React, { useEffect, useId, useRef, useState } from 'react';
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
  const triggerRef = useRef(null);
  const sheetRef = useRef(null);
  const dialogId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const sheet = sheetRef.current;
    const focusable = () => Array.from(sheet?.querySelectorAll('button:not([disabled])') || []);
    const selected = sheet?.querySelector('[aria-checked="true"]');
    (selected || focusable()[0] || sheet)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = focusable();
      if (controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      {/* Trigger row */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
      >
        <span>{current.label}</span>
        <ChevronRight size={14} className="text-white/40" aria-hidden="true" />
      </button>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
          <div
            ref={sheetRef}
            id={dialogId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="relative rounded-t-2xl overflow-hidden"
            style={{ background: 'hsl(240 20% 10%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-4 pb-2 pt-1">
              <div id={titleId} className="text-[11px] uppercase tracking-[0.3em] text-white/40 font-mono text-center mb-3">
                Location Privacy
              </div>
              <div className="space-y-1" role="radiogroup" aria-labelledby={titleId}>
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={value === opt.value}
                    onClick={() => { onChange(opt.value); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/70',
                      value === opt.value
                        ? 'bg-amethyst/20 border border-amethyst/40'
                        : 'hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{opt.label}</div>
                      <div className="text-xs text-white/50 mt-0.5">{opt.description}</div>
                    </div>
                    {value === opt.value && <Check size={16} className="text-amethyst-glow shrink-0" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 pb-8 pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
