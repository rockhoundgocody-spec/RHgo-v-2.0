import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  let idCounter = 0;
  return {
    ...actual,
    useId: () => `:r${idCounter++}:`,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn() },
    entities: { MemoryCapsule: { create: vi.fn() } },
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, onClick, id, role, ...props }) => (
      <div className={className} style={style} onClick={onClick} id={id} role={role} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

import CreateCapsuleSheet from './CreateCapsuleSheet';

describe('CreateCapsuleSheet', () => {
  it('renders dialog and accessible elements when open', () => {
    const element = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });

    // AnimatePresence wraps the fragment
    const fragment = element.props.children;
    expect(fragment.type).toBe(React.Fragment);

    // Find bottom sheet motion.div container
    const dialogDiv = fragment.props.children[1];
    expect(dialogDiv.props.role).toBe('dialog');
    expect(dialogDiv.props['aria-modal']).toBe('true');
    expect(dialogDiv.props['aria-labelledby']).toBe('create-capsule-title');

    // Inspect content tree
    const scrollContainer = dialogDiv.props.children[1];
    const formFieldsContainer = scrollContainer.props.children[1];
    const formFields = formFieldsContainer.props.children;

    // Mood selection group
    const moodGroupField = formFields[3];
    const moodGroup = moodGroupField.props.children[1];
    expect(moodGroup.props.role).toBe('group');
    expect(moodGroup.props['aria-label']).toBe('Trip Mood Selection');

    const moodButtons = moodGroup.props.children;
    expect(moodButtons).toHaveLength(6);
    // Default mood snapshot is 'curious'
    const curiousButton = moodButtons.find((b) => b.key === 'curious');
    expect(curiousButton.props['aria-pressed']).toBe(true);
    expect(curiousButton.props.className).toContain('focus-visible:ring-purple-400');

    const excitedButton = moodButtons.find((b) => b.key === 'excited');
    expect(excitedButton.props['aria-pressed']).toBe(false);

    // Verify decorative emoji inside mood button is aria-hidden
    const iconSpan = excitedButton.props.children[0];
    expect(iconSpan.props['aria-hidden']).toBe('true');
  });
});
