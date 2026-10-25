import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseErrorLines, parseBaseline, evaluate, topCodes } from './typecheck-ratchet.mjs';

const FILE_ERROR = "src/pages/Scan.jsx(139,20): error TS2339: Property 'source' does not exist on type 'X'.";
const FILE_ERROR_2 = "src/lib/geo.js(7,3): error TS2322: Type 'string' is not assignable to type 'number'.";
const PROJECT_ERROR = "error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.";

test('counts both file-level and project-level errors', () => {
  const output = [FILE_ERROR, FILE_ERROR_2, PROJECT_ERROR].join('\n');
  assert.equal(parseErrorLines(output).length, 3);
});

test('a project-level error on top of the baseline is noticed (mixed formats)', () => {
  // Regression: the first version only matched `...: error TS1234:` and skipped
  // project-level errors, so two file errors + one project error counted as 2.
  const baseline = 2;
  const count = parseErrorLines([FILE_ERROR, FILE_ERROR_2, PROJECT_ERROR].join('\n')).length;
  assert.equal(evaluate(count, baseline).status, 'fail');
});

test('does not count continuation lines or unrelated output', () => {
  const output = [
    FILE_ERROR,
    "  Property 'source' does not exist on type 'Y'.",
    '    Entry point of type library specified in compilerOptions',
    'Found 1 error in 1 file.',
    '',
  ].join('\n');
  assert.deepEqual(parseErrorLines(output), [FILE_ERROR]);
});

test('accepts a valid baseline', () => {
  assert.equal(parseBaseline('{"errors": 264}'), 264);
  assert.equal(parseBaseline('{ "errors": 0 }\n'), 0);
});

test('rejects a baseline that would silently disable the check', () => {
  // Regression: `{}` or a misspelled key made `baseline` undefined, both
  // comparisons were false, and any number of errors printed "OK".
  for (const bad of ['{}', '{"error": 264}', '{"errors": "264"}', '{"errors": -1}', '{"errors": 1.5}', '{"errors": null}', '[]', 'null', 'not json', '']) {
    assert.throws(() => parseBaseline(bad), /baseline/, `should reject: ${JSON.stringify(bad)}`);
  }
});

test('evaluate: fails above the baseline, passes at it, reports improvement below it', () => {
  assert.deepEqual(evaluate(265, 264), { status: 'fail', added: 1 });
  assert.deepEqual(evaluate(264, 264), { status: 'ok' });
  assert.deepEqual(evaluate(260, 264), { status: 'improved', removed: 4 });
});

test('topCodes lists the most frequent error codes', () => {
  assert.equal(topCodes([FILE_ERROR, FILE_ERROR_2, FILE_ERROR, PROJECT_ERROR]), 'TS2339=2, TS2322=1, TS5101=1');
});
