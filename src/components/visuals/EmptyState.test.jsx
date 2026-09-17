import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => 'empty-state-id',
  };
});

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style, ...props }) =>
    React.createElement('a', { href: to, className, style, ...props }, children),
}));

import EmptyState from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders title, body, and aria-hidden decorative icon orb container', () => {
    const el = EmptyState({
      icon: '💎',
      title: 'No specimens yet',
      body: 'Scan your first rock to see it here.',
    });

    expect(el).toBeDefined();
    expect(el.props.role).toBe('status');

    const [orbDiv, titleEl, bodyEl] = el.props.children;

    // Decorative orb container has aria-hidden="true"
    expect(orbDiv.props['aria-hidden']).toBe('true');
    expect(orbDiv.props.children).toBe('💎');

    // Title & Body
    expect(titleEl.props.children).toBe('No specimens yet');
    expect(bodyEl.props.children).toBe('Scan your first rock to see it here.');
  });

  it('falls back to description prop when body is undefined', () => {
    const el = EmptyState({
      icon: '💎',
      title: 'No listings yet',
      description: 'Be the first to list a specimen for trade.',
    });

    const [, , bodyEl] = el.props.children;
    expect(bodyEl.props.children).toBe('Be the first to list a specimen for trade.');
  });

  it('renders CTA link with focus-visible styles when ctaTo is provided', () => {
    const el = EmptyState({
      title: 'Vault is empty',
      body: 'Scan to add items.',
      ctaLabel: 'Scan Now',
      ctaTo: '/scan',
    });

    const [, , , ctaEl] = el.props.children;
    expect(ctaEl.props.to).toBe('/scan');
    expect(ctaEl.props.children).toBe('Scan Now');
    expect(ctaEl.props.className).toContain('focus-visible:ring-2');
  });

  it('renders CTA button with type="button" and focus-visible styles when ctaOnClick is provided', () => {
    const handleClick = vi.fn();
    const el = EmptyState({
      title: 'Filtered view empty',
      description: 'No matching items found.',
      ctaLabel: 'Clear Filters',
      ctaOnClick: handleClick,
    });

    const [, , , ctaEl] = el.props.children;
    expect(ctaEl.type).toBe('button');
    expect(ctaEl.props.onClick).toBe(handleClick);
    expect(ctaEl.props.children).toBe('Clear Filters');
    expect(ctaEl.props.className).toContain('focus-visible:ring-2');
  });
});
