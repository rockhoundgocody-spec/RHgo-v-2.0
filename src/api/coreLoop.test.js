import { describe, expect, it, vi } from 'vitest';
import {
  assertSafeDeleteQuery,
  buildChronolithInvokePayload,
  buildSpecimenDraftPayload,
  ensureFreeSubscription,
  filterOwnedSpecimens,
  hotspotAccessLabel,
  isEmptyDeleteQuery,
  isOpenCollectingSite,
  isUnverifiedQuickPin,
  safeEntityDelete,
  specimenOwnedBy,
} from './coreLoop.js';

describe('empty delete guard', () => {
  it('treats missing, empty-object, and empty-array queries as empty', () => {
    expect(isEmptyDeleteQuery(undefined)).toBe(true);
    expect(isEmptyDeleteQuery(null)).toBe(true);
    expect(isEmptyDeleteQuery({})).toBe(true);
    expect(isEmptyDeleteQuery([])).toBe(true);
    expect(isEmptyDeleteQuery({ id: 'abc' })).toBe(false);
  });

  it('refuses empty deletes so a {} body cannot wipe an entity', () => {
    expect(() => assertSafeDeleteQuery({})).toThrow(/wipe the entire entity/);
    expect(() => assertSafeDeleteQuery(null)).toThrow(/wipe the entire entity/);
    expect(assertSafeDeleteQuery({ owner_email: 'a@b.c' })).toEqual({ owner_email: 'a@b.c' });
  });

  it('safeEntityDelete never forwards an empty query to the SDK', async () => {
    const entityApi = { delete: vi.fn() };
    await expect(safeEntityDelete(entityApi, {})).rejects.toThrow(/wipe the entire entity/);
    expect(entityApi.delete).not.toHaveBeenCalled();

    entityApi.delete.mockResolvedValue({ deleted: 1 });
    await expect(safeEntityDelete(entityApi, { id: 'rec-1' })).resolves.toEqual({ deleted: 1 });
    expect(entityApi.delete).toHaveBeenCalledWith({ id: 'rec-1' });
  });
});

describe('hotspot trust', () => {
  const unverified = {
    source: 'quick_pin',
    land_type: 'unknown',
    trust_score: 0.5,
    access_status: 'unknown',
  };

  it('marks weak quick_pins as unverified, not open collecting sites', () => {
    expect(isUnverifiedQuickPin(unverified)).toBe(true);
    expect(hotspotAccessLabel(unverified)).toBe('unverified');
    expect(isOpenCollectingSite(unverified)).toBe(false);
  });

  it('allows documented public land that is actually open', () => {
    const open = {
      source: 'seed',
      land_type: 'blm',
      trust_score: 0.8,
      access_status: 'open',
    };
    expect(isUnverifiedQuickPin(open)).toBe(false);
    expect(isOpenCollectingSite(open)).toBe(true);
    expect(hotspotAccessLabel(open)).toBe('open');
  });

  it('does not treat unknown access as open even on public land', () => {
    expect(isOpenCollectingSite({
      land_type: 'public',
      access_status: 'unknown',
      source: 'seed',
      trust_score: 0.9,
    })).toBe(false);
  });
});

describe('specimen ownership', () => {
  const user = { email: 'me@rhgo.app', id: 'u1' };

  it('matches created_by, owner_email, or created_by_id', () => {
    expect(specimenOwnedBy({ created_by: 'me@rhgo.app' }, user)).toBe(true);
    expect(specimenOwnedBy({ owner_email: 'me@rhgo.app' }, user)).toBe(true);
    expect(specimenOwnedBy({ created_by_id: 'u1' }, user)).toBe(true);
    expect(specimenOwnedBy({ created_by: 'other@rhgo.app' }, user)).toBe(false);
  });

  it('hides unowned rows when any ownership field is present', () => {
    const rows = [
      { id: 'a', created_by: 'me@rhgo.app' },
      { id: 'b', created_by: 'other@rhgo.app' },
    ];
    expect(filterOwnedSpecimens(rows, user).map((s) => s.id)).toEqual(['a']);
  });

  it('returns [] when there is no signed-in user', () => {
    expect(filterOwnedSpecimens([{ id: 'a' }], null)).toEqual([]);
  });
});

describe('draft and chronolith payloads', () => {
  it('requires owner_email and omits coordinates unless geo_privacy is exact', () => {
    expect(() => buildSpecimenDraftPayload({ ownerEmail: '', result: {} })).toThrow(/owner_email/);
    const draft = buildSpecimenDraftPayload({
      ownerEmail: 'me@rhgo.app',
      result: { top_match: 'Quartz', confidence: 0.7, rarity: 'common' },
      imageUrl: 'https://img/q.jpg',
      geoPrivacy: 'private',
      coords: { lat: 45.1, lng: -85.2 },
    });
    expect(draft.owner_email).toBe('me@rhgo.app');
    expect(draft.status).toBe('drafting');
    expect(draft.lat).toBeUndefined();
    expect(draft.lng).toBeUndefined();
  });

  it('requires owner_email on Chronolith invokes', () => {
    expect(() => buildChronolithInvokePayload({ ownerEmail: null, imageUrls: [] })).toThrow(/owner_email/);
    const payload = buildChronolithInvokePayload({
      ownerEmail: 'me@rhgo.app',
      imageUrls: ['https://img/a.jpg'],
      coords: { lat: 40.1, lng: -89.2 },
    });
    expect(payload.owner_email).toBe('me@rhgo.app');
    expect(payload.image_urls).toHaveLength(1);
  });
});

describe('ensureFreeSubscription', () => {
  it('creates a free active row when none exists', async () => {
    const api = {
      filter: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: 's1', tier: 'free', status: 'active', owner_email: 'me@rhgo.app' }),
    };
    const row = await ensureFreeSubscription(api, 'me@rhgo.app');
    expect(api.filter).toHaveBeenCalledWith({ owner_email: 'me@rhgo.app' });
    expect(api.create).toHaveBeenCalledWith({
      owner_email: 'me@rhgo.app',
      tier: 'free',
      status: 'active',
    });
    expect(row.id).toBe('s1');
  });

  it('returns the existing row without creating a duplicate', async () => {
    const existing = { id: 's0', tier: 'field_pro', status: 'active', owner_email: 'me@rhgo.app' };
    const api = {
      filter: vi.fn().mockResolvedValue([existing]),
      create: vi.fn(),
    };
    await expect(ensureFreeSubscription(api, 'me@rhgo.app')).resolves.toEqual(existing);
    expect(api.create).not.toHaveBeenCalled();
  });
});
