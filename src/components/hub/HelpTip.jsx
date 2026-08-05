/**
 * HelpTip — small ? icon that shows a Clover-written pop-up on tap.
 * Usage: <HelpTip tip="What this feature does" />
 */
import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function HelpTip({ tip, size = 13 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center" style={{ verticalAlign: 'middle' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(v => !v); }}
        className="ml-1 text-white/30 hover:text-amethyst transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50 rounded-full"
        aria-label="Help"
        style={{ lineHeight: 1 }}
      >
        <HelpCircle size={size} strokeWidth={1.8} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 mb-2 w-56 rounded-2xl p-3 text-left pointer-events-none"
            style={{
              transform: 'translateX(-50%)',
              background: 'linear-gradient(180deg, hsl(252 22% 14%) 0%, hsl(248 24% 9%) 100%)',
              border: '1px solid hsla(270,50%,60%,0.3)',
              boxShadow: '0 8px 32px hsla(250,60%,4%,0.7), inset 0 1px 0 hsla(270,60%,90%,0.08)',
            }}
          >
            <div className="flex items-start gap-2">
              <span className="text-base select-none shrink-0">🍀</span>
              <p className="text-white/65 text-[11px] leading-snug">{tip}</p>
            </div>
            {/* Caret */}
            <div
              className="absolute left-1/2 -bottom-[6px] w-3 h-3 rotate-45"
              style={{
                transform: 'translateX(-50%) rotate(45deg)',
                background: 'hsl(248 24% 9%)',
                border: '1px solid hsla(270,50%,60%,0.3)',
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}