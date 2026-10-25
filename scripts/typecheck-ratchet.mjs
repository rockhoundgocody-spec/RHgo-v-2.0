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
import { fileURLToPath, pathToFileURL } from 'node:url';

const BASELINE_FILE = fileURLToPath(new URL('../.github/typecheck-baseline.json', import.meta.url));

/**
 * A line that reports a TypeScript error, in either format `tsc` prints:
 *   file-level:    `src/a.jsx(1,2): error TS2339: ...`
 *   project-level: `error TS2688: Cannot find type definition file ...`
 */
const ERROR_LINE = /(?:^|: )error TS\d+:/;

/** Every line of `tsc` output that reports an error (file-level and project-level). */
export function parseErrorLines(output) {
  return output.split('\n').filter((line) => ERROR_LINE.test(line));
}

/** The five most frequent error codes, e.g. `TS2339=127, TS2739=31`. */
export function topCodes(errorLines) {
  const byCode = new Map();
  for (const line of errorLines) {
    const code = /error (TS\d+)/.exec(line)?.[1] ?? 'TS????';
    byCode.set(code, (byCode.get(code) ?? 0) + 1);
  }
  return [...byCode.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([code, n]) => `${code}=${n}`).join(', ');
}

/**
 * Read the committed baseline. A missing, misspelled, non-numeric, negative or
 * fractional value must be rejected: comparing against `undefined` is false in
 * both directions, which would silently let any number of errors through.
 */
export function parseBaseline(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`the baseline is not valid JSON (${error.message})`);
  }
  const errors = data?.errors;
  if (!Number.isInteger(errors) || errors < 0) {
    throw new Error('the baseline must look like {"errors": <non-negative integer>}');
  }
  return errors;
}

/** Compare the current count with the baseline. */
export function evaluate(count, baseline) {
  if (count > baseline) return { status: 'fail', added: count - baseline };
  if (count < baseline) return { status: 'improved', removed: baseline - count };
  return { status: 'ok' };
}

function main() {
  const update = process.argv.includes('--update');

  // Validate the baseline BEFORE the slow type-check so a bad file fails fast.
  let baseline = null;
  if (!update) {
    if (!existsSync(BASELINE_FILE)) {
      console.error('typecheck-ratchet: no baseline file. Run `npm run typecheck:ratchet -- --update` and commit it.');
      process.exit(2);
    }
    try {
      baseline = parseBaseline(readFileSync(BASELINE_FILE, 'utf8'));
    } catch (error) {
      console.error(`typecheck-ratchet: ${error.message} (${BASELINE_FILE}).`);
      console.error('Fix the file, or regenerate it with `npm run typecheck:ratchet -- --update`.');
      process.exit(2);
    }
  }

  // `--pretty false` keeps the output format identical on a TTY and in CI.
  const run = spawnSync('npx', ['--no-install', 'tsc', '-p', 'jsconfig.json', '--noEmit', '--pretty', 'false'], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  });

  if (run.error) {
    console.error(`typecheck-ratchet: could not run tsc: ${run.error.message}`);
    process.exit(2);
  }

  const output = `${run.stdout || ''}${run.stderr || ''}`;
  const errorLines = parseErrorLines(output);
  const count = errorLines.length;

  // A non-zero exit with no parsed errors means tsc itself failed (bad config,
  // missing dependency) - never treat that as "zero errors".
  if (run.status !== 0 && count === 0) {
    console.error('typecheck-ratchet: tsc failed without reporting any TypeScript errors:\n');
    console.error(output.slice(0, 4000));
    process.exit(2);
  }

  const summary = topCodes(errorLines) || 'none';

  if (update) {
    writeFileSync(BASELINE_FILE, `${JSON.stringify({ errors: count }, null, 2)}\n`);
    console.log(`typecheck-ratchet: baseline set to ${count} errors (${summary}).`);
    process.exit(0);
  }

  console.log(`typecheck-ratchet: ${count} type errors (baseline ${baseline}). Top: ${summary}.`);
  const result = evaluate(count, baseline);

  if (result.status === 'fail') {
    console.error(`\nFAIL: this change adds ${result.added} type error(s). Fix them, or - if intentional - run`);
    console.error('`npm run typecheck:ratchet -- --update` and justify the new baseline in the PR.\n');
    console.error(errorLines.slice(0, 15).join('\n'));
    process.exit(1);
  }

  if (result.status === 'improved') {
    console.log(`OK, and ${result.removed} fewer than the baseline - please lower it with \`npm run typecheck:ratchet -- --update\`.`);
  } else {
    console.log('OK: no new type errors.');
  }
}

// Run only when executed directly, so the functions above can be imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
