import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock react module so useMemo runs synchronously without React dispatcher
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn()
  };
});

// Mock useEntityList hook
vi.mock('@/lib/useEntityQuery', () => ({
  useEntityList: vi.fn(() => ({ data: [], isLoading: false }))
}));

// Mock recharts and lucide-react
vi.mock('recharts', () => ({
  BarChart: ({ data, children }) => <div data-testid="barchart" data-chartdata={JSON.stringify(data)}>{children}</div>,
  Bar: ({ children }) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  Tooltip: () => null,
  Cell: () => null
}));

vi.mock('lucide-react', () => ({
  Sparkles: () => null,
  Hexagon: () => null
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children }) => <div data-testid="glass-panel">{children}</div>
}));

import CrystalSystemInsights, { getMineralLookup } from './CrystalSystemInsights.jsx';
import { useEntityList } from '@/lib/useEntityQuery';

describe('CrystalSystemInsights', () => {
  it('reuses a normalized lookup for the same immutable mineral result', () => {
    const minerals = [
      { name: ' Quartz ', crystal_system: 'Trigonal' },
      { name: 'Fluorite', crystal_system: 'Cubic' },
      { name: 'Unknown' },
    ];

    const first = getMineralLookup(minerals);
    const second = getMineralLookup(minerals);

    expect(second).toBe(first);
    expect(first.get('quartz')).toBe('Trigonal');
    expect(first.get('fluorite')).toBe('Cubic');
    expect(first.has('unknown')).toBe(false);
  });

  it('returns an empty lookup for non-array input', () => {
    expect(getMineralLookup(null).size).toBe(0);
  });

  it('returns null when specimens is empty or null', () => {
    expect(CrystalSystemInsights({ specimens: [] })).toBeNull();
    expect(CrystalSystemInsights({ specimens: null })).toBeNull();
  });

  it('returns null when isLoading is true', () => {
    vi.mocked(useEntityList).mockReturnValue({ data: [], isLoading: true });
    expect(CrystalSystemInsights({ specimens: [{ mineral_name: 'quartz' }] })).toBeNull();
  });

  it('aggregates counts from minerals lookup and fallbacks correctly', () => {
    vi.mocked(useEntityList).mockReturnValue({
      data: [
        { name: ' Quartz ', crystal_system: 'Trigonal' },
        { name: 'Fluorite', crystal_system: 'Cubic' }
      ],
      isLoading: false
    });

    const specimens = [
      { mineral_name: 'quartz' },
      { mineral_name: 'QUARTZ' },
      { mineral_name: 'fluorite' },
      { mineral_name: 'opal' }, // Fallback -> Amorphous
      { mineral_name: 'unknown_stone' } // Fallback -> Unknown
    ];

    const element = CrystalSystemInsights({ specimens });
    expect(element).not.toBeNull();

    // Convert element tree to JSON string to find data-chartdata easily
    const jsonStr = JSON.stringify(element);
    expect(jsonStr).toContain('Trigonal');
    expect(jsonStr).toContain('Cubic');
    expect(jsonStr).toContain('Amorphous');
    expect(jsonStr).toContain('Unknown');
  });
});
