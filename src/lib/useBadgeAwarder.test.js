import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockSpecimenList = vi.fn();
const mockBadgeFilter = vi.fn();
const mockPostList = vi.fn();
const mockPlayerProfileFilter = vi.fn();
const mockQuestFilter = vi.fn();
const mockAuthMe = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: () => mockAuthMe(),
    },
    entities: {
      Specimen: {
        list: (...args) => mockSpecimenList(...args),
      },
      Badge: {
        filter: (...args) => mockBadgeFilter(...args),
        bulkCreate: vi.fn(),
      },
      Post: {
        list: (...args) => mockPostList(...args),
      },
      PlayerProfile: {
        filter: (...args) => mockPlayerProfileFilter(...args),
      },
      Quest: {
        filter: (...args) => mockQuestFilter(...args),
      },
    },
  },
}));

// Mock React hooks to test useBadgeAwarder refresh logic directly
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useEffect: (fn) => fn(),
    useRef: (init) => ({ current: init }),
    useState: (init) => [typeof init === 'function' ? init() : init, vi.fn()],
    useCallback: (fn) => fn,
  };
});

import { useBadgeAwarder } from './useBadgeAwarder';

describe('useBadgeAwarder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthMe.mockResolvedValue({ email: 'rockhound@example.com' });
    mockSpecimenList.mockResolvedValue([]);
    mockBadgeFilter.mockResolvedValue([]);
    mockPostList.mockResolvedValue([]);
    mockPlayerProfileFilter.mockResolvedValue([]);
    mockQuestFilter.mockResolvedValue([]);
  });

  it('calls base44.entities.Specimen.list with field projection parameters', async () => {
    const { refresh } = useBadgeAwarder();
    await refresh();

    expect(mockSpecimenList).toHaveBeenCalledWith('-created_date', 1000, 0, [
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
  });
});
