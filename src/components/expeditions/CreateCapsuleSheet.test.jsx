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
  it('returns null or empty when open is false', () => {
    const tree = CreateCapsuleSheet({ open: false, onClose: vi.fn(), onCreate: vi.fn() });
    expect(tree.props.children).toBeFalsy();
  });

  it('renders accessible dialog container and header when open is true', () => {
    const tree = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });
    expect(tree).toBeDefined();

    const [backdrop, sheet] = tree.props.children.props.children;
    expect(sheet.props.id).toBe('create-capsule-dialog');
    expect(sheet.props.role).toBe('dialog');
    expect(sheet.props['aria-modal']).toBe('true');
    expect(sheet.props['aria-labelledby']).toBe('create-capsule-title');

    const contentScroll = sheet.props.children[1];
    const headerRow = contentScroll.props.children[0];
    const [titleH2, closeButton] = headerRow.props.children;

    expect(titleH2.props.id).toBe('create-capsule-title');
    expect(titleH2.props.children).toBe('Log a Trip');

    expect(closeButton.props['aria-label']).toBe('Close trip log sheet');
    expect(closeButton.props.className).toContain('focus-visible:ring-2');
  });

  it('renders mood buttons with aria-pressed, aria-label, aria-hidden icon, and focus rings', () => {
    const tree = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });
    const [, sheet] = tree.props.children.props.children;
    const contentScroll = sheet.props.children[1];
    const formContainer = contentScroll.props.children[1];
    const formFields = formContainer.props.children;

    // Mood field is the 4th child (index 3)
    const moodField = formFields[3];
    const moodFieldComponent = moodField.type(moodField.props);
    const [, moodGroup] = moodFieldComponent.props.children;

    expect(moodGroup.props.role).toBe('group');
    expect(moodGroup.props['aria-label']).toBe('Select mood snapshot');

    const moodButtons = moodGroup.props.children;
    expect(moodButtons.length).toBeGreaterThan(0);

    // Initial default mood is 'curious'
    const curiousBtn = moodButtons.find((btn) => btn.props['aria-label'] === 'Mood: Curious');
    expect(curiousBtn).toBeDefined();
    expect(curiousBtn.props['aria-pressed']).toBe(true);
    expect(curiousBtn.props.className).toContain('focus-visible:ring-2');

    const excitedBtn = moodButtons.find((btn) => btn.props['aria-label'] === 'Mood: Excited');
    expect(excitedBtn).toBeDefined();
    expect(excitedBtn.props['aria-pressed']).toBe(false);

    // Verify emoji span is aria-hidden="true"
    const [emojiSpan] = curiousBtn.props.children;
    expect(emojiSpan.props['aria-hidden']).toBe('true');
  });

  it('associates input labels with form field IDs and applies focus rings', () => {
    const tree = CreateCapsuleSheet({ open: true, onClose: vi.fn(), onCreate: vi.fn() });
    const [, sheet] = tree.props.children.props.children;
    const contentScroll = sheet.props.children[1];
    const formContainer = contentScroll.props.children[1];
    const formFields = formContainer.props.children;

    // Trip Name field is index 0
    const nameField = formFields[0];
    const nameFieldComponent = nameField.type(nameField.props);
    const [nameLabel, nameInput] = nameFieldComponent.props.children;

    expect(nameLabel.type).toBe('label');
    expect(nameLabel.props.htmlFor).toBeDefined();
    expect(nameInput.props.id).toBe(nameLabel.props.htmlFor);
    expect(nameInput.props.className).toContain('focus-visible:ring-2');
  });
});
