function hashSeed(seed) {
  let hash = 2166136261;
  for (const character of String(seed ?? 'badge')) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createStarField(count, seed) {
  let state = hashSeed(seed);
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  return Array.from({ length: Math.max(0, count) }, () => ({
    x: random() * 100,
    y: random() * 100,
    size: random() * 1.5 + 0.5,
    opacity: random() * 0.25 + 0.05,
  }));
}
