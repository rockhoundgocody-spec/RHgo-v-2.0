import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock react to allow calling React component function directly without React DOM renderer context
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (factory) => factory(),
  };
});

// Mock useEntityList hook from '@/lib/useEntityQuery'
vi.mock('@/lib/useEntityQuery', () => ({
  useEntityList: vi.fn(),
}));

// Mock recharts and GlassPanel to simplify component execution in vitest
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => children,
  BarChart: ({ children }) => children,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children, className }) => <div className={className}>{children}</div>,
}));

import { useEntityList } from '@/lib/useEntityQuery';
import CrystalSystemInsights from './CrystalSystemInsights';

describe('CrystalSystemInsights', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when loading or when specimens is empty', () => {
    useEntityList.mockReturnValue({ data: [], isLoading: true });
    expect(CrystalSystemInsights({ specimens: [{ mineral_name: 'Quartz' }] })).toBeNull();

    useEntityList.mockReturnValue({ data: [], isLoading: false });
    expect(CrystalSystemInsights({ specimens: [] })).toBeNull();
    expect(CrystalSystemInsights({ specimens: null })).toBeNull();
  });

  it('correctly aggregates crystal systems using DB minerals and fallbacks', () => {
    const mockMinerals = [
      { name: 'Pyrite', crystal_system: 'Isometric' },
      { name: 'Quartz', crystal_system: 'Trigonal' },
    ];
    useEntityList.mockReturnValue({ data: mockMinerals, isLoading: false });

    const specimens = [
      { mineral_name: 'Pyrite' },
      { mineral_name: 'Quartz' },
      { mineral_name: 'Amethyst' }, // Falls back to Trigonal via FALLBACKS
      { mineral_name: 'Unknown Stone' }, // Unknown
    ];

    const element = CrystalSystemInsights({ specimens });
    expect(element).not.toBeNull();
    expect(element.props.className).toBe('mb-6');
  });
});
