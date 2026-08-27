import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockMe = vi.fn();
const mockSpecimenList = vi.fn();
const mockBadgeFilter = vi.fn();
const mockBadgeBulkCreate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: () => mockMe(),
    },
    entities: {
      Specimen: {
        list: (...args) => mockSpecimenList(...args),
      },
      Badge: {
        filter: (...args) => mockBadgeFilter(...args),
        bulkCreate: (...args) => mockBadgeBulkCreate(...args),
      },
    },
  },
}));

let effectCallback = null;
vi.mock('react', () => ({
  useState: (init) => [typeof init === 'function' ? init() : init, vi.fn()],
  useRef: (init) => ({ current: init }),
  useCallback: (fn) => fn,
  useEffect: (fn) => {
    effectCallback = fn;
  },
}));

import { useBadgeAwarder } from './useBadgeAwarder.js';

describe('useBadgeAwarder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effectCallback = null;
  });

  it('uses field projection when fetching specimens and badges', async () => {
    mockMe.mockResolvedValue({ email: 'test@example.com' });
    mockSpecimenList.mockResolvedValue([
      { mineral_name: 'Quartz', found_at: 'Mine', rarity: 'common', verified: false, ai_confidence: 0.9, notes: '', found_date: '2026-01-01', created_date: '2026-01-01' },
    ]);
    mockBadgeFilter.mockResolvedValue([]);
    mockBadgeBulkCreate.mockResolvedValue([]);

    useBadgeAwarder();
    expect(effectCallback).toBeDefined();

    // Trigger effect / refresh
    await effectCallback();

    expect(mockMe).toHaveBeenCalled();
    expect(mockSpecimenList).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      ['id', 'mineral_name', 'found_at', 'rarity', 'verified', 'ai_confidence', 'notes', 'found_date', 'created_date']
    );
    expect(mockBadgeFilter).toHaveBeenCalledWith(
      { owner_email: 'test@example.com' },
      undefined,
      undefined,
      undefined,
      ['code']
    );
  });
});
