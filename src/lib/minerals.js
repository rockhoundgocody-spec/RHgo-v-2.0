/**
 * Baseline implementation for benchmark comparison
 */
export function getAllMineralsBaseline(hotspots) {
  const set = new Set();
  (hotspots || []).forEach(h => (h?.minerals || []).forEach(m => { if (m?.trim()) set.add(m.trim()); }));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Optimized implementation
 */
export function getAllMinerals(hotspots) {
  const set = new Set();
  if (hotspots) {
    for (let i = 0; i < hotspots.length; i++) {
      const mins = hotspots[i]?.minerals;
      if (mins) {
        for (let j = 0; j < mins.length; j++) {
          const m = mins[j];
          if (typeof m === 'string') {
            const trimmed = m.trim();
            if (trimmed.length > 0) {
              set.add(trimmed);
            }
          }
        }
      }
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
