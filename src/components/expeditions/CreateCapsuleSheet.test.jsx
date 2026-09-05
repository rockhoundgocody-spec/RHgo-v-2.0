import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  let idCounter = 0;
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => `:r${++idCounter}:`,
    useEffect: vi.fn(),
  };
});

// Mock framer-motion to simplify rendering motion elements
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: { me: vi.fn().mockResolvedValue({ email: 'test@example.com' }) },
    entities: { MemoryCapsule: { create: vi.fn().mockResolvedValue({}) } },
  },
}));

import CreateCapsuleSheet from './CreateCapsuleSheet';

describe('CreateCapsuleSheet', () => {
  it('does not render when closed', () => {
    const tree = CreateCapsuleSheet({ open: false, onClose: vi.fn() });
    expect(tree.props.children).toBe(false);
  });

  it('renders modal dialog with accessible attributes when open', () => {
    const tree = CreateCapsuleSheet({ open: true, onClose: vi.fn() });
    expect(tree).toBeDefined();

    // Backdrop + Sheet container inside Fragment
    const [, dialogSheet] = tree.props.children.props.children;

    expect(dialogSheet.props.role).toBe('dialog');
    expect(dialogSheet.props['aria-modal']).toBe('true');
    expect(dialogSheet.props.id).toBeDefined();
    expect(dialogSheet.props['aria-labelledby']).toBeDefined();
  });

  it('renders form fields with labels and mood buttons with aria-pressed', () => {
    const tree = CreateCapsuleSheet({ open: true, onClose: vi.fn() });
    const [, dialogSheet] = tree.props.children.props.children;
    const scrollContainer = dialogSheet.props.children[1];
    const formFields = scrollContainer.props.children[1].props.children;

    // Field 0: Trip Name
    const nameFieldElement = formFields[0];
    const nameFieldRendered = nameFieldElement.type(nameFieldElement.props);
    const [nameLabel, nameInput] = nameFieldRendered.props.children;

    expect(nameLabel.type).toBe('label');
    expect(nameLabel.props.htmlFor).toBe(nameInput.props.id);
    expect(nameInput.props.className).toContain('focus-visible:ring-2');

    // Field 3: Mood selector
    const moodFieldElement = formFields[3];
    const moodFieldRendered = moodFieldElement.type(moodFieldElement.props);
    const moodGroup = moodFieldRendered.props.children[1];
    expect(moodGroup.props['aria-label']).toBe('Trip mood selector');

    const moodButtons = moodGroup.props.children;
    expect(moodButtons).toHaveLength(6);

    // Default selected mood is 'curious' (index 4)
    expect(moodButtons[4].props['aria-pressed']).toBe(true);
    expect(moodButtons[0].props['aria-pressed']).toBe(false);

    // Emoji icon should be aria-hidden
    const iconSpan = moodButtons[0].props.children[0];
    expect(iconSpan.props['aria-hidden']).toBe('true');

    // Save button disabled title tooltip
    const saveBtn = formFields[6];
    expect(saveBtn.props.disabled).toBe(true);
    expect(saveBtn.props.title).toBe('Enter a trip name to log');
  });
});
