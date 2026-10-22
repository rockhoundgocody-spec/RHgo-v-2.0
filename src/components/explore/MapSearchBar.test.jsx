import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockState = {};

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      // Manage keys based on initial value type or explicit test mockState
      let key = 'query';
      if (typeof initial === 'number') key = 'activeIndex';
      else if (typeof initial === 'boolean') key = 'focused';

      const val = mockState[key] !== undefined ? mockState[key] : initial;
      const setter = vi.fn((newVal) => {
        if (typeof newVal === 'function') {
          mockState[key] = newVal(mockState[key] !== undefined ? mockState[key] : initial);
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
    { id: 'h2', name: 'Quartz Basin', state: 'AZ', minerals: ['Quartz', 'Agate'] },
  ];

  beforeEach(() => {
    mockState = { query: '', focused: false, activeIndex: -1 };
  });

  it('renders input with combobox role and initial collapsed state', () => {
    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    expect(tree).toBeDefined();

    const input = tree.props.children[0].props.children[1];
    expect(input.props.role).toBe('combobox');
    expect(input.props['aria-autocomplete']).toBe('list');
    expect(input.props['aria-expanded']).toBe(false);
    expect(input.props['aria-activedescendant']).toBeUndefined();
  });

  it('renders listbox and options when query matches hotspots', () => {
    mockState = { query: 'Quartz', focused: true, activeIndex: -1 };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const listbox = tree.props.children[1];

    expect(listbox.props.role).toBe('listbox');
    expect(listbox.props['aria-label']).toBe('Hotspot search results');

    const options = listbox.props.children;
    expect(options).toHaveLength(2);
    expect(options[0].props.role).toBe('option');
    expect(options[0].props['aria-selected']).toBe(false);
    expect(options[0].props.id).toBe(':id:-option-0');
  });

  it('updates activeIndex and aria-activedescendant on ArrowDown', () => {
    mockState = { query: 'Quartz', focused: true, activeIndex: -1 };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const input = tree.props.children[0].props.children[1];

    const preventDefault = vi.fn();
    input.props.onKeyDown({ key: 'ArrowDown', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(mockState.activeIndex).toBe(0);
  });

  it('selects option with Enter key when activeIndex is set', () => {
    mockState = { query: 'Quartz', focused: true, activeIndex: 1 };
    const onSelect = vi.fn();

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect });
    const input = tree.props.children[0].props.children[1];

    const preventDefault = vi.fn();
    input.props.onKeyDown({ key: 'Enter', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(sampleHotspots[1]);
  });

  it('handles Escape key to clear search query and reset state', () => {
    mockState = { query: 'Quartz', focused: true, activeIndex: 1 };

    const tree = MapSearchBar({ hotspots: sampleHotspots, onSelect: vi.fn() });
    const input = tree.props.children[0].props.children[1];

    input.props.onKeyDown({ key: 'Escape' });
    expect(mockState.query).toBe('');
    expect(mockState.focused).toBe(false);
    expect(mockState.activeIndex).toBe(-1);
  });
});
