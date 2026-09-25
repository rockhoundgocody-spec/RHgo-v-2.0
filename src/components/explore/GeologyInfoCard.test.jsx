import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('@/lib/macrostrat', () => ({
  fetchGeologyAt: vi.fn().mockResolvedValue([]),
}));

import GeologyInfoCard from './GeologyInfoCard.jsx';

describe('GeologyInfoCard', () => {
  it('renders loading state with role="status" when units are loading', () => {
    const element = GeologyInfoCard({ lat: 37.77, lng: -122.41, onClose: vi.fn() });

    expect(element).toBeDefined();
    const children = element.props.children;
    const loadingDiv = children.find(c => c && c.props && c.props.role === 'status');
    expect(loadingDiv).toBeDefined();
    expect(loadingDiv.props.role).toBe('status');
  });

  it('renders close button with type="button" and descriptive aria-label', () => {
    const onClose = vi.fn();
    const element = GeologyInfoCard({ lat: 37.77, lng: -122.41, onClose });

    const header = element.props.children[0];
    const headerChildren = header.props.children;
    const closeBtn = headerChildren[3];

    expect(closeBtn).toBeDefined();
    expect(closeBtn.props.type).toBe('button');
    expect(closeBtn.props['aria-label']).toBe('Close geology panel');
  });
});
