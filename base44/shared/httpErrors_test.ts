import { assert, assertEquals, assertMatch, assertNotEquals } from 'jsr:@std/assert@1';
import { GENERIC_ERROR, logError, safeError } from './httpErrors.ts';

/** Run `fn` with console.error captured, so the tests stay quiet and can inspect the log. */
async function withCapturedErrorLog<T>(
  fn: (calls: unknown[][]) => T | Promise<T>,
): Promise<T> {
  const calls: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };
  try {
    return await fn(calls);
  } finally {
    console.error = original;
  }
}

Deno.test('safeError: the response carries a generic message and a reference, never the error text', async () => {
  await withCapturedErrorLog(async () => {
    const res = safeError('demo', new Error('connect ECONNREFUSED db.internal.example:5432 (user=svc_rhgo)'));
    assertEquals(res.status, 500);
    const text = await res.text();
    const body = JSON.parse(text);
    assertEquals(body.error, GENERIC_ERROR);
    assertMatch(body.request_id, /^[0-9a-f]{8}$/);
    for (const secret of ['ECONNREFUSED', 'db.internal.example', 'svc_rhgo', 'Error:']) {
      assert(!text.includes(secret), `the response leaked "${secret}"`);
    }
  });
});

Deno.test('safeError: the full error goes to the server log under the same reference', async () => {
  await withCapturedErrorLog(async (calls) => {
    const err = new Error('the real reason');
    const body = await safeError('demo', err).json();
    assertEquals(calls.length, 1);
    assertEquals(calls[0][0], `[demo] ${body.request_id}`);
    assert(calls[0][1] === err, 'the error object itself (with its stack) must be logged');
  });
});

Deno.test('safeError: extra fields keep the shape clients expect but cannot replace the error text or reference', async () => {
  await withCapturedErrorLog(async () => {
    const res = safeError('demo', new Error('x'), {
      extra: { rows: [], total_collectors: 0, error: 'leaked', request_id: 'forged' },
    });
    const body = await res.json();
    assertEquals(body.rows, []);
    assertEquals(body.total_collectors, 0);
    assertEquals(body.error, GENERIC_ERROR);
    assertNotEquals(body.request_id, 'forged');
    assertMatch(body.request_id, /^[0-9a-f]{8}$/);
  });
});

Deno.test('safeError: the status is configurable and defaults to 500', async () => {
  await withCapturedErrorLog(() => {
    assertEquals(safeError('demo', new Error('x')).status, 500);
    assertEquals(safeError('demo', new Error('x'), { status: 502 }).status, 502);
  });
});

Deno.test('safeError: copes with anything that can be thrown', async () => {
  await withCapturedErrorLog(async () => {
    for (const thrown of ['a string', 42, null, undefined, { message: 'plain object' }, Symbol('s')]) {
      const res = safeError('demo', thrown);
      assertEquals(res.status, 500);
      assertEquals((await res.json()).error, GENERIC_ERROR);
    }
  });
});

Deno.test('logError: returns a short, unique reference and logs once', async () => {
  await withCapturedErrorLog((calls) => {
    const first = logError('demo', new Error('a'));
    const second = logError('demo', new Error('b'));
    assertMatch(first, /^[0-9a-f]{8}$/);
    assertNotEquals(first, second);
    assertEquals(calls.length, 2);
  });
});
