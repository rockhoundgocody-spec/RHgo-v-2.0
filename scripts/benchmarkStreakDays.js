import { streakDays, BADGES } from '../src/lib/badgeDefinitions.js';

function generateSpecimens(count) {
  const specimens = [];
  const startDate = new Date('2025-01-01');
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.floor(i * 0.7)); // sequence with occasional gaps/duplicates
    specimens.push({
      id: `specimen-${i}`,
      found_date: d.toISOString().slice(0, 10),
      created_date: d.toISOString(),
    });
  }
  return specimens;
}

const smallDataset = generateSpecimens(20);
const mediumDataset = generateSpecimens(100);
const largeDataset = generateSpecimens(500);

// Warmup
for (let i = 0; i < 500; i++) {
  streakDays(smallDataset);
  streakDays(mediumDataset);
  streakDays(largeDataset);
}

const ITERATIONS = 5000;

function runBenchmark(label, specimens) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    streakDays(specimens);
  }
  const end = performance.now();
  const elapsedMs = end - start;
  const opsPerSec = Math.round((ITERATIONS / elapsedMs) * 1000);
  console.log(`[${label}] Total: ${elapsedMs.toFixed(2)}ms for ${ITERATIONS} iterations | ~${opsPerSec.toLocaleString()} ops/sec`);
  return elapsedMs;
}

console.log('--- streakDays Benchmark ---');
runBenchmark('Small Dataset (20 items)', smallDataset);
runBenchmark('Medium Dataset (100 items)', mediumDataset);
runBenchmark('Large Dataset (500 items)', largeDataset);
