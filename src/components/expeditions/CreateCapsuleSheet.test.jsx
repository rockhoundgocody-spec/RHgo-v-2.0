import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
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
    auth: { me: vi.fn() },
    entities: { MemoryCapsule: { create: vi.fn() } },
  },
}));

import CreateCapsuleSheet from './CreateCapsuleSheet';

describe('CreateCapsuleSheet', () => {
  it('renders nothing when open is false', () => {
    const element = CreateCapsuleSheet({ open: false, onClose: vi.fn(), onCreate: vi.fn() });
    expect(element.props.children).toBe(false);
  });

  it('renders modal sheet with correct ARIA attributes and focus styles when open is true', () => {
    const element = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });

    // Fragment children: backdrop (0) and modal sheet (1)
    const [, dialogNode] = element.props.children.props.children;

    expect(dialogNode.props.role).toBe('dialog');
    expect(dialogNode.props['aria-modal']).toBe('true');
    expect(dialogNode.props['aria-labelledby']).toBe('create-capsule-title');

    // Check header title ID
    const [, scrollContent] = dialogNode.props.children;
    const [headerDiv, formFieldsDiv] = scrollContent.props.children;
    const [titleHeading, closeBtn] = headerDiv.props.children;

    expect(titleHeading.props.id).toBe('create-capsule-title');
    expect(closeBtn.props['aria-label']).toBe('Close trip log dialog');
    expect(closeBtn.props.className).toContain('focus-visible:ring-2');

    // Check form fields
    const formFields = formFieldsDiv.props.children;

    // Field 0: Trip Name
    const tripNameField = formFields[0];
    expect(tripNameField.props.label).toBe('Trip Name');
    expect(tripNameField.props.id).toBe('expedition_name');
    const tripNameInput = tripNameField.props.children;
    expect(tripNameInput.props.id).toBe('expedition_name');
    expect(tripNameInput.props.className).toContain('focus-visible:ring-2');

    // Field 3: Mood selection
    const moodField = formFields[3];
    const moodGroup = moodField.props.children;
    expect(moodGroup.props.role).toBe('group');
    expect(moodGroup.props['aria-label']).toBe('Trip Mood Selection');

    const moodButtons = moodGroup.props.children;
    expect(moodButtons.length).toBeGreaterThan(0);

    // Curious mood is default selected
    const curiousBtn = moodButtons.find((b) => b.key === 'curious');
    expect(curiousBtn.props['aria-pressed']).toBe(true);
    expect(curiousBtn.props.className).toContain('focus-visible:ring-2');

    // Decorative emoji span check
    const [emojiSpan] = curiousBtn.props.children;
    expect(emojiSpan.props['aria-hidden']).toBe('true');
  });
});
