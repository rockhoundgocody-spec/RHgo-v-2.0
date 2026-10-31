import React from 'react';

/** One alert group with its own switch. */
export default function AlertCategoryToggle({ label, hint, enabled, disabled, onToggle }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-white/80">{label}</div>
        <div className="text-[10px] text-white/35 leading-relaxed">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        disabled={disabled}
        onClick={onToggle}
        className="relative w-9 h-5 rounded-full shrink-0 transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
        style={{ background: enabled ? '#9FE8D0' : 'hsla(0,0%,100%,0.12)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: enabled ? '#0a0a14' : 'hsla(0,0%,100%,0.7)',
            transform: enabled ? 'translateX(16px)' : 'none',
          }}
        />
      </button>
    </div>
  );
}