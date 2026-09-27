import { describe, it, expect } from 'vitest';
import { applyEvents, EVENT_TYPES } from '../../base44/shared/applyEvents.ts';

function createMockEntities(delayMs = 0) {
  const finds = new Map();
  const idResults = new Map();
  const eventLedger = new Map();

  const sleep = (ms) => (ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

  return {
    finds,
    idResults,
    eventLedger,
    entities: {
      SyncFind: {
        filter: async ({ owner_email, client_id }) => {
          await sleep(delayMs);
          const found = Array.from(finds.values()).find(
            (f) => f.owner_email === owner_email && f.client_id === client_id
          );
          return found ? [found] : [];
        },
      },
      SyncIdResult: {
        filter: async (query) => {
          await sleep(delayMs);
          return Array.from(idResults.values()).filter((r) => {
            if (query.owner_email && r.owner_email !== query.owner_email) return false;
            if (query.client_id && r.client_id !== query.client_id) return false;
            if (query.find_client_id && r.find_client_id !== query.find_client_id) return false;
            if (query.is_superseded !== undefined && r.is_superseded !== query.is_superseded) return false;
            return true;
          });
        },
        update: async (id, patch) => {
          await sleep(delayMs);
          const existing = idResults.get(id);
          if (!existing) return null;
          const updated = { ...existing, ...patch, updated_date: new Date().toISOString() };
          idResults.set(id, updated);
          return updated;
        },
        create: async (data) => {
          await sleep(delayMs);
          const id = `id_res_${idResults.size + 1}`;
          const record = { id, ...data, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
          idResults.set(id, record);
          return record;
        },
      },
      SyncEventLedger: {
        filter: async (query) => {
          await sleep(delayMs);
          return Array.from(eventLedger.values()).filter((l) => {
            if (query.owner_email && l.owner_email !== query.owner_email) return false;
            if (query.event_id && query.event_id.$in) return query.event_id.$in.includes(l.event_id);
            return true;
          });
        },
        create: async (data) => {
          await sleep(delayMs);
          const id = `ledger_${eventLedger.size + 1}`;
          const record = { id, ...data };
          eventLedger.set(data.event_id, record);
          return record;
        },
      },
    },
  };
}

describe('applyEvents - ID_RESULT_APPEND', () => {
  it('appends an ID result and supersedes prior records when tier is online_deep', async () => {
    const { finds, idResults, entities } = createMockEntities(0);
    const ownerEmail = 'test@example.com';

    finds.set('find_1', { id: 'sf_1', client_id: 'find_1', owner_email: ownerEmail, rev: 1 });

    idResults.set('res_1', { id: 'res_1', client_id: 'c_1', find_client_id: 'find_1', owner_email: ownerEmail, is_superseded: false });
    idResults.set('res_2', { id: 'res_2', client_id: 'c_2', find_client_id: 'find_1', owner_email: ownerEmail, is_superseded: false });

    const event = {
      id: 'ev_1',
      type: EVENT_TYPES.ID_RESULT_APPEND,
      entity_id: 'c_3',
      payload: {
        find_id: 'find_1',
        tier: 'online_deep',
        model_name: 'test-model',
        model_version: '1.0',
        confidence: 0.95,
        primary_label: 'Quartz',
      },
    };

    const res = await applyEvents({ entities, ownerEmail, events: [event] });

    expect(res.acked).toHaveLength(1);
    expect(res.rejected).toHaveLength(0);

    expect(idResults.get('res_1').is_superseded).toBe(true);
    expect(idResults.get('res_2').is_superseded).toBe(true);

    const newRes = Array.from(idResults.values()).find((r) => r.client_id === 'c_3');
    expect(newRes).toBeDefined();
    expect(newRes.is_superseded).toBe(false);
    expect(newRes.primary_label).toBe('Quartz');
  });

  it('rejects if find is not found', async () => {
    const { entities } = createMockEntities(0);
    const ownerEmail = 'test@example.com';

    const event = {
      id: 'ev_1',
      type: EVENT_TYPES.ID_RESULT_APPEND,
      entity_id: 'c_1',
      payload: {
        find_id: 'non_existent',
        tier: 'online_deep',
        model_name: 'm1',
        model_version: 'v1',
        confidence: 0.8,
      },
    };

    const res = await applyEvents({ entities, ownerEmail, events: [event] });

    expect(res.acked).toHaveLength(0);
    expect(res.rejected).toHaveLength(1);
    expect(res.rejected[0].reason).toBe('find_not_found');
  });

  it('is idempotent if same result event is processed', async () => {
    const { finds, idResults, eventLedger, entities } = createMockEntities(0);
    const ownerEmail = 'test@example.com';

    finds.set('find_1', { id: 'sf_1', client_id: 'find_1', owner_email: ownerEmail });
    idResults.set('res_1', { id: 'res_1', client_id: 'c_1', find_client_id: 'find_1', owner_email: ownerEmail, is_superseded: false });
    eventLedger.set('ev_1', { event_id: 'ev_1', owner_email: ownerEmail, status: 'acked', result_rev: null });

    const event = {
      id: 'ev_1',
      type: EVENT_TYPES.ID_RESULT_APPEND,
      entity_id: 'c_1',
      payload: {
        find_id: 'find_1',
        tier: 'online_deep',
        model_name: 'm1',
        model_version: 'v1',
        confidence: 0.8,
      },
    };

    const res = await applyEvents({ entities, ownerEmail, events: [event] });
    expect(res.acked).toHaveLength(1);
    expect(res.acked[0].replay).toBe(true);
    expect(idResults.get('res_1').is_superseded).toBe(false); // returned existing
  });

  it('benchmark: measures execution time for updating N prior records', async () => {
    const delayMs = 15; // 15ms simulated DB update latency
    const recordCount = 10;
    const { finds, idResults, entities } = createMockEntities(delayMs);
    const ownerEmail = 'bench@example.com';

    finds.set('find_bench', { id: 'sf_bench', client_id: 'find_bench', owner_email: ownerEmail, rev: 1 });

    for (let i = 0; i < recordCount; i++) {
      idResults.set(`res_bench_${i}`, {
        id: `res_bench_${i}`,
        client_id: `c_bench_${i}`,
        find_client_id: 'find_bench',
        owner_email: ownerEmail,
        is_superseded: false,
      });
    }

    const event = {
      id: 'ev_bench_1',
      type: EVENT_TYPES.ID_RESULT_APPEND,
      entity_id: 'c_bench_new',
      payload: {
        find_id: 'find_bench',
        tier: 'online_deep',
        model_name: 'bench-model',
        model_version: '1.0',
        confidence: 0.9,
      },
    };

    const start = performance.now();
    const res = await applyEvents({ entities, ownerEmail, events: [event] });
    const duration = performance.now() - start;

    expect(res.acked).toHaveLength(1);
    console.log(`[Benchmark] ${recordCount} prior records updated in ${duration.toFixed(2)}ms (DB latency: ${delayMs}ms/op)`);
  });
});
