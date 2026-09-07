import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../api/base44Client', () => ({
  base44: {
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('./offlineQueue', () => ({
  queueWrite: vi.fn(async ({ op, data }) => ({
    ok: true,
    offline: false,
    result: op === 'create' ? { id: 'spec-1', ...data } : { id: data?.id },
  })),
}));

import { persistScanDraft, persistSavedSpecimen } from './scanPersist.js';
import { queueWrite } from './offlineQueue';
import { base44 } from '../api/base44Client';

describe('persistScanDraft', () => {
  it('does not write when there is no owner email (guest path)', async () => {
    await expect(persistScanDraft({ ownerEmail: '', result: { top_match: 'Quartz' } })).resolves.toEqual({ ok: false });
    expect(queueWrite).not.toHaveBeenCalled();
  });

  it('queues a SpecimenDraft for a signed-in owner without storing private coordinates', async () => {
    queueWrite.mockClear();
    await persistScanDraft({
      ownerEmail: 'me@rhgo.app',
      result: { top_match: 'Quartz', confidence: 0.6, rarity: 'common' },
      imageUrl: 'https://img/q.jpg',
      coords: { lat: 45.123, lng: -85.9 },
    });
    expect(queueWrite).toHaveBeenCalledTimes(1);
    const payload = queueWrite.mock.calls[0][0];
    expect(payload.entity).toBe('SpecimenDraft');
    expect(payload.data.owner_email).toBe('me@rhgo.app');
    expect(payload.data.lat).toBeUndefined();
    expect(payload.data.lng).toBeUndefined();
  });
});

describe('persistSavedSpecimen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    base44.functions.invoke.mockRejectedValue(new Error('offline'));
  });

  it('falls back to a queued Specimen create when identifySpecimen fails', async () => {
    const out = await persistSavedSpecimen({
      result: { top_match: 'Agate', scientific_name: 'Chalcedony', confidence: 0.7, rarity: 'common', candidates: [] },
      primaryUrl: 'https://img/a.jpg',
      coords: { lat: 46.7, lng: -92.1 },
      disposition: 'observed',
      beachName: 'North Shore',
    });
    expect(out.specimenId).toBe('spec-1');
    expect(out.xp).toBe(15);
    expect(queueWrite).toHaveBeenCalled();
    const createCall = queueWrite.mock.calls.find((c) => c[0].op === 'create');
    expect(createCall[0].data.geo_privacy).toBe('private');
    expect(createCall[0].data.lat).toBeNull();
    expect(createCall[0].data.lng).toBeNull();
  });
});
