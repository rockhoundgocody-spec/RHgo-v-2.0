import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  let idCounter = 0;
  return {
    ...actual,
    useState: (initial) => [
      typeof initial === 'function' ? initial() : initial,
      vi.fn(),
    ],
    useMemo: (factory) => factory(),
    useId: () => `:r${++idCounter}:`,
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'explorer@example.com' }),
    },
    entities: {
      MemoryCapsule: {
        create: vi.fn().mockResolvedValue({ id: 'cap-1' }),
      },
    },
  },
}));

import CreateCapsuleSheet from './CreateCapsuleSheet.jsx';

describe('CreateCapsuleSheet', () => {
  it('renders modal sheet dialog with ARIA attributes when open is true', () => {
    const component = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });
    expect(component).toBeDefined();

    // component is AnimatePresence -> Fragment -> array of [backdrop, dialog]
    const fragment = component.props.children;
    const childrenArray = React.Children.toArray(fragment.props.children);
    expect(childrenArray).toHaveLength(2);

    const dialogDiv = childrenArray[1];
    expect(dialogDiv.props.role).toBe('dialog');
    expect(dialogDiv.props['aria-modal']).toBe('true');
    expect(dialogDiv.props['aria-labelledby']).toBe('capsule-sheet-title');

    // Inside dialog: drag handle + content container
    const dialogChildren = React.Children.toArray(dialogDiv.props.children);
    const contentContainer = dialogChildren[1];

    const contentChildren = React.Children.toArray(contentContainer.props.children);
    const headerRow = contentChildren[0];

    const headerChildren = React.Children.toArray(headerRow.props.children);
    const h2Title = headerChildren[0];
    const closeBtn = headerChildren[1];

    expect(h2Title.props.id).toBe('capsule-sheet-title');
    expect(closeBtn.props['aria-label']).toBe('Close');
    expect(closeBtn.props.className).toContain('focus-visible:ring-2');
  });

  it('renders nothing when open is false', () => {
    const component = CreateCapsuleSheet({ open: false, onClose: vi.fn(), onCreate: vi.fn() });
    expect(component.props.children).toBeFalsy();
  });
});
