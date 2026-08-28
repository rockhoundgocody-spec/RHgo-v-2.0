import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const reactState = vi.hoisted(() => ({ forceOpen: false, call: 0 }));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useEffect: () => {},
    useState: (initial) => {
      const value = reactState.call++ === 0 && reactState.forceOpen
        ? true
        : typeof initial === 'function' ? initial() : initial;
      return [value, vi.fn()];
    },
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn() },
    entities: { Specimen: { list: vi.fn() }, Post: { create: vi.fn() } },
    integrations: { Core: { UploadFile: vi.fn().mockResolvedValue({ file_url: 'http://example.com/clean.jpg' }) } },
  },
}));

vi.mock('@/lib/stripExif', () => ({
  stripExif: vi.fn().mockImplementation((file) => Promise.resolve(file)),
}));

function findByProp(node, prop, value, matches = []) {
  if (!node || typeof node !== 'object') return matches;
  if (node.props?.[prop] === value) matches.push(node);
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    findByProp(child, prop, value, matches);
  }
  return matches;
}

let PostComposer;

beforeAll(async () => {
  const mockWindow = { location: { origin: 'http://localhost' } };
  mockWindow.self = mockWindow;
  mockWindow.top = mockWindow;
  globalThis.window = mockWindow;
  PostComposer = (await import('./PostComposer.jsx')).default;
});

beforeEach(() => {
  reactState.call = 0;
  reactState.forceOpen = false;
});

import { stripExif } from '@/lib/stripExif';

describe('PostComposer accessibility', () => {
  it('exposes an accessible, focus-visible collapsed trigger', () => {
    const tree = PostComposer({ onPosted: vi.fn() });

    expect(tree.type).toBe('button');
    expect(tree.props.type).toBe('button');
    expect(tree.props['aria-label']).toBe('Open post composer');
    expect(tree.props['aria-controls']).toBe('post-composer-panel');
    expect(tree.props.className).toContain('focus-visible:ring-2');
  });

  it('links expanded controls to their content and labels icon-only actions', () => {
    reactState.forceOpen = true;
    const tree = PostComposer({ onPosted: vi.fn() });

    expect(tree.props.id).toBe('post-composer-panel');
    expect(tree.props['aria-labelledby']).toBe('post-composer-title');
    expect(findByProp(tree, 'aria-label', 'Cancel post')).toHaveLength(1);
    expect(findByProp(tree, 'aria-label', 'Post text')).toHaveLength(1);
    expect(findByProp(tree, 'aria-controls', 'post-composer-finds')).toHaveLength(1);
  });

  it('sanitizes EXIF metadata when an image is selected', async () => {
    reactState.forceOpen = true;
    const tree = PostComposer({ onPosted: vi.fn() });
    const fileInputs = findByProp(tree, 'aria-label', 'Upload image');
    expect(fileInputs).toHaveLength(1);

    const mockFile = new File(['dummy content'], 'photo.jpg', { type: 'image/jpeg' });
    await fileInputs[0].props.onChange({ target: { files: [mockFile] } });

    expect(stripExif).toHaveBeenCalledWith(mockFile);
  });
});
