import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockMe = vi.fn();
const mockSpecimenList = vi.fn();
const mockBadgeFilter = vi.fn();
const mockBadgeBulkCreate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: (...args) => mockMe(...args),
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

// Mock React hooks to test the custom hook logic
vi.mock('react', () => {
  let stateStore = {};
  return {
    useState: (initialValue) => {
      const val = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [val, vi.fn()];
    },
    useRef: (initialValue) => ({ current: initialValue }),
    useCallback: (fn) => fn,
    useEffect: (fn) => {
      fn();
    },
  };
});

import { useBadgeAwarder } from './useBadgeAwarder.js';

describe('useBadgeAwarder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes field projections to Specimen.list and Badge.filter when refreshing', async () => {
    mockMe.mockResolvedValue({ email: 'rockhound@example.com' });
    mockSpecimenList.mockResolvedValue([
      { id: 's1', mineral_name: 'Quartz', rarity: 'common', verified: true },
    ]);
    mockBadgeFilter.mockResolvedValue([{ id: 'b1', code: 'crystal_whisperer', owner_email: 'rockhound@example.com' }]);

    const hookResult = useBadgeAwarder();
    await hookResult.refresh();

    expect(mockSpecimenList).toHaveBeenCalledWith(null, null, null, [
      'id',
      'mineral_name',
      'found_at',
      'rarity',
      'verified',
      'ai_confidence',
      'notes',
      'found_date',
      'created_date',
    ]);

    expect(mockBadgeFilter).toHaveBeenCalledWith(
      { owner_email: 'rockhound@example.com' },
      null,
      null,
      null,
      ['id', 'code', 'owner_email']
    );
  });
});
