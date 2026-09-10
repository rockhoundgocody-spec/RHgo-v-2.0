import { describe, expect, it, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard.jsx';
import FindsSummary from '@/components/dashboard/FindsSummary.jsx';
import RarityDistribution from '@/components/dashboard/RarityDistribution.jsx';
import { base44 } from '@/api/base44Client.js';

vi.mock('@/api/base44Client.js', () => ({
  base44: {
    entities: {
      Specimen: {
        list: vi.fn().mockResolvedValue([]),
      },
      Quest: {
        filter: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useEffect: (fn) => fn(),
    useState: (init) => [typeof init === 'function' ? init() : init, vi.fn()],
  };
});

describe('Dashboard component & optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Dashboard hook invokes base44.entities.Specimen.list with field projections', () => {
    Dashboard();

    expect(base44.entities.Specimen.list).toHaveBeenCalledWith(
      '-found_date',
      1000,
      0,
      ['id', 'rarity', 'lat', 'found_date', 'created_date']
    );
  });

  it('FindsSummary computes stats for specimens without crashing', () => {
    const today = new Date().toISOString();
    const testSpecimens = [
      { id: '1', rarity: 'common', lat: 34.0, found_date: today },
      { id: '2', rarity: 'rare', lat: 35.0, created_date: today },
      { id: '3', rarity: 'legendary', lat: null, found_date: '2021-05-10' },
      { id: '4', rarity: 'uncommon', lat: null, created_date: '2021-05-11' },
    ];

    const element = FindsSummary({ specimens: testSpecimens });
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
  });

  it('RarityDistribution computes counts for specimens without crashing', () => {
    const testSpecimens = [
      { id: '1', rarity: 'common' },
      { id: '2', rarity: 'common' },
      { id: '3', rarity: 'uncommon' },
      { id: '4', rarity: 'rare' },
      { id: '5', rarity: 'legendary' },
    ];

    const element = RarityDistribution({ specimens: testSpecimens });
    expect(element).toBeDefined();
    expect(element.type).toBe('div');
  });
});
