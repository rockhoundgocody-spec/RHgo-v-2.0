// Guard for plan item 1.4: every backend file imports the same `@base44/sdk` version, written
// as `npm:@base44/sdk@X.Y.Z`.
//
// Seven different pins (0.8.25 to 0.8.53) had piled up, so a fix or a new method in the SDK worked
// in some functions and not in others. Base44 deploys each function from its own directory plus
// base44/shared, so the pin stays in the import line itself: a root deno.json would not travel
// with the function.
//
// A bare `@base44/sdk`, with or without a version, is not allowed either. Base44's documentation
// describes only `npm:` and `jsr:` specifiers and this repo has no import map, so the runtime may
// not resolve a bare name. Bots had switched four functions to it only so that Vitest could import
// them; Vitest now reads the package through the alias in vite.config.js, so a function keeps its
// `npm:` import.
//
// The documentation's own examples import `npm:@base44/sdk` with no version, which leaves the
// version to the platform. That is rejected here too: a behaviour change should come from a commit.
//
// The Base44 builder pins the SDK version that is current when it generates a function, so a new
// function can arrive with a newer version. The failure message then names the highest version in
// use and prints the command that moves every function to it.
import { assert, assertEquals } from 'jsr:@std/assert@1';

// `npm:` (when written) right before the name, then an optional `@version` up to a quote or space.
const SDK_REFERENCE = /(npm:)?@base44\/sdk(?:@([^\s'"`]*))?/g;
const EXACT_VERSION = /^\d+\.\d+\.\d+$/;
const EXTENSIONS = ['ts', 'js', 'mjs'];
const TEST_FILE = /(?:_test|\.test)\.(?:ts|js|mjs)$/;

export interface SdkReference {
  line: number;
  /** What was written, for the failure message. */
  text: string;
  /** The version of a well-formed `npm:@base44/sdk@X.Y.Z`; null for anything else. */
  version: string | null;
  /** Why the reference is not a well-formed pin; null when it is one. */
  problem: string | null;
}

/** Every `@base44/sdk` reference in `source`, each marked well-formed or with the reason it is not. */
export function findSdkReferences(source: string): SdkReference[] {
  return [...source.matchAll(SDK_REFERENCE)].map((match) => {
    const [text, npm, version] = match;
    const problem = !npm
      ? 'no npm: prefix'
      : version === undefined
      ? 'no version'
      : !EXACT_VERSION.test(version)
      ? 'not an exact X.Y.Z'
      : null;
    return {
      line: source.slice(0, match.index ?? 0).split('\n').length,
      text,
      version: problem === null ? version : null,
      problem,
    };
  });
}

/** The highest of some `X.Y.Z` versions, compared number by number. */
export function highestVersion(versions: string[]): string {
  const parts = (version: string) => version.split('.').map(Number);
  return [...versions].sort((a, b) => {
    const [x, y] = [parts(a), parts(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  }).at(-1) ?? '';
}

/** The command that moves every function to `target`: the files this guard scans, test files left alone. */
export function upgradeCommand(target: string): string {
  const include = EXTENSIONS.map((extension) => `--include='*.${extension}'`).join(' ');
  return `grep -rlE "npm:@base44/sdk@[0-9.]+" base44/functions base44/shared ${include} ` +
    `--exclude='*_test.*' --exclude='*.test.*' | xargs sed -i -E 's#npm:@base44/sdk@[0-9.]+#npm:@base44/sdk@${target}#g'`;
}

// The samples are built at run time, so no line of this file reads `@base44/sdk@<digits>`.
const sdk = (version: string, prefix = 'npm:') => `${prefix}@base44/sdk@${version}`;
const importOf = (specifier: string) => `import { x } from '${specifier}';`;

Deno.test('the SDK pin finder accepts only npm:@base44/sdk@X.Y.Z', () => {
  const problemsOf = (specifier: string) => findSdkReferences(importOf(specifier)).map((ref) => ref.problem);

  assertEquals(problemsOf(sdk('0.8.53')), [null]);
  assertEquals(problemsOf(sdk('10.20.30')), [null]);

  // a version without the npm: prefix is as unresolvable as a bare name
  assertEquals(problemsOf(sdk('0.8.53', '')), ['no npm: prefix']);
  assertEquals(problemsOf(sdk('0.8.53', 'https://esm.sh/')), ['no npm: prefix']);
  assertEquals(problemsOf('@base44/sdk'), ['no npm: prefix']);

  assertEquals(problemsOf('npm:@base44/sdk'), ['no version']);
  assertEquals(problemsOf(sdk('^0.8.53')), ['not an exact X.Y.Z']);
  assertEquals(problemsOf(sdk('~0.8.53')), ['not an exact X.Y.Z']);
  assertEquals(problemsOf(sdk('0.8')), ['not an exact X.Y.Z']);
  assertEquals(problemsOf(sdk('latest')), ['not an exact X.Y.Z']);

  // what the failure message shows, and where
  assertEquals(findSdkReferences(`const a = 1;\n${importOf(sdk('1.2.3', ''))}`), [
    { line: 2, text: '@base44/sdk@1.2.3', version: null, problem: 'no npm: prefix' },
  ]);
  assertEquals(findSdkReferences(importOf(sdk('1.2.3')))[0].version, '1.2.3');
  assertEquals(findSdkReferences(`const y = 1;`), []);
});

Deno.test('the highest version is found number by number, not as text', () => {
  assertEquals(highestVersion(['0.8.9', '0.8.25', '0.8.100']), '0.8.100');
  assertEquals(highestVersion(['0.9.0', '0.8.53']), '0.9.0');
  assertEquals(highestVersion(['0.8.53']), '0.8.53');
});

Deno.test('the upgrade command covers the scanned files, skips test files, and cannot rewrite this one', async () => {
  const command = upgradeCommand('9.9.9');
  assert(command.includes('base44/functions base44/shared'), 'it must search the directories the guard scans');
  for (const extension of EXTENSIONS) assert(command.includes(`--include='*.${extension}'`), `missing *.${extension}`);
  assert(command.includes(`--exclude='*_test.*'`) && command.includes(`--exclude='*.test.*'`), 'test files must be left alone');
  assert(command.includes(sdk('9.9.9')), 'it must write the target version');

  // Even run over this whole file, the command would find nothing to change.
  const own = await Deno.readTextFile(new URL(import.meta.url));
  assertEquals(own.match(/npm:@base44\/sdk@[0-9.]+/g), null);
});

async function* sourceFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    const child = new URL(entry.name + (entry.isDirectory ? '/' : ''), dir);
    if (entry.isDirectory) yield* sourceFiles(child);
    else if (EXTENSIONS.some((extension) => entry.name.endsWith(`.${extension}`)) && !TEST_FILE.test(entry.name)) yield child;
  }
}

Deno.test('every backend file pins the same exact @base44/sdk version', async () => {
  const versions = new Map<string, string[]>();
  const loose: string[] = [];
  for (const root of ['functions/', 'shared/']) {
    for await (const file of sourceFiles(new URL(root, import.meta.url))) {
      const relative = file.pathname.slice(new URL('./', import.meta.url).pathname.length);
      for (const { line, text, version, problem } of findSdkReferences(await Deno.readTextFile(file))) {
        const place = `base44/${relative}:${line}`;
        if (version === null) loose.push(`${place}: ${text} (${problem})`);
        else versions.set(version, [...(versions.get(version) ?? []), place]);
      }
    }
  }
  // A guard that finds nothing would pass for the wrong reason.
  const total = [...versions.values()].reduce((sum, places) => sum + places.length, 0);
  assert(total >= 40, `expected to find the SDK pin in the whole backend, only found ${total}`);

  assertEquals(
    loose,
    [],
    'Import the SDK as npm:@base44/sdk@X.Y.Z. A bare name, with or without a version, may not resolve in the Base44 runtime (this repo has no import map for it) and a range drifts; tests that import a function use the alias in vite.config.js.',
  );
  const target = highestVersion([...versions.keys()]);
  const summary = [...versions].map(([version, places]) => `${version}: ${places.length} file(s)`).join(', ');
  assertEquals(
    versions.size,
    1,
    `Every function must use one @base44/sdk version, found ${summary}. To move all of them to ${target}:\n` +
      `  ${upgradeCommand(target)}\n` +
      'then run `deno check base44/functions/*/entry.ts` and compare the errors with the ones before. ' +
      "(GNU sed; on macOS write `sed -i '' -E`.)",
  );
});
