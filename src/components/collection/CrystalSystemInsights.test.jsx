import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';

// Define window for any other global checks
globalThis.window = {
  self: {},
  top: {},
};

// Mock dependencies
vi.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
  isIframe: false,
}));

vi.mock('@/lib/useEntityQuery', () => ({
  useEntityList: vi.fn(),
}));

// Mock react's useMemo hook directly
vi.mock('react', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    default: {
      ...original.default,
      useMemo: (fn) => fn(),
    },
    useMemo: (fn) => fn(),
  };
});

vi.mock('recharts', () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => <span>Sparkles</span>,
  Hexagon: () => <span>Hexagon</span>,
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

import CrystalSystemInsights from './CrystalSystemInsights.jsx';
import { useEntityList } from '@/lib/useEntityQuery';

describe('CrystalSystemInsights Component and Cache Optimization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return null when specimens are empty or loading is true', () => {
    vi.mocked(useEntityList).mockReturnValue({ data: [], isLoading: true });
    const res1 = CrystalSystemInsights({ specimens: [] });
    expect(res1).toBeNull();

    vi.mocked(useEntityList).mockReturnValue({ data: [], isLoading: false });
    const res2 = CrystalSystemInsights({ specimens: [] });
    expect(res2).toBeNull();
  });

  it('should aggregate crystal systems using DB lookup and fallback table', () => {
    const mockMinerals = [
      { name: 'Acanthite', crystal_system: 'Monoclinic' },
      { name: 'Pyrite', crystal_system: 'Cubic' },
    ];
    vi.mocked(useEntityList).mockReturnValue({ data: mockMinerals, isLoading: false });

    // One Acanthite (DB lookup), one Pyrite (DB lookup), and one Opal (Fallback)
    const mockSpecimens = [
      { mineral_name: 'Acanthite' },
      { mineral_name: 'Pyrite' },
      { mineral_name: 'Opal' },
    ];

    const element = CrystalSystemInsights({ specimens: mockSpecimens });
    expect(element).not.toBeNull();
  });

  it('should utilize global WeakMap cache and skip redundant lookup rebuilding loops', () => {
    const mockMinerals = [
      { name: 'Acanthite', crystal_system: 'Monoclinic' },
      { name: 'Pyrite', crystal_system: 'Cubic' },
      { name: 'Garnet', crystal_system: 'Cubic' },
    ];
    vi.mocked(useEntityList).mockReturnValue({ data: mockMinerals, isLoading: false });

    const mockSpecimens = [{ mineral_name: 'Pyrite' }];

    // First render/run: should build map and populate cache
    const setSpy = vi.spyOn(Map.prototype, 'set');
    CrystalSystemInsights({ specimens: mockSpecimens });

    // Map.prototype.set should have been called for mockMinerals to build the lookup map
    const firstCallCount = setSpy.mock.calls.length;
    expect(firstCallCount).toBeGreaterThanOrEqual(mockMinerals.length);

    // Reset spy history
    setSpy.mockClear();

    // Second render/run with the SAME referentially stable mockMinerals array: should fetch lookup Map from WeakMap cache
    CrystalSystemInsights({ specimens: mockSpecimens });

    // Map.prototype.set should NOT be called for mockMinerals at all, as it's fetched from cache
    const secondCallCount = setSpy.mock.calls.length;
    // (There should be 0 calls for building the lookup map because the map was cached,
    // only any other custom calculations if they use Map.prototype.set, but here counts is a plain object: const counts = {};)
    expect(secondCallCount).toBe(0);
  });
});
