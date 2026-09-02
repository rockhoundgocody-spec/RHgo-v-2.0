import { describe, it, expect, vi } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState Component', () => {
  it('renders title, body, and hidden decorative icon orb', () => {
    const tree = EmptyState({
      icon: '💎',
      title: 'No Specimens',
      body: 'Your vault is completely empty.',
    });

    expect(tree).toBeDefined();
    const children = tree.props.children;

    // Orb container
    const orbContainer = children[0];
    expect(orbContainer.props['aria-hidden']).toBe('true');
    expect(orbContainer.props.children).toBe('💎');

    // Title
    const titleElem = children[1];
    expect(titleElem.type).toBe('h3');
    expect(titleElem.props.children).toBe('No Specimens');

    // Body
    const bodyElem = children[2];
    expect(bodyElem.type).toBe('p');
    expect(bodyElem.props.children).toBe('Your vault is completely empty.');
  });

  it('supports description prop as a fallback for body', () => {
    const tree = EmptyState({
      title: 'Empty List',
      description: 'Nothing found here.',
    });

    const children = tree.props.children;
    const bodyElem = children[2];
    expect(bodyElem.props.children).toBe('Nothing found here.');
  });

  it('renders button CTA with type="button" and focus-visible styling', () => {
    const handleClick = vi.fn();
    const tree = EmptyState({
      title: 'Empty State',
      ctaLabel: 'Refresh',
      ctaOnClick: handleClick,
    });

    const children = tree.props.children;
    const ctaButton = children[3];

    expect(ctaButton.type).toBe('button');
    expect(ctaButton.props.type).toBe('button');
    expect(ctaButton.props.children).toBe('Refresh');
    expect(ctaButton.props.className).toContain('focus-visible:ring-2');

    ctaButton.props.onClick();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders link CTA with focus-visible styling when ctaTo is provided', () => {
    const tree = EmptyState({
      title: 'Empty State',
      ctaLabel: 'Explore Map',
      ctaTo: '/explore',
    });

    const children = tree.props.children;
    const ctaLink = children[3];

    expect(ctaLink.props.to).toBe('/explore');
    expect(ctaLink.props.children).toBe('Explore Map');
    expect(ctaLink.props.className).toContain('focus-visible:ring-2');
  });
});
