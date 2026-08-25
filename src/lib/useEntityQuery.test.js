import { vi, describe, it, expect, beforeEach } from 'vitest';

// Define a minimal window object in global scope for Node test runner if required
globalThis.window = {
  location: {
    search: '',
    href: '',
    pathname: '',
  },
};

const mockList = vi.fn();

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        list: (...args) => mockList(...args),
      },
    },
  },
}));

let capturedUseQueryArgs = null;

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: (config) => {
    capturedUseQueryArgs = config;
    return { data: [], isLoading: false };
  },
}));

import { useEntityList } from './useEntityQuery.js';

describe('useEntityList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedUseQueryArgs = null;
  });

  it('forwards sortKey, limit, skip, and fields to base44.entities.Specimen.list', () => {
    useEntityList('Specimen', '-found_date', 50, {
      skip: 10,
      fields: ['id', 'mineral_name', 'rarity'],
    });

    expect(capturedUseQueryArgs).toBeDefined();
    expect(capturedUseQueryArgs.queryKey).toEqual([
      'entity',
      'Specimen',
      'list',
      '-found_date',
      50,
      10,
      ['id', 'mineral_name', 'rarity'],
    ]);

    capturedUseQueryArgs.queryFn();
    expect(mockList).toHaveBeenCalledWith('-found_date', 50, 10, ['id', 'mineral_name', 'rarity']);
  });

  it('handles options object passed as 3rd parameter (legacy support)', () => {
    useEntityList('Specimen', '-found_date', {
      fields: ['id', 'mineral_name'],
    });

    expect(capturedUseQueryArgs).toBeDefined();
    expect(capturedUseQueryArgs.queryKey).toEqual([
      'entity',
      'Specimen',
      'list',
      '-found_date',
      null,
      null,
      ['id', 'mineral_name'],
    ]);

    capturedUseQueryArgs.queryFn();
    expect(mockList).toHaveBeenCalledWith('-found_date', undefined, undefined, ['id', 'mineral_name']);
  });
});
