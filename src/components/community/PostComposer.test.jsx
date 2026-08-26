import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
    useEffect: (cb) => { cb(); },
  };
});

let PostComposer;
const mockMe = vi.fn();
const mockSpecimenList = vi.fn();
const mockPostCreate = vi.fn();

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: () => mockMe(),
    },
    entities: {
      Specimen: {
        list: (...args) => mockSpecimenList(...args),
      },
      Post: {
        create: (...args) => mockPostCreate(...args),
      },
    },
    integrations: {
      Core: {
        UploadFile: vi.fn(),
      },
    },
  },
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
  const mod = await import('./PostComposer.jsx');
  PostComposer = mod.default;
});

describe('PostComposer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockResolvedValue({ email: 'test@example.com', full_name: 'Test Hound' });
    mockSpecimenList.mockResolvedValue([
      { id: 'spec-1', mineral_name: 'Amethyst', rarity: 'rare', image_url: '' },
    ]);
  });

  it('renders collapsed trigger button with aria-label and focus ring', () => {
    const tree = PostComposer({ onPosted: vi.fn() });
    expect(tree).not.toBeNull();
    expect(tree.type).toBe('button');
    expect(tree.props['aria-label']).toBe('Open post composer');
    expect(tree.props.className).toContain('focus-visible:ring-2');
    expect(tree.props.className).toContain('focus-visible:ring-white/50');
  });
});
