// Guard for security backlog R-1: an edge function must never put an exception's text into a
// response. Provider, database and SDK errors carry host names, entity names and query fragments.
// Use `safeError` / `logError` from shared/httpErrors.ts instead; the detail then stays in the log.
//
// The check is deliberately simple, so a failure names the exact line. It first blanks out every
// console call, arguments included and even across lines, then flags
//   - `.message` / `.stack` on anything, and
//   - `String(e)`, `${e}` and `e.toString()` for a variable bound by a `catch`, including the
//     forms `e?.toString()` and `(e as Error).toString()`,
// except on comment lines. Only the console call itself is exempt: `errors.push(e.message);
// console.error(e);` is still a leak. It is a line-based heuristic, not a parser: it prefers a
// false alarm to a missed leak, so a console call it cannot pair up (an unbalanced bracket, or
// one that starts inside a string) is not exempted.
import { assertEquals } from 'jsr:@std/assert@1';

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const CONSOLE_CALL = /\bconsole\s*\.\s*(?:log|info|warn|error|debug)\s*\(/g;
// A logging call is short; a "call" this long means the brackets were mis-paired, so keep the text.
const MAX_CONSOLE_CALL_LINES = 30;
// `data.choices[0].message` on an LLM completion is data, not an Error.
const COMPLETION_MESSAGE = /\bchoices\??\.?\[\d+\]\??\.message\b/g;
const ERROR_TEXT = /\.(?:message|stack)\b/;
// `catch (e)` and `.catch((e) => ...)` / `.catch(e => ...)`
const CATCH_VARIABLE = /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)|\.catch\(\s*\(?\s*([A-Za-z_$][\w$]*)/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Index just past the string or template literal that starts at `start`, or -1 if it never ends. */
function endOfLiteral(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
    } else if (ch === quote) {
      return i + 1;
    } else if (quote === '`' && ch === '$' && source[i + 1] === '{') {
      i = endOfTemplateExpression(source, i + 2);
      if (i === -1) return -1;
    } else {
      i += 1;
    }
  }
  return -1;
}

/** Index just past the `}` that closes a template `${` whose contents start at `start`, or -1. */
function endOfTemplateExpression(source: string, start: number): number {
  let depth = 1;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfLiteral(source, i);
      if (i === -1) return -1;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
}

/** Index just past the `)` that closes the call whose `(` is at `open`, or -1 if it never closes. */
function endOfCall(source: string, open: number): number {
  let depth = 0;
  let i = open;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = endOfLiteral(source, i);
      if (i === -1) return -1;
      continue;
    }
    if (ch === '(') depth += 1;
    else if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  return -1;
}

/** True when `index` sits after an unclosed quote on its own line, i.e. probably inside a string. */
function insideLineString(source: string, index: number): boolean {
  const before = source.slice(source.lastIndexOf('\n', index - 1) + 1, index);
  return ['"', "'", '`'].some((quote) => before.split(`\\${quote}`).join('').split(quote).length % 2 === 0);
}

/** Blank out each console call, arguments included, keeping line breaks so line numbers still match. */
function withoutConsoleCalls(source: string): string {
  let result = '';
  let copied = 0;
  for (const match of source.matchAll(CONSOLE_CALL)) {
    const start = match.index ?? 0;
    if (start < copied || insideLineString(source, start)) continue;
    const end = endOfCall(source, start + match[0].length - 1);
    if (end === -1) continue;
    const call = source.slice(start, end);
    if (call.split('\n').length > MAX_CONSOLE_CALL_LINES) continue;
    result += source.slice(copied, start) + call.replace(/[^\n]/g, ' ');
    copied = end;
  }
  return result + source.slice(copied);
}

export function findLeaks(source: string): Array<{ line: number; text: string }> {
  const caught = [...new Set([...source.matchAll(CATCH_VARIABLE)].map((m) => m[1] ?? m[2]))];
  const names = caught.map(escapeRegExp).join('|');
  // `e`, `(e)` or `(e as Error)`
  const variable = `\\(?\\s*(?:${names})(?:\\s+as\\s+[\\w.<>\\[\\]|]+)?\\s*\\)?`;
  const stringified = names
    ? new RegExp(
      `String\\(\\s*${variable}\\s*\\)|\\$\\{\\s*${variable}\\s*\\}|(?:^|[^\\w$.])${variable}\\s*(?:\\?\\.|\\.)\\s*toString\\s*(?:\\?\\.)?\\s*\\(`,
    )
    : null;

  const original = source.split('\n');
  const leaks: Array<{ line: number; text: string }> = [];
  withoutConsoleCalls(source).split('\n').forEach((text, index) => {
    if (COMMENT_LINE.test(text)) return;
    const code = text.replace(COMPLETION_MESSAGE, 'completion');
    if (ERROR_TEXT.test(code) || stringified?.test(code)) {
      leaks.push({ line: index + 1, text: original[index].trim() });
    }
  });
  return leaks;
}

Deno.test('the leak detector flags what it should and nothing else', () => {
  const flagged = (source: string) => findLeaks(source).length;

  // leaks
  assertEquals(flagged(`return Response.json({ error: error.message }, { status: 500 });`), 1);
  assertEquals(flagged(`return Response.json({ error: (error as Error).message }, { status: 500 });`), 1);
  assertEquals(flagged(`errors.push({ name, reason: String(e.message || e) });`), 1);
  assertEquals(flagged(`return Response.json({ error: err?.stack });`), 1);
  assertEquals(flagged(`console.error('x', error.message); return Response.json({ error: error.message });`), 1);
  assertEquals(flagged(`try { run(); } catch (boom) {\n  results.errors.push(\`\${job.name}: \${boom}\`);\n}`), 1);
  assertEquals(flagged(`try { run(); } catch (boom) {\n  results.errors.push(String(boom));\n}`), 1);
  assertEquals(flagged(`p.catch((oops) => reasons.push(oops.toString()));`), 1);

  // the exemption covers the console call only, not the rest of its line (review finding)
  assertEquals(flagged(`errors.push(e.message); console.error(e);`), 1);
  assertEquals(flagged(`console.error(e); errors.push(e.message);`), 1);
  assertEquals(flagged(`console.error('failed'); return Response.json({ error: e.stack });`), 1);

  // other ways to turn a caught error into text (review finding)
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(e?.toString()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push((e as Error).toString()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push((e as Error)?.toString?.()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(String(e as Error)); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(\`\${(e)}\`); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(e . toString ()); }`), 1);

  // a console call the detector cannot pair up is not trusted
  assertEquals(flagged(`console.error('x', e.message;\nreturn 1;`), 1);
  assertEquals(flagged(`const hint = "see console.log(";\nreturn Response.json({ error: e.message });\nconst after = "x)";`), 1);

  // fine
  assertEquals(flagged(`console.error('syncPull failed:', error?.message);`), 0);
  assertEquals(flagged(`console.warn(\`model \${model} failed\`, (err as Error)?.message);`), 0);
  assertEquals(flagged(`console.error(\`oops ) \${e.message} ( done\`); results.push(1);`), 0);
  assertEquals(flagged(`console.warn("model (" + model + ") failed", (err as Error)?.message);`), 0);
  assertEquals(flagged(`console.error(format(e.message), (a) => a.stack);`), 0);
  assertEquals(flagged(`console.error(\n  'lookup failed:',\n  (err as Error)?.message,\n  err.stack,\n);\nreturn safeError('demo', err);`), 0);
  assertEquals(flagged(`const reply = data.choices?.[0]?.message?.content?.trim();`), 0);
  assertEquals(flagged(`content: data?.choices?.[0]?.message?.content || '',`), 0);
  assertEquals(flagged(`const first = data.choices[0].message.content;`), 0);
  assertEquals(flagged(`// never return error.message to the client`), 0);
  assertEquals(flagged(` * the stack is logged, not returned: error.stack`), 0);
  assertEquals(flagged(`return safeError('demo', error);`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { return safeError('demo', e); }`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { console.error(e); return safeError('demo', e); }`), 0);
  assertEquals(flagged(`const label = \`\${job.name} (\${job.condition})\`;`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { note(thing.e.toString()); }`), 0);
});

async function* sourceFiles(dir: URL): AsyncGenerator<URL> {
  for await (const entry of Deno.readDir(dir)) {
    const child = new URL(entry.name + (entry.isDirectory ? '/' : ''), dir);
    if (entry.isDirectory) yield* sourceFiles(child);
    else if (entry.name.endsWith('.ts') && !/(?:_test|\.test)\.ts$/.test(entry.name)) yield child;
  }
}

Deno.test('no edge function or shared module returns an exception\'s text (R-1)', async () => {
  const offenders: string[] = [];
  let scanned = 0;
  for (const root of ['functions/', 'shared/']) {
    for await (const file of sourceFiles(new URL(root, import.meta.url))) {
      scanned += 1;
      const relative = file.pathname.slice(new URL('./', import.meta.url).pathname.length);
      for (const { line, text } of findLeaks(await Deno.readTextFile(file))) {
        offenders.push(`base44/${relative}:${line}: ${text}`);
      }
    }
  }
  // A guard that scans nothing would pass for the wrong reason.
  if (scanned < 50) throw new Error(`expected to scan the whole backend, only found ${scanned} files`);
  assertEquals(
    offenders,
    [],
    `Put the detail in the log, not the response: use safeError()/logError() from base44/shared/httpErrors.ts.\n${offenders.join('\n')}`,
  );
});
