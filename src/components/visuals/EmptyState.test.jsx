import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }) => React.createElement('a', props, children),
}));

import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('sets aria-hidden="true" on decorative orb container', () => {
    const element = EmptyState({
      icon: '🪨',
      title: 'No specimens found',
      body: 'Try scanning a stone.',
    });

    expect(element).toBeDefined();

    const orbContainer = element.props.children[0];
    expect(orbContainer.props['aria-hidden']).toBe('true');
  });

  it('renders description prop when body is omitted', () => {
    const element = EmptyState({
      icon: '💎',
      title: 'Empty Vault',
      description: 'Fall back description text',
    });

    const bodyParagraph = element.props.children[2];
    expect(bodyParagraph).toBeDefined();
    expect(bodyParagraph.props.children).toBe('Fall back description text');
  });

  it('renders CTA button with type="button" and focus-visible ring classes', () => {
    const handleClick = vi.fn();
    const element = EmptyState({
      title: 'No items',
      ctaLabel: 'Refresh',
      ctaOnClick: handleClick,
    });

    const ctaContainer = element.props.children[3];
    expect(ctaContainer).toBeDefined();
    expect(ctaContainer.type).toBe('button');
    expect(ctaContainer.props.type).toBe('button');
    expect(ctaContainer.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });

  it('renders CTA link with focus-visible ring classes when ctaTo is provided', () => {
    const element = EmptyState({
      title: 'No items',
      ctaLabel: 'Go to Scan',
      ctaTo: '/scan',
    });

    const ctaLink = element.props.children[3];
    expect(ctaLink).toBeDefined();
    expect(ctaLink.props.to).toBe('/scan');
    expect(ctaLink.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });
});
