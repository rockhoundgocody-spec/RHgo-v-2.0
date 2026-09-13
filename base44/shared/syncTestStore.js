// Test-only transactional store. Not used by any deployed handler.
export function syncTestStore() {
  let state = { owners: {} }, tail = Promise.resolve();
  const store = {
    failOnChange: false,
    snapshot: () => structuredClone(state),
    seed(ownerId, table, id, value) {
      state.owners[ownerId] ||= { finds: {}, photos: {}, id_results: {}, media: {}, receipts: {}, conflicts: {}, changes: [], cursor: '0' };
      state.owners[ownerId][table][id] = structuredClone(value);
    },
    transaction(ownerId, callback) {
      const run = tail.then(async () => {
        const draft = structuredClone(state);
        draft.owners[ownerId] ||= { finds: {}, photos: {}, id_results: {}, media: {}, receipts: {}, conflicts: {}, changes: [], cursor: '0' };
        const s = draft.owners[ownerId];
        const tx = {
          get: async (table, id) => s[table][id],
          put: async (table, id, row) => { s[table][id] = row; },
          getReceipt: async id => s.receipts[id],
          putReceipt: async (id, row) => { s.receipts[id] = row; },
          getCursor: async () => s.cursor,
          nextCursor: async () => { s.cursor = String(BigInt(s.cursor) + 1n); return s.cursor; },
          appendChange: async change => { if (store.failOnChange) throw new Error('storage failure'); s.changes.push(change); },
          putConflict: async (id, row) => { s.conflicts[id] = row; },
          getMedia: async id => s.media[id],
        };
        const result = await callback(tx);
        state = draft;
        return result;
      });
      tail = run.catch(() => {});
      return run;
    },
  };
  return store;
}