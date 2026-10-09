// Guard for security backlog R-1: an edge function must never put an exception's text into a
// response. Provider, database and SDK errors carry host names, entity names and query fragments.
// Use `safeError` / `logError` from shared/httpErrors.ts instead; the detail then stays in the log.
//
// The check is deliberately simple and line-based, so a failure names the exact line. It flags
//   - `.message` / `.stack` on anything, and
//   - `String(e)`, `${e}`, `e.toString()` for a variable bound by a `catch`,
// unless the line is a comment, or a console call that does not also build a Response.
import { assertEquals } from 'jsr:@std/assert@1';

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const LOG_CALL = /\bconsole\s*\.\s*(?:log|info|warn|error|debug)\s*\(/;
const RESPONSE = /\bResponse\b/;
// `data.choices[0].message` on an LLM completion is data, not an Error.
const COMPLETION_MESSAGE = /\bchoices\??\.?\[\d+\]\??\.message\b/g;
const ERROR_TEXT = /\.(?:message|stack)\b/;
// `catch (e)` and `.catch((e) => ...)` / `.catch(e => ...)`
const CATCH_VARIABLE = /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)|\.catch\(\s*\(?\s*([A-Za-z_$][\w$]*)/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function findLeaks(source: string): Array<{ line: number; text: string }> {
  const caught = [...new Set([...source.matchAll(CATCH_VARIABLE)].map((m) => m[1] ?? m[2]))];
  const names = caught.map(escapeRegExp).join('|');
  const stringified = names
    ? new RegExp(`String\\(\\s*(?:${names})\\s*\\)|\\$\\{\\s*(?:${names})\\s*\\}|\\b(?:${names})\\.toString\\(`)
    : null;

  const leaks: Array<{ line: number; text: string }> = [];
  source.split('\n').forEach((text, index) => {
    if (COMMENT_LINE.test(text)) return;
    const code = text.replace(COMPLETION_MESSAGE, 'completion');
    if (!ERROR_TEXT.test(code) && !stringified?.test(code)) return;
    const isLogLine = LOG_CALL.test(code) && !RESPONSE.test(code);
    if (!isLogLine) leaks.push({ line: index + 1, text: text.trim() });
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

  // fine
  assertEquals(flagged(`console.error('syncPull failed:', error?.message);`), 0);
  assertEquals(flagged(`console.warn(\`model \${model} failed\`, (err as Error)?.message);`), 0);
  assertEquals(flagged(`const reply = data.choices?.[0]?.message?.content?.trim();`), 0);
  assertEquals(flagged(`content: data?.choices?.[0]?.message?.content || '',`), 0);
  assertEquals(flagged(`const first = data.choices[0].message.content;`), 0);
  assertEquals(flagged(`// never return error.message to the client`), 0);
  assertEquals(flagged(` * the stack is logged, not returned: error.stack`), 0);
  assertEquals(flagged(`return safeError('demo', error);`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { return safeError('demo', e); }`), 0);
  assertEquals(flagged(`const label = \`\${job.name} (\${job.condition})\`;`), 0);
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
