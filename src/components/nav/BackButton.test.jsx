import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    self: 1,
    top: 1,
    location: { origin: 'http://localhost' },
  };
}

const mockNavigate = vi.fn();
let mockPathname = '/specimen/123';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('BackButton', () => {
  let BackButton;

  beforeAll(async () => {
    const mod = await import('./BackButton');
    BackButton = mod.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/specimen/123';
  });

  it('renders button element when not on a primary root path', () => {
    mockPathname = '/specimen/123';
    const tree = BackButton({ className: 'custom-class' });

    expect(tree).not.toBeNull();
    expect(tree.type).toBe('button');
    expect(tree.props['aria-label']).toBe('Go back');
    expect(tree.props.type).toBe('button');
    expect(tree.props.className).toContain('focus-visible:ring-amethyst-glow/50');
    expect(tree.props.className).toContain('custom-class');
  });

  it('returns null when on a primary root path', () => {
    const primaryRoots = ['/', '/explore', '/scan', '/collection', '/market'];

    for (const rootPath of primaryRoots) {
      mockPathname = rootPath;
      const tree = BackButton({});
      expect(tree).toBeNull();
    }
  });

  it('triggers navigate(-1) when clicked', () => {
    mockPathname = '/settings';
    const tree = BackButton({});

    expect(tree).not.toBeNull();
    tree.props.onClick();

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
