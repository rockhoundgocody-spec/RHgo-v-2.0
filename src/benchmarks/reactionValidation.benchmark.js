import { performance } from 'node:perf_hooks';

const REACTION_TYPES = ['fire', 'gem', 'clap', 'wow', 'invalid', 'unknown', 'fire'];
const ITERATIONS = 10_000_000;

function benchArrayIncludes() {
  let validCount = 0;
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const reaction_type = REACTION_TYPES[i % REACTION_TYPES.length];
    const valid = ['fire', 'gem', 'clap', 'wow'];
    if (valid.includes(reaction_type)) {
      validCount++;
    }
  }
  const duration = performance.now() - start;
  return { duration, validCount };
}

const VALID_SET = new Set(['fire', 'gem', 'clap', 'wow']);
function benchSetHas() {
  let validCount = 0;
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const reaction_type = REACTION_TYPES[i % REACTION_TYPES.length];
    if (VALID_SET.has(reaction_type)) {
      validCount++;
    }
  }
  const duration = performance.now() - start;
  return { duration, validCount };
}

// Warmup
benchArrayIncludes();
benchSetHas();

console.log('--- Running Reaction Validation Benchmark ---');
const baseline = benchArrayIncludes();
const optimized = benchSetHas();

const baselineOpsPerSec = (ITERATIONS / baseline.duration) * 1000;
const optimizedOpsPerSec = (ITERATIONS / optimized.duration) * 1000;
const speedup = (baseline.duration / optimized.duration).toFixed(2);

console.log(`Baseline (Array creation + includes): ${baseline.duration.toFixed(2)} ms (${(baselineOpsPerSec / 1e6).toFixed(2)}M ops/sec)`);
console.log(`Optimized (Module Set.has): ${optimized.duration.toFixed(2)} ms (${(optimizedOpsPerSec / 1e6).toFixed(2)}M ops/sec)`);
console.log(`Speedup: ${speedup}x faster`);
