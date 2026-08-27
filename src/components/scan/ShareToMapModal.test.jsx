import { describe, it, expect, vi } from 'vitest';

const mockInvoke = vi.hoisted(() => vi.fn());

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

import ShareToMapModal from './ShareToMapModal.jsx';

describe('ShareToMapModal', () => {
  const mockSpecimen = { id: 'spec-1', lat: 37.7749, lng: -122.4194, image_url: 'http://example.com/img.jpg' };
  const mockResult = { top_match: 'Amethyst', rarity: 'rare', confidence: 0.95 };

  it('returns null when open is false', () => {
    const tree = ShareToMapModal({ open: false, specimen: mockSpecimen, result: mockResult, onClose: vi.fn() });
    expect(tree).toBeNull();
  });

  it('renders modal with ARIA dialog semantics when open', () => {
    const tree = ShareToMapModal({ open: true, specimen: mockSpecimen, result: mockResult, onClose: vi.fn() });
    expect(tree).toBeDefined();

    const modalDialog = tree.props.children;
    expect(modalDialog.props.role).toBe('dialog');
    expect(modalDialog.props['aria-modal']).toBe('true');
    expect(modalDialog.props['aria-labelledby']).toBe('share-modal-title');
  });

  it('disables submit button when lat/lng are missing', () => {
    const invalidSpecimen = { id: 'spec-2', lat: null, lng: null };
    const tree = ShareToMapModal({ open: true, specimen: invalidSpecimen, result: mockResult, onClose: vi.fn() });

    const modalDialog = tree.props.children;
    const innerContent = modalDialog.props.children[1]; // non-shared fragment
    const buttonGroup = innerContent.props.children[3]; // flex gap-2 buttons container
    const submitBtn = buttonGroup.props.children[1];

    expect(submitBtn.props.disabled).toBe(true);
  });

  it('triggers base44.functions.invoke when submit handler is called', async () => {
    mockInvoke.mockResolvedValueOnce({});
    const tree = ShareToMapModal({ open: true, specimen: mockSpecimen, result: mockResult, onClose: vi.fn() });

    const modalDialog = tree.props.children;
    const innerContent = modalDialog.props.children[1];
    const buttonGroup = innerContent.props.children[3];
    const submitBtn = buttonGroup.props.children[1];

    await submitBtn.props.onClick();

    expect(mockInvoke).toHaveBeenCalledWith('identifySpecimen', {
      specimen_id: 'spec-1',
      save: false,
      share_to_map: true,
    });
  });
});
