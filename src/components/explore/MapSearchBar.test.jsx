import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockState = {};

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      const key = typeof initial === 'boolean' ? 'focused' : 'query';
      const val = mockState[key] !== undefined ? mockState[key] : initial;
      const setter = vi.fn((newVal) => {
        if (typeof newVal === 'function') {
          mockState[key] = newVal(val);
        } else {
          mockState[key] = newVal;
        }
      });
      return [val, setter];
    },
    useMemo: (fn) => fn(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
    useId: () => ':id:',
  };
});

vi.mock('lucide-react', () => ({
  Search: () => null,
  X: () => null,
  MapPin: () => null,
}));

import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  const sampleHotspots = [
    { id: 'h1', name: 'Quartz Ridge', state: 'CA', minerals: ['Quartz', 'Gold'] },
    { id: 'h2', name: 'Amethyst Mine', state: 'AZ', minerals: ['Amethyst', 'Agate'] },
  ];

  beforeEach(() => {
    mockState = { query: '', focused: false };
  });

  it('renders input with combobox role and initial collapsed state', () => {
    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    expect(tree).toBeDefined();

    const input = tree.props.children[0].props.children[1];
    expect(input.props.role).toBe('combobox');
    expect(input.props['aria-autocomplete']).toBe('list');
    expect(input.props['aria-expanded']).toBe(false);
  });

  it('renders listbox and options when query matches hotspots', () => {
    mockState = { query: 'Quartz', focused: true };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const listbox = tree.props.children[1];

    expect(listbox.props.role).toBe('listbox');
    expect(listbox.props['aria-label']).toBe('Hotspot search results');

    const options = listbox.props.children;
    expect(options).toHaveLength(1);
    expect(options[0].props.role).toBe('option');
    expect(options[0].props['aria-label']).toBe('Quartz Ridge, CA');
  });

  it('renders friendly empty state when query returns no matching hotspots', () => {
    mockState = { query: 'Diamond', focused: true };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const listbox = tree.props.children[1];

    expect(listbox.props.role).toBe('listbox');
    const emptyState = listbox.props.children;
    expect(emptyState.props.children).toBe('No matching hotspots or minerals found');
  });

  it('handles Escape key to clear search query', () => {
    mockState = { query: 'Quartz', focused: true };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const input = tree.props.children[0].props.children[1];

    input.props.onKeyDown({ key: 'Escape' });
    expect(mockState.query).toBe('');
    expect(mockState.focused).toBe(false);
  });
});
