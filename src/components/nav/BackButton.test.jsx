import { describe, it, expect, vi, beforeAll } from 'vitest';

const mockNavigate = vi.fn();
let mockPathname = '/settings';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('BackButton', () => {
  let BackButton;

  beforeAll(async () => {
    if (typeof globalThis.window === 'undefined') {
      globalThis.window = {
        self: 1,
        top: 1,
      };
    }
    const mod = await import('./BackButton');
    BackButton = mod.default;
  });

  it('returns null on primary root paths', () => {
    mockPathname = '/explore';
    const element = BackButton({});
    expect(element).toBeNull();
  });

  it('renders back button with aria-label and focus-visible ring styles on non-root paths', () => {
    mockPathname = '/settings';
    const element = BackButton({});

    expect(element).not.toBeNull();
    expect(element.type).toBe('button');
    expect(element.props['aria-label']).toBe('Go back');
    expect(element.props.className).toContain('focus-visible:ring-2');
    expect(element.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });
});
