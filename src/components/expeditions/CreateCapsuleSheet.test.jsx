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

// Mock framer-motion to simplify element inspection
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock base44 Client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'explorer@example.com' }),
    },
    entities: {
      MemoryCapsule: {
        create: vi.fn().mockResolvedValue({ id: 'capsule-1' }),
      },
    },
  },
}));

import CreateCapsuleSheet from './CreateCapsuleSheet';

describe('CreateCapsuleSheet', () => {
  it('renders nothing when open is false', () => {
    const element = CreateCapsuleSheet({ open: false, onClose: vi.fn() });
    expect(element).toBeDefined();
    // AnimatePresence children when open is false evaluates to false/null
    expect(element.props.children).toBe(false);
  });

  it('renders modal dialog overlay with accessible role, aria-modal, and aria-labelledby attributes when open is true', () => {
    const element = CreateCapsuleSheet({ open: true, onClose: vi.fn() });

    expect(element).toBeDefined();
    const fragment = element.props.children;
    expect(fragment).toBeTruthy();

    const [, dialog] = fragment.props.children;

    expect(dialog.props.id).toBe('create-capsule-dialog');
    expect(dialog.props.role).toBe('dialog');
    expect(dialog.props['aria-modal']).toBe('true');
    expect(dialog.props['aria-labelledby']).toBe('create-capsule-title');
  });

  it('renders form controls with associated labels and mood buttons with aria-pressed state', () => {
    const element = CreateCapsuleSheet({ open: true, onClose: vi.fn() });
    const fragment = element.props.children;
    const [, dialog] = fragment.props.children;

    // dialog children: handle bar (index 0), scroll container (index 1)
    const [, scrollContainer] = dialog.props.children;
    const [header, formFieldsContainer] = scrollContainer.props.children;

    // Check title in header
    const [h2Title, closeButton] = header.props.children;
    expect(h2Title.props.id).toBe('create-capsule-title');
    expect(h2Title.props.children).toBe('Log a Trip');
    expect(closeButton.props['aria-label']).toBe('Close');
    expect(closeButton.props.className).toContain('focus-visible:ring-2');

    // Form fields in formFieldsContainer: Name, Location, Date, Mood, Story, Error, Submit Button
    const formFields = formFieldsContainer.props.children;

    const nameField = formFields[0];
    const locationField = formFields[1];
    const dateField = formFields[2];
    const moodField = formFields[3];
    const storyField = formFields[4];
    const submitButton = formFields[6];

    // Check label/input ID linkages
    const nameLabel = nameField.props.htmlFor;
    const nameInput = nameField.props.children;
    expect(nameLabel).toBeDefined();
    expect(nameInput.props.id).toBe(nameLabel);
    expect(nameInput.props.className).toContain('focus-visible:ring-2');

    const locationLabel = locationField.props.htmlFor;
    const locationInput = locationField.props.children.props.children[1];
    expect(locationLabel).toBeDefined();
    expect(locationInput.props.id).toBe(locationLabel);

    const dateLabel = dateField.props.htmlFor;
    const dateInput = dateField.props.children.props.children[1];
    expect(dateLabel).toBeDefined();
    expect(dateInput.props.id).toBe(dateLabel);

    const storyLabel = storyField.props.htmlFor;
    const storyTextarea = storyField.props.children;
    expect(storyLabel).toBeDefined();
    expect(storyTextarea.props.id).toBe(storyLabel);

    // Check mood selection group
    const moodGroup = moodField.props.children;
    expect(moodGroup.props.role).toBe('group');
    expect(moodGroup.props['aria-label']).toBe('Trip Mood');

    const moodButtons = moodGroup.props.children;
    expect(moodButtons).toHaveLength(6);

    // 'curious' is initial state
    const curiousBtn = moodButtons.find((b) => b.key === 'curious');
    const excitedBtn = moodButtons.find((b) => b.key === 'excited');

    expect(curiousBtn.props['aria-pressed']).toBe(true);
    expect(excitedBtn.props['aria-pressed']).toBe(false);

    // Emoji is aria-hidden
    const [emojiSpan] = curiousBtn.props.children;
    expect(emojiSpan.props['aria-hidden']).toBe('true');

    // Check submit button
    expect(submitButton.props.className).toContain('focus-visible:ring-2');
  });
});
