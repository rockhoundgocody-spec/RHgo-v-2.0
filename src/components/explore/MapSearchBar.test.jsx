import { describe, it, expect, vi } from 'vitest';

let mockQuery = '';
let mockFocused = false;

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => {
      if (typeof initial === 'string') {
        return [mockQuery !== undefined && mockQuery !== '' ? mockQuery : initial, vi.fn()];
      }
      if (typeof initial === 'boolean') {
        return [mockFocused !== undefined ? mockFocused : initial, vi.fn()];
      }
      return [initial, vi.fn()];
    },
    useMemo: (cb) => cb(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
    useId: () => ':r1:',
  };
});

import MapSearchBar from './MapSearchBar';

const mockHotspots = [
  { id: 'h1', name: 'Quartz Ridge Mine', state: 'Colorado', minerals: ['Quartz', 'Gold'] },
  { id: 'h2', name: 'Amethyst Cavern', state: 'Arizona', minerals: ['Amethyst', 'Agate'] },
];

describe('MapSearchBar', () => {
  it('renders input with combobox role, aria-label, and aria-autocomplete', () => {
    mockQuery = '';
    mockFocused = false;
    const result = MapSearchBar({ hotspots: mockHotspots, onSelect: vi.fn() });
    expect(result).not.toBeNull();

    const input = result.props.children[0].props.children[1];
    expect(input.props.role).toBe('combobox');
    expect(input.props['aria-label']).toBe('Search hotspots, minerals, or states');
    expect(input.props['aria-autocomplete']).toBe('list');
    expect(input.props['aria-expanded']).toBe(false);
  });

  it('renders dropdown listbox and option buttons with correct ARIA attributes when results exist', () => {
    mockQuery = 'Quartz';
    mockFocused = true;
    const onSelect = vi.fn();
    const result = MapSearchBar({ hotspots: mockHotspots, onSelect });

    const input = result.props.children[0].props.children[1];
    expect(input.props['aria-expanded']).toBe(true);
    expect(input.props['aria-controls']).toBe(':r1:');

    const clearButton = result.props.children[0].props.children[2];
    expect(clearButton).toBeDefined();
    expect(clearButton.props.type).toBe('button');
    expect(clearButton.props['aria-label']).toBe('Clear search query');
    expect(clearButton.props.className).toContain('focus-visible:ring-2');

    const dropdown = result.props.children[1];
    expect(dropdown.props.id).toBe(':r1:');
    expect(dropdown.props.role).toBe('listbox');
    expect(dropdown.props['aria-label']).toBe('Search results');

    const options = dropdown.props.children;
    expect(options).toHaveLength(1);

    const optionBtn = options[0];
    expect(optionBtn.props.type).toBe('button');
    expect(optionBtn.props.role).toBe('option');
    expect(optionBtn.props['aria-selected']).toBe('false');
    expect(optionBtn.props['aria-label']).toBe('Quartz Ridge Mine, Colorado');
    expect(optionBtn.props.className).toContain('focus-visible:ring-2');

    // Simulate clicking option
    optionBtn.props.onClick();
    expect(onSelect).toHaveBeenCalledWith(mockHotspots[0]);
  });
});
