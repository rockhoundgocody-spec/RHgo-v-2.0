import React from 'react';

/**
 * Branded skeleton loader for RHGO cards.
 * Usage: <SkeletonCard lines={2} hasImage />
 */
export function SkeletonCard({ hasImage = false, lines = 2, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden animate-pulse ${className}`}
      style={{ background: 'hsla(255,25%,14%,0.7)', border: '1px solid hsla(270,20%,30%,0.15)' }}>
      {hasImage && (
        <div className="aspect-square w-full" style={{ background: 'hsla(255,25%,20%,0.5)' }} />
      )}
      <div className="p-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-2.5 rounded-full"
            style={{
              background: 'hsla(270,20%,28%,0.5)',
              width: i === 0 ? '70%' : i === lines - 1 ? '45%' : '90%',
            }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-4 animate-pulse flex items-center gap-3"
          style={{ background: 'hsla(255,25%,14%,0.7)', border: '1px solid hsla(270,20%,30%,0.15)' }}>
          <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'hsla(270,20%,28%,0.5)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 rounded-full" style={{ background: 'hsla(270,20%,28%,0.5)', width: '60%' }} />
            <div className="h-2 rounded-full" style={{ background: 'hsla(270,20%,22%,0.5)', width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4, cols = 2 }) {
  return (
    <div className={`grid grid-cols-${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} hasImage lines={2} />
      ))}
    </div>
  );
}