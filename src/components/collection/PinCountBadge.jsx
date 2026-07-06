import React from 'react';

export default function PinCountBadge({ count }) {
  return (
    <div className="absolute top-3 right-3 glass-panel px-3 py-1.5 rounded-full text-[11px] text-amethyst-glow font-mono">
      {count} pin{count !== 1 ? 's' : ''}
    </div>
  );
}
