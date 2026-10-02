import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock framer-motion to simplify testing
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

// Mock react-router-dom Link
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style }) => React.createElement('a', { href: to, className, style }, children),
}));

import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders decorative orb with aria-hidden="true"', () => {
    const element = EmptyState({
      icon: '💎',
      title: 'No specimens yet',
      body: 'Scan your first specimen',
    });

    expect(element).toBeDefined();

    // Check children of container motion.div: [orbDiv, titleH3, bodyP]
    const [orbDiv, titleH3, bodyP] = element.props.children;

    expect(orbDiv.props['aria-hidden']).toBe('true');
    expect(titleH3.props.children).toBe('No specimens yet');
    expect(bodyP.props.children).toBe('Scan your first specimen');
  });

  it('supports description prop as a fallback for body text', () => {
    const element = EmptyState({
      icon: '💎',
      title: 'No listings',
      description: 'Be the first to list a specimen',
    });

    const [, , bodyP] = element.props.children;
    expect(bodyP.props.children).toBe('Be the first to list a specimen');
  });

  it('renders CTA link with focus-visible keyboard navigation styles', () => {
    const element = EmptyState({
      title: 'Empty Vault',
      ctaLabel: 'Scan Now',
      ctaTo: '/scan',
    });

    const [, , , ctaWrapper] = element.props.children;
    expect(ctaWrapper.props.to).toBe('/scan');
    expect(ctaWrapper.props.className).toContain('focus-visible:ring-2');
    expect(ctaWrapper.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });

  it('renders CTA button with type="button" and focus-visible keyboard navigation styles', () => {
    const handleClick = vi.fn();
    const element = EmptyState({
      title: 'Filtered Out',
      ctaLabel: 'Clear Filters',
      ctaOnClick: handleClick,
    });

    const [, , , ctaWrapper] = element.props.children;
    expect(ctaWrapper.type).toBe('button');
    expect(ctaWrapper.props.type).toBe('button');
    expect(ctaWrapper.props.onClick).toBe(handleClick);
    expect(ctaWrapper.props.className).toContain('focus-visible:ring-2');
    expect(ctaWrapper.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });
});
