import React, { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const THRESHOLD = 64;

export default function PullToRefresh({ onRefresh, children, className }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startYRef.current === null || refreshing) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      e.preventDefault();
      setPullY(Math.min(dy * 0.5, THRESHOLD + 20));
    }
  }, [refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullY >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    startYRef.current = null;
  }, [pullY, refreshing, onRefresh]);

  const progress = Math.min(pullY / THRESHOLD, 1);
  const showing = pullY > 4 || refreshing;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Pull indicator */}
      <div
        className="absolute inset-x-0 top-0 flex items-center justify-center pointer-events-none z-10 transition-all duration-200"
        style={{ height: showing ? Math.max(pullY, refreshing ? THRESHOLD : 0) : 0, opacity: showing ? 1 : 0 }}
      >
        <div
          className="w-8 h-8 rounded-full glass-panel flex items-center justify-center"
          style={{ transform: `scale(${0.5 + progress * 0.5})` }}
        >
          {refreshing ? (
            <Loader2 size={14} className="text-amethyst-glow animate-spin" />
          ) : (
            <div
              className="w-3 h-3 rounded-full border-2 border-amethyst-glow"
              style={{ opacity: progress }}
            />
          )}
        </div>
      </div>

      <div style={{ transform: `translateY(${refreshing ? THRESHOLD : pullY}px)`, transition: refreshing || pullY === 0 ? 'transform 0.2s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}