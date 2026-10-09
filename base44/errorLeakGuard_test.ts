// Guard for security backlog R-1: an edge function must never put an exception's text into a
// response. Provider, database and SDK errors carry host names, entity names and query fragments.
// Use `safeError` / `logError` from shared/httpErrors.ts instead; the detail then stays in the log.
//
// The rule is deliberately blunt, so a failure names the exact line and nothing can be argued
// into an exemption: no file under base44/ may read an error's text at all. Log the error object
// (`console.error('what failed', error)`) rather than its `.message`. The check flags, on every
// line that is not a comment,
//   - `.message` / `.stack`, with a dot, `?.` or brackets (`e['message']`),
//   - `String(e)`, `${e}` and `e.toString()` for a variable bound by a `catch`, including
//     `e?.toString()` and `(e as Error).toString()`,
//   - `const { message } = e` and `catch ({ message })`.
// The one exemption is the `message` of an LLM completion (`data.choices[0].message`), which is
// data, not an Error. An earlier version exempted console calls by matching brackets; that scanner
// could be fooled by comments, strings and regular expressions, so it was removed rather than patched.
//
// This catches accidental leaks, for example in a bot-written fix. It cannot stop deliberate
// obfuscation such as `e['mes' + 'sage']` or passing the error through a helper; review covers those.
import { assertEquals } from 'jsr:@std/assert@1';

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;
const COMPLETION_MESSAGE = /\bchoices\??\.?\[\d+\]\??\.message\b/g;
const ERROR_TEXT = /\.\s*(?:message|stack)\b|\[\s*(['"`])(?:message|stack)\1\s*\]/;
const DESTRUCTURED_IN_CATCH = /\bcatch\s*\(\s*\{[^}]*\b(?:message|stack)\b/;
// `catch (e)` and `.catch((e) => ...)` / `.catch(e => ...)`
const CATCH_VARIABLE = /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)|\.catch\(\s*\(?\s*([A-Za-z_$][\w$]*)/g;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
  // `const { message } = e;`
  const destructured = names ? new RegExp(`\\{[^}]*\\b(?:message|stack)\\b[^}]*\\}\\s*=\\s*(?:${names})\\b`) : null;

  const leaks: Array<{ line: number; text: string }> = [];
  source.split('\n').forEach((text, index) => {
    if (COMMENT_LINE.test(text)) return;
    const code = text.replace(COMPLETION_MESSAGE, 'completion');
    if (ERROR_TEXT.test(code) || DESTRUCTURED_IN_CATCH.test(code) || stringified?.test(code) || destructured?.test(code)) {
      leaks.push({ line: index + 1, text: text.trim() });
    }
  });
  return leaks;
}

Deno.test('the leak detector flags what it should and nothing else', () => {
  const flagged = (source: string) => findLeaks(source).length;

  // leaks in a response
  assertEquals(flagged(`return Response.json({ error: error.message }, { status: 500 });`), 1);
  assertEquals(flagged(`return Response.json({ error: (error as Error).message }, { status: 500 });`), 1);
  assertEquals(flagged(`errors.push({ name, reason: String(e.message || e) });`), 1);
  assertEquals(flagged(`return Response.json({ error: err?.stack });`), 1);

  // a console call is no longer an exemption (review findings: the old exemption could be fooled)
  assertEquals(flagged(`console.error('syncPull failed:', error?.message);`), 1);
  assertEquals(flagged(`console.warn(\`model \${model} failed\`, (err as Error)?.message);`), 1);
  assertEquals(flagged(`errors.push(e.message); console.error(e);`), 1);
  assertEquals(flagged(`console.error(e); errors.push(e.message);`), 1);
  assertEquals(flagged(`console.error(/* ( */ e); return Response.json({ error: e.message });`), 1);
  assertEquals(flagged(`console.error('x', error.message); return Response.json({ error: error.message });`), 1);
  assertEquals(flagged(`const hint = "see console.log(";\nreturn Response.json({ error: e.message });\nconst after = "x)";`), 1);

  // turning a caught error into text
  assertEquals(flagged(`try { run(); } catch (boom) {\n  results.errors.push(\`\${job.name}: \${boom}\`);\n}`), 1);
  assertEquals(flagged(`try { run(); } catch (boom) {\n  results.errors.push(String(boom));\n}`), 1);
  assertEquals(flagged(`p.catch((oops) => reasons.push(oops.toString()));`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(e?.toString()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push((e as Error).toString()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push((e as Error)?.toString?.()); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(String(e as Error)); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(\`\${(e)}\`); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { reasons.push(e . toString ()); }`), 1);

  // other ways to read the text
  assertEquals(flagged(`return Response.json({ error: err['message'] });`), 1);
  assertEquals(flagged(`return Response.json({ error: err["stack"] });`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { const { message } = e; reasons.push(message); }`), 1);
  assertEquals(flagged(`try { run(); } catch (e) { const { message: text, code } = e; }`), 1);
  assertEquals(flagged(`try { run(); } catch ({ message }) { reasons.push(message); }`), 1);

  // fine
  assertEquals(flagged(`console.error('syncPull failed:', error);`), 0);
  assertEquals(flagged('console.log(`Push failed for ${user.email}:`, pushErr);'), 0);
  assertEquals(flagged(`const reply = data.choices?.[0]?.message?.content?.trim();`), 0);
  assertEquals(flagged(`content: data?.choices?.[0]?.message?.content || '',`), 0);
  assertEquals(flagged(`const first = data.choices[0].message.content;`), 0);
  assertEquals(flagged(`// never return error.message to the client`), 0);
  assertEquals(flagged(` * the stack is logged, not returned: error.stack`), 0);
  assertEquals(flagged(`return safeError('demo', error);`), 0);
  assertEquals(flagged(`const ref = logError('demo', e);`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { return safeError('demo', e); }`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { console.error(e); return safeError('demo', e); }`), 0);
  assertEquals(flagged(`const label = \`\${job.name} (\${job.condition})\`;`), 0);
  assertEquals(flagged(`try { run(); } catch (e) { note(thing.e.toString()); }`), 0);
  assertEquals(flagged(`const { messages, stacks } = payload;`), 0);
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
