import { describe, it, expect, vi, beforeAll } from 'vitest';

let BackButton;
const mockNavigate = vi.fn();
let mockPathname = '/specimens/123';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

beforeAll(async () => {
  if (typeof globalThis.window === 'undefined') {
    const mockWin = {
      location: { origin: 'http://localhost' },
    };
    mockWin.self = mockWin;
    mockWin.top = mockWin;
    globalThis.window = mockWin;
  }
  const mod = await import('./BackButton');
  BackButton = mod.default;
});

describe('BackButton', () => {
  it('renders button with focus-visible accessibility ring and aria-label on sub-routes', () => {
    mockPathname = '/specimens/123';
    const tree = BackButton({ className: 'custom-class' });

    expect(tree).not.toBeNull();
    expect(tree.type).toBe('button');
    expect(tree.props['aria-label']).toBe('Go back');
    expect(tree.props.className).toContain('focus-visible:ring-2');
    expect(tree.props.className).toContain('focus-visible:ring-amethyst-glow/50');
    expect(tree.props.className).toContain('custom-class');

    tree.props.onClick();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('returns null on root routes', () => {
    mockPathname = '/explore';
    const tree = BackButton({});

    expect(tree).toBeNull();
  });
});
