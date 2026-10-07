import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => ':r0:',
    useEffect: vi.fn(),
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
    entities: {
      Specimen: { list: vi.fn().mockResolvedValue([]) },
      MarketListing: { create: vi.fn() },
    },
  },
}));

import CreateListingSheet from './CreateListingSheet';

describe('CreateListingSheet', () => {
  it('returns null when closed or no open prop', () => {
    const element = CreateListingSheet({ open: false, onClose: vi.fn() });
    expect(element.props.children).toBe(false);
  });

  it('renders modal sheet with correct ARIA attributes and accessible form controls when open', () => {
    const prefilledSpecimen = {
      id: 'spec-1',
      mineral_name: 'Amethyst Cluster',
      rarity: 'rare',
      found_at: 'Thunder Bay',
    };

    const element = CreateListingSheet({
      open: true,
      onClose: vi.fn(),
      prefillSpecimen: prefilledSpecimen,
    });

    const backdropAndModal = element.props.children;
    const modalDiv = backdropAndModal.props.children[1];

    // Check dialog accessibility attributes
    expect(modalDiv.props.role).toBe('dialog');
    expect(modalDiv.props['aria-modal']).toBe('true');
    expect(modalDiv.props['aria-labelledby']).toBe('create-listing-title');

    const [, headerDiv, contentDiv] = modalDiv.props.children;

    // Check title ID and close button
    const [titleHeading, closeBtn] = headerDiv.props.children;
    expect(titleHeading.props.id).toBe('create-listing-title');
    expect(closeBtn.props['aria-label']).toBe('Close trade listing');
    expect(closeBtn.props.className).toContain('focus-visible:ring-2');

    // Check prefilled specimen form fields
    const [, formFields] = contentDiv.props.children;
    const [titleField, descField, priceFieldRow] = formFields.props.children;

    // Check Title input & label association
    const titleLabel = titleField.props.children[0];
    const titleInput = titleField.props.children[1];
    expect(titleLabel.props.htmlFor).toBeTruthy();
    expect(titleInput.props.id).toBe(titleLabel.props.htmlFor);
    expect(titleInput.props.className).toContain('focus-visible:ring-2');

    // Check Description input & label association
    const descLabel = descField.props.children[0];
    const descInput = descField.props.children[1];
    expect(descLabel.props.htmlFor).toBeTruthy();
    expect(descInput.props.id).toBe(descLabel.props.htmlFor);
    expect(descInput.props.className).toContain('focus-visible:ring-2');

    // Check Price input & Trade only switch button
    const [priceCol, switchCol] = priceFieldRow.props.children;
    const priceLabel = priceCol.props.children[0];
    const priceInput = priceCol.props.children[1].props.children[1];
    expect(priceLabel.props.htmlFor).toBeTruthy();
    expect(priceInput.props.id).toBe(priceLabel.props.htmlFor);
    expect(priceInput.props.className).toContain('focus-visible:ring-2');

    const switchBtn = switchCol.props.children[1];
    expect(switchBtn.props.role).toBe('switch');
    expect(switchBtn.props['aria-checked']).toBe(false);
    expect(switchBtn.props['aria-label']).toBe('Trade only');
    expect(switchBtn.props.className).toContain('focus-visible:ring-2');
  });

  it('renders submit button with title tooltip when disabled without a selected specimen', () => {
    const element = CreateListingSheet({
      open: true,
      onClose: vi.fn(),
      prefillSpecimen: null,
    });

    const backdropAndModal = element.props.children;
    const modalDiv = backdropAndModal.props.children[1];
    const contentDiv = modalDiv.props.children[2];
    const submitBtn = contentDiv.props.children[2];

    expect(submitBtn.props.disabled).toBe(true);
    expect(submitBtn.props.title).toBe('Select a specimen to list');
    expect(submitBtn.props.className).toContain('focus-visible:ring-2');
  });
});
