import { describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, ...props }) => (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('lucide-react', () => ({
  Route: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="route-icon" aria-hidden={ariaHidden} />,
  X: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="x-icon" aria-hidden={ariaHidden} />,
  Sparkles: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="sparkles-icon" aria-hidden={ariaHidden} />,
  ChevronRight: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="chevron-icon" aria-hidden={ariaHidden} />,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import ExpeditionTeaserModal from './ExpeditionTeaserModal.jsx';

describe('ExpeditionTeaserModal', () => {
  it('does not render when open is false', () => {
    const result = ExpeditionTeaserModal({ open: false, onClose: vi.fn() });
    expect(result.props.children).toBe(false);
  });

  it('renders modal with dialog role, aria-modal, and aria-labelledby when open is true', () => {
    const result = ExpeditionTeaserModal({
      open: true,
      onClose: vi.fn(),
      minerals: ['Quartz', 'Amethyst'],
      hotspotName: 'Crystal Ridge',
    });

    const overlay = result.props.children;
    const dialogContainer = overlay.props.children;

    expect(dialogContainer.props.role).toBe('dialog');
    expect(dialogContainer.props['aria-modal']).toBe('true');
    expect(dialogContainer.props['aria-labelledby']).toBe('expedition-teaser-title');
  });

  it('includes focus-visible ring styles on close button and register CTA link', () => {
    const result = ExpeditionTeaserModal({
      open: true,
      onClose: vi.fn(),
    });

    const dialogContainer = result.props.children.props.children;
    const closeBtn = dialogContainer.props.children[0];
    const cardBody = dialogContainer.props.children[1];

    // Close button focus ring
    expect(closeBtn.props.className).toContain('focus-visible:ring-2');
    expect(closeBtn.props.className).toContain('focus-visible:ring-amethyst-glow/60');

    // Register Link CTA focus ring
    const ctaLink = cardBody.props.children[cardBody.props.children.length - 2];
    expect(ctaLink.props.className).toContain('focus-visible:ring-2');
    expect(ctaLink.props.className).toContain('focus-visible:ring-amethyst-glow/60');
  });
});
