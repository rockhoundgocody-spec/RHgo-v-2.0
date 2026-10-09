// Guard for plan item 1.4: every backend file imports the same `@base44/sdk` version, written
// as `npm:@base44/sdk@X.Y.Z`.
//
// Seven different pins (0.8.25 to 0.8.53) had piled up, so a fix or a new method in the SDK worked
// in some functions and not in others. Base44 deploys each function from its own directory plus
// base44/shared, so the pin stays in the import line itself: a root deno.json would not travel
// with the function.
//
// A bare `@base44/sdk` is not allowed either. Base44's documentation describes only `npm:` and
// `jsr:` specifiers and this repo has no import map, so the runtime may not resolve a bare name.
// Bots had switched four functions to it only so that Vitest could import them; Vitest now reads
// the package through the alias in vite.config.js, so a function keeps its `npm:` import.
//
// The documentation's own examples import `npm:@base44/sdk` with no version, which leaves the
// version to the platform. That is rejected here too: a behaviour change should come from a commit.
//
// The Base44 builder pins the SDK version that is current when it generates a function, so a new
// function can arrive with a newer version. The failure message then names the highest version in
// use and prints the command that moves every function to it.
import { assert, assertEquals } from 'jsr:@std/assert@1';

const SDK_REFERENCE = /@base44\/sdk(?:@([^\s'"`]*))?/g;
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;

/** Every `@base44/sdk` reference in `source`, with the version written after it (if any). */
export function findSdkReferences(source: string): Array<{ line: number; version: string | null }> {
  return [...source.matchAll(SDK_REFERENCE)].map((match) => ({
    line: source.slice(0, match.index ?? 0).split('\n').length,
    version: match[1] ?? null,
  }));
}

/** The highest of some `X.Y.Z` versions, compared number by number. */
export function highestVersion(versions: string[]): string {
  const parts = (version: string) => version.split('.').map(Number);
  return [...versions].sort((a, b) => {
    const [x, y] = [parts(a), parts(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  }).at(-1) ?? '';
}

Deno.test('the SDK pin finder reads exact versions, ranges and bare imports', () => {
  assertEquals(findSdkReferences(`import { x } from 'npm:@base44/sdk@0.8.53';`), [{ line: 1, version: '0.8.53' }]);
  assertEquals(findSdkReferences(`a\nimport { x } from "npm:@base44/sdk@^0.8.53";`), [{ line: 2, version: '^0.8.53' }]);
  assertEquals(findSdkReferences(`import { x } from '@base44/sdk';`), [{ line: 1, version: null }]);
  assertEquals(findSdkReferences(`import { x } from 'npm:@base44/sdk';`), [{ line: 1, version: null }]);
  assertEquals(findSdkReferences(`const y = 1;`), []);
});

Deno.test('the highest version is found number by number, not as text', () => {
  assertEquals(highestVersion(['0.8.9', '0.8.25', '0.8.100']), '0.8.100');
  assertEquals(highestVersion(['0.9.0', '0.8.53']), '0.9.0');
  assertEquals(highestVersion(['0.8.53']), '0.8.53');
});

async function* sourceFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    const child = new URL(entry.name + (entry.isDirectory ? '/' : ''), dir);
    if (entry.isDirectory) yield* sourceFiles(child);
    else if (entry.name.endsWith('.ts') && !/(?:_test|\.test)\.ts$/.test(entry.name)) yield child;
  }
}

Deno.test('every backend file pins the same exact @base44/sdk version', async () => {
  const versions = new Map<string, string[]>();
  const loose: string[] = [];
  for (const root of ['functions/', 'shared/']) {
    for await (const file of sourceFiles(new URL(root, import.meta.url))) {
      const relative = file.pathname.slice(new URL('./', import.meta.url).pathname.length);
      for (const { line, version } of findSdkReferences(await Deno.readTextFile(file))) {
        if (version === null || !EXACT_VERSION.test(version)) {
          loose.push(`base44/${relative}:${line}: ${version ?? '(no version)'}`);
        } else {
          versions.set(version, [...(versions.get(version) ?? []), `base44/${relative}:${line}`]);
        }
      }
    }
  }
  // A guard that finds nothing would pass for the wrong reason.
  const total = [...versions.values()].reduce((sum, places) => sum + places.length, 0);
  assert(total >= 40, `expected to find the SDK pin in the whole backend, only found ${total}`);

  assertEquals(
    loose,
    [],
    'Import the SDK as npm:@base44/sdk@X.Y.Z. A bare name may not resolve in the Base44 runtime (this repo has no import map for it) and a range drifts; tests that import a function use the alias in vite.config.js.',
  );
  const target = highestVersion([...versions.keys()]);
  const summary = [...versions].map(([version, places]) => `${version}: ${places.length} file(s)`).join(', ');
  assertEquals(
    versions.size,
    1,
    `Every function must use one @base44/sdk version, found ${summary}. To move all of them to ${target}:\n` +
      `  grep -rlE "@base44/sdk@[0-9.]+" base44 | xargs sed -i -E 's#@base44/sdk@[0-9.]+#@base44/sdk@${target}#g'\n` +
      'then run `deno check base44/functions/*/entry.ts` and compare the errors with the ones before.',
  );
});
