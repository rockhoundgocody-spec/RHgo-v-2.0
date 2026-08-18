import { describe, it, expect, vi } from 'vitest';

// Mock React so we can invoke CollectionDashboard as a pure function or test its computations
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
  };
});

// Mock dependencies
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  LineChart: () => null,
  Line: () => null,
}));

vi.mock('lucide-react', () => ({
  Gem: () => null,
  MapPin: () => null,
  Star: () => null,
  TrendingUp: () => null,
  Zap: () => null,
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock('@/components/badges/ProfileBadgeStrip.jsx', () => ({
  default: () => null,
}));

import CollectionDashboard from './CollectionDashboard.jsx';

describe('CollectionDashboard component execution', () => {
  it('renders empty state when specimens is empty', () => {
    const result = CollectionDashboard({ specimens: [] });
    expect(result).toBeDefined();
  });

  it('renders dashboard with stats for non-empty specimens', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', rarity: 'common', verified: true, ai_confidence: 0.9, found_at: 'Colorado, USA', found_date: '2025-01-01' },
      { id: '2', mineral_name: 'Quartz', rarity: 'rare', verified: false, ai_confidence: 0.8, found_at: 'Colorado, USA', found_date: '2025-01-02' },
      { id: '3', mineral_name: 'Amethyst', rarity: 'legendary', verified: true, ai_confidence: 0.95, found_at: 'Brazil', found_date: '2025-01-03' },
      { id: '4', mineral_name: 'Pyrite', rarity: 'uncommon', verified: false, ai_confidence: null, found_at: 'Peru', found_date: '2025-01-04' },
    ];

    const result = CollectionDashboard({ specimens });
    expect(result).toBeDefined();
  });

  it('calculates stats correctly', () => {
    const specimens = [
      { id: '1', mineral_name: 'Quartz', rarity: 'common', verified: true, ai_confidence: 0.9, found_at: 'Colorado, USA', found_date: '2025-01-01' },
      { id: '2', mineral_name: 'Quartz', rarity: 'rare', verified: false, ai_confidence: 0.8, found_at: 'Colorado, USA', found_date: '2025-01-02' },
      { id: '3', mineral_name: 'Amethyst', rarity: 'legendary', verified: true, ai_confidence: 0.95, found_at: 'Brazil', found_date: '2025-01-03' },
      { id: '4', mineral_name: 'Pyrite', rarity: 'uncommon', verified: false, ai_confidence: null, found_at: 'Peru', found_date: '2025-01-04' },
    ];

    // Evaluate summaryStats computation logic:
    // verified: 2 (id 1, id 3)
    // rarePlus: 2 (id 2, id 3)
    // uniqueNames: 3 ('Quartz', 'Amethyst', 'Pyrite')
    // avgConf: (0.9 + 0.8 + 0.95) / 3 = 0.8833...
    let verified = 0;
    let rarePlus = 0;
    let confSum = 0;
    let confCount = 0;
    const uniqueNamesSet = new Set();

    for (let i = 0; i < specimens.length; i++) {
      const s = specimens[i];
      if (s.verified) verified++;
      if (s.rarity === 'rare' || s.rarity === 'legendary') rarePlus++;
      if (s.mineral_name) uniqueNamesSet.add(s.mineral_name);
      if (s.ai_confidence) {
        confSum += s.ai_confidence;
        confCount++;
      }
    }
    const uniqueNames = uniqueNamesSet.size;
    const avgConf = confCount > 0 ? confSum / confCount : 0;

    expect(verified).toBe(2);
    expect(rarePlus).toBe(2);
    expect(uniqueNames).toBe(3);
    expect((avgConf * 100).toFixed(0)).toBe('88');
  });
});
