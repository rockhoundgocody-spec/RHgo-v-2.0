import { describe, it, expect, vi, beforeAll } from 'vitest';

beforeAll(() => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: {},
      top: {},
    };
  }
});

const mockNavigate = vi.fn();
let mockPathname = '/specimen/123';

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

describe('BackButton component', () => {
  it('returns null on primary root paths', async () => {
    const { default: BackButton } = await import('./BackButton');
    mockPathname = '/explore';
    const result = BackButton({});
    expect(result).toBeNull();
  });

  it('returns JSX element with proper focus-visible classes on non-root paths', async () => {
    const { default: BackButton } = await import('./BackButton');
    mockPathname = '/specimen/123';
    const result = BackButton({});
    expect(result).not.toBeNull();
    expect(result.type).toBe('button');
    expect(result.props['aria-label']).toBe('Go back');
    expect(result.props.className).toContain('focus-visible:ring-2');
    expect(result.props.className).toContain('focus-visible:ring-amethyst-glow/50');
  });

  it('triggers navigate(-1) when onClick handler is called', async () => {
    const { default: BackButton } = await import('./BackButton');
    mockPathname = '/specimen/123';
    const result = BackButton({});
    result.props.onClick();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
