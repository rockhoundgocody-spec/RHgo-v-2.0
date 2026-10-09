#!/usr/bin/env node
/**
 * Type-error ratchet for the JS/JSX codebase (`tsc -p jsconfig.json`, checkJs).
 *
 * The project has a backlog of type errors that cannot be fixed in one pass, so
 * `npm run typecheck` is not a usable gate. This script turns it into a one-way
 * ratchet instead:
 *
 *   - fails if the error count is HIGHER than the committed baseline
 *   - passes (and reminds you to lower the baseline) if it is lower
 *   - `--update` rewrites the baseline to the current count
 *
 * Usage:
 *   npm run typecheck:ratchet            # check against the baseline
 *   npm run typecheck:ratchet -- --update  # accept the current count as baseline
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const baselineFile = fileURLToPath(new URL('../.github/typecheck-baseline.json', import.meta.url));
const update = process.argv.includes('--update');

const run = spawnSync('npx', ['--no-install', 'tsc', '-p', 'jsconfig.json', '--noEmit'], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});

if (run.error) {
  console.error(`typecheck-ratchet: could not run tsc: ${run.error.message}`);
  process.exit(2);
}

const output = `${run.stdout || ''}${run.stderr || ''}`;
const errorLines = output.split('\n').filter((line) => /: error TS\d+:/.test(line));
const count = errorLines.length;

// A non-zero exit with no parsed errors means tsc itself failed (bad config,
// missing dependency) - never treat that as "zero errors".
if (run.status !== 0 && count === 0) {
  console.error('typecheck-ratchet: tsc failed without reporting any TypeScript errors:\n');
  console.error(output.slice(0, 4000));
  process.exit(2);
}

const byCode = new Map();
for (const line of errorLines) {
  const code = /error (TS\d+)/.exec(line)?.[1] ?? 'TS????';
  byCode.set(code, (byCode.get(code) ?? 0) + 1);
}
const topCodes = [...byCode.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  .map(([code, n]) => `${code}=${n}`).join(', ');

if (update) {
  writeFileSync(baselineFile, `${JSON.stringify({ errors: count }, null, 2)}\n`);
  console.log(`typecheck-ratchet: baseline set to ${count} errors (${topCodes || 'none'}).`);
  process.exit(0);
}

if (!existsSync(baselineFile)) {
  console.error('typecheck-ratchet: no baseline file. Run `npm run typecheck:ratchet -- --update` and commit it.');
  process.exit(2);
}

const baseline = JSON.parse(readFileSync(baselineFile, 'utf8')).errors;
console.log(`typecheck-ratchet: ${count} type errors (baseline ${baseline}). Top: ${topCodes || 'none'}.`);

if (count > baseline) {
  console.error(`\nFAIL: this change adds ${count - baseline} type error(s). Fix them, or - if intentional - run`);
  console.error('`npm run typecheck:ratchet -- --update` and justify the new baseline in the PR.\n');
  console.error(errorLines.slice(0, 15).join('\n'));
  process.exit(1);
}

if (count < baseline) {
  console.log(`OK, and ${baseline - count} fewer than the baseline - please lower it with \`npm run typecheck:ratchet -- --update\`.`);
} else {
  console.log('OK: no new type errors.');
}
