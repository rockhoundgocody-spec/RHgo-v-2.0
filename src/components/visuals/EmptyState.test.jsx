import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
  },
}));

import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';

describe('EmptyState Component', () => {
  it('renders title, icon with aria-hidden="true", and body content', () => {
    const element = EmptyState({
      icon: '💎',
      title: 'No specimens found',
      body: 'Start scanning to build your collection.',
    });

    expect(element).toBeDefined();

    const [orbContainer, h3Element, bodyElement] = element.props.children;

    // Check orb container has aria-hidden="true"
    expect(orbContainer.props['aria-hidden']).toBe('true');
    expect(orbContainer.props.children).toBe('💎');

    // Check title
    expect(h3Element.props.children).toBe('No specimens found');

    // Check body text
    expect(bodyElement.props.children).toBe('Start scanning to build your collection.');
  });

  it('supports description prop as fallback for body prop', () => {
    const element = EmptyState({
      title: 'No items',
      description: 'This uses description instead of body.',
    });

    const [, , bodyElement] = element.props.children;
    expect(bodyElement.props.children).toBe('This uses description instead of body.');
  });

  it('renders CTA link with focus-visible styles when ctaTo is provided', () => {
    const element = EmptyState({
      title: 'Empty Vault',
      ctaLabel: 'Scan Now',
      ctaTo: '/scan',
    });

    const ctaSection = element.props.children[3];
    expect(ctaSection).toBeDefined();

    expect(ctaSection.type).toBe(Link);
    expect(ctaSection.props.to).toBe('/scan');
    expect(ctaSection.props.children).toBe('Scan Now');
    expect(ctaSection.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });

  it('renders CTA button with focus-visible styles when ctaOnClick is provided', () => {
    const handleClick = vi.fn();
    const element = EmptyState({
      title: 'Filtered Out',
      ctaLabel: 'Clear Filters',
      ctaOnClick: handleClick,
    });

    const ctaSection = element.props.children[3];
    expect(ctaSection).toBeDefined();

    expect(ctaSection.type).toBe('button');
    expect(ctaSection.props.onClick).toBe(handleClick);
    expect(ctaSection.props.children).toBe('Clear Filters');
    expect(ctaSection.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });
});
