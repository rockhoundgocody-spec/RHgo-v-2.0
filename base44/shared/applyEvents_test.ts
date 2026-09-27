import { assertEquals } from 'jsr:@std/assert@1';
import { applyEvents, EVENT_TYPES } from './applyEvents.ts';

type Row = Record<string, unknown> & { id: string };

function createMockEntities(delayMs = 10) {
  const tables: Record<string, Row[]> = {
    SyncEventLedger: [],
    SyncFind: [
      {
        id: 'f1',
        client_id: 'find_1',
        owner_email: 'test@example.com',
        rev: 1,
      },
    ],
    SyncPhoto: [],
    SyncIdResult: [],
    SyncConflict: [],
  };

  return {
    tables,
    entities: {
      SyncEventLedger: {
        filter: (q: Record<string, unknown>) => {
          let rows = tables.SyncEventLedger;
          if (q.owner_email) rows = rows.filter((r) => r.owner_email === q.owner_email);
          if (q.event_id && typeof q.event_id === 'object' && '$in' in q.event_id) {
            const list = q.event_id.$in as string[];
            rows = rows.filter((r) => list.includes(r.event_id as string));
          }
          return Promise.resolve(rows);
        },
        create: (data: Row) => {
          const row = { id: `ledger_${Math.random()}`, ...data };
          tables.SyncEventLedger.push(row);
          return Promise.resolve(row);
        },
      },
      SyncFind: {
        filter: (q: Record<string, unknown>) => {
          let rows = tables.SyncFind;
          if (q.owner_email) rows = rows.filter((r) => r.owner_email === q.owner_email);
          if (q.client_id) rows = rows.filter((r) => r.client_id === q.client_id);
          return Promise.resolve(rows);
        },
      },
      SyncIdResult: {
        filter: (q: Record<string, unknown>) => {
          let rows = tables.SyncIdResult;
          if (q.owner_email) rows = rows.filter((r) => r.owner_email === q.owner_email);
          if (q.client_id) rows = rows.filter((r) => r.client_id === q.client_id);
          if (q.find_client_id) rows = rows.filter((r) => r.find_client_id === q.find_client_id);
          if (q.is_superseded !== undefined) rows = rows.filter((r) => r.is_superseded === q.is_superseded);
          return Promise.resolve(rows);
        },
        create: (data: Row) => {
          const row = { id: `idres_${Math.random()}`, ...data };
          tables.SyncIdResult.push(row);
          return Promise.resolve(row);
        },
        update: async (id: string, patch: Partial<Row>) => {
          if (delayMs > 0) {
            await new Promise((res) => setTimeout(res, delayMs));
          }
          const row = tables.SyncIdResult.find((r) => r.id === id);
          if (row) {
            Object.assign(row, patch, { updated_date: new Date().toISOString() });
          }
          return row;
        },
      },
    },
  };
}

Deno.test('ID_RESULT_APPEND supersedes prior online_deep results correctly', async () => {
  const { entities, tables } = createMockEntities(0);

  // Setup prior unsuperseded ID results for the find
  tables.SyncIdResult.push(
    { id: 'res1', owner_email: 'test@example.com', find_client_id: 'find_1', client_id: 'c1', is_superseded: false },
    { id: 'res2', owner_email: 'test@example.com', find_client_id: 'find_1', client_id: 'c2', is_superseded: false },
    { id: 'res3', owner_email: 'test@example.com', find_client_id: 'find_1', client_id: 'c3', is_superseded: false },
  );

  const event = {
    id: 'ev_1',
    type: EVENT_TYPES.ID_RESULT_APPEND,
    entity_id: 'c4',
    payload: {
      find_id: 'find_1',
      tier: 'online_deep',
      model_name: 'gemini-flash',
      model_version: '1.0',
      confidence: 0.95,
      primary_label: 'Quartz',
    },
  };

  const res = await applyEvents({
    entities: entities as any,
    ownerEmail: 'test@example.com',
    events: [event],
  });

  assertEquals(res.acked.length, 1);
  assertEquals(tables.SyncIdResult.find((r) => r.id === 'res1')?.is_superseded, true);
  assertEquals(tables.SyncIdResult.find((r) => r.id === 'res2')?.is_superseded, true);
  assertEquals(tables.SyncIdResult.find((r) => r.id === 'res3')?.is_superseded, true);
  const newRow = tables.SyncIdResult.find((r) => r.client_id === 'c4');
  assertEquals(newRow?.is_superseded, false);
});

Deno.test('ID_RESULT_APPEND performance baseline for superseding prior results', async () => {
  const delayMs = 15;
  const count = 10;
  const { entities, tables } = createMockEntities(delayMs);

  for (let i = 0; i < count; i++) {
    tables.SyncIdResult.push({
      id: `res_${i}`,
      owner_email: 'test@example.com',
      find_client_id: 'find_1',
      client_id: `c_${i}`,
      is_superseded: false,
    });
  }

  const event = {
    id: 'ev_perf',
    type: EVENT_TYPES.ID_RESULT_APPEND,
    entity_id: 'c_new',
    payload: {
      find_id: 'find_1',
      tier: 'online_deep',
      model_name: 'gemini-flash',
      model_version: '1.0',
      confidence: 0.98,
      primary_label: 'Amethyst',
    },
  };

  const start = performance.now();
  await applyEvents({
    entities: entities as any,
    ownerEmail: 'test@example.com',
    events: [event],
  });
  const elapsed = performance.now() - start;

  console.log(`[Benchmark] ID_RESULT_APPEND with ${count} prior results took ${elapsed.toFixed(2)}ms (simulated DB latency = ${delayMs}ms/op)`);
});
