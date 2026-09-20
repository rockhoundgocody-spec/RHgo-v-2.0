import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useMemo: (fn) => fn(),
    useState: (initial) => {
      let state = initial;
      const setState = vi.fn((newVal) => {
        if (typeof newVal === 'function') {
          state = newVal(state);
        } else {
          state = newVal;
        }
      });
      return [state, setState];
    },
    useRef: () => ({ current: null }),
    useEffect: () => {},
  };
});

vi.mock('lucide-react', () => ({
  Search: () => null,
  X: () => null,
  MapPin: () => null,
}));

import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  const hotspots = [
    { id: 'h1', name: 'Glass Butte', state: 'OR', minerals: ['Obsidian'] },
    { id: 'h2', name: 'Graves Mountain', state: 'GA', minerals: ['Rutile', 'Kyanite'] },
  ];

  it('renders search input with explicit aria-label and placeholder', () => {
    const result = MapSearchBar({ hotspots, onSelect: vi.fn() });
    expect(result).toBeDefined();

    const flexContainer = result.props.children[0];
    const input = flexContainer.props.children[1];

    expect(input.type).toBe('input');
    expect(input.props['aria-label']).toBe('Search hotspots, minerals, or states');
    expect(input.props.placeholder).toBe('Search hotspots, minerals, states…');
  });

  it('renders safely when no query is present', () => {
    const result = MapSearchBar({ hotspots, onSelect: vi.fn() });
    const flexContainer = result.props.children[0];
    const clearButton = flexContainer.props.children[2];
    const resultsContainer = result.props.children[1];

    expect(clearButton).toBeFalsy();
    expect(resultsContainer).toBeFalsy();
  });
});
