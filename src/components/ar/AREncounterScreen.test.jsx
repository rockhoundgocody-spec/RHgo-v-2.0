import { describe, it, expect } from 'vitest';

function filterParticlesArray(existingParticles, newP) {
  return existingParticles.filter(x => !newP.find(n => n.id === x.id));
}

function filterParticlesSet(existingParticles, newP) {
  const newIds = new Set(newP.map(n => n.id));
  return existingParticles.filter(x => !newIds.has(x.id));
}

describe('Particle Filter Logic', () => {
  it('correctly filters out particles matching newP IDs', () => {
    const existingParticles = [
      { id: 1, color: 'red' },
      { id: 2, color: 'blue' },
      { id: 3, color: 'green' },
      { id: 4, color: 'yellow' },
    ];
    const newP = [
      { id: 2, color: 'blue' },
      { id: 4, color: 'yellow' },
    ];

    const resultArray = filterParticlesArray(existingParticles, newP);
    const resultSet = filterParticlesSet(existingParticles, newP);

    expect(resultArray).toEqual([{ id: 1, color: 'red' }, { id: 3, color: 'green' }]);
    expect(resultSet).toEqual(resultArray);
  });

  it('benchmark performance comparison', () => {
    // Generate 5000 existing particles and 1000 new particles to remove
    const existingParticles = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
    const newP = Array.from({ length: 1000 }, (_, i) => ({ id: i * 2 })); // remove even IDs from 0..1998

    const iterations = 50;

    const startArray = performance.now();
    for (let i = 0; i < iterations; i++) {
      filterParticlesArray(existingParticles, newP);
    }
    const durationArray = performance.now() - startArray;

    const startSet = performance.now();
    for (let i = 0; i < iterations; i++) {
      filterParticlesSet(existingParticles, newP);
    }
    const durationSet = performance.now() - startSet;

    console.log(`[Benchmark] Array.find: ${durationArray.toFixed(3)}ms | Set.has: ${durationSet.toFixed(3)}ms`);
    expect(durationSet).toBeLessThan(durationArray);
  });
});
