import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useEffect: vi.fn(),
  };
});

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, className, style }) => (
    <a href={to} className={className} style={style}>
      {children}
    </a>
  ),
}));

import ExpeditionTeaserModal from './ExpeditionTeaserModal.jsx';

describe('ExpeditionTeaserModal', () => {
  it('returns null when open is false', () => {
    const result = ExpeditionTeaserModal({ open: false, onClose: vi.fn() });
    // AnimatePresence wraps null when open is false
    expect(result.props.children).toBe(false);
  });

  it('renders modal with role="dialog", aria-modal="true", and aria-labelledby', () => {
    const result = ExpeditionTeaserModal({
      open: true,
      onClose: vi.fn(),
      minerals: ['Agate', 'Jasper'],
      hotspotName: 'Agate Beach',
    });

    const backdrop = result.props.children;
    const modalContainer = backdrop.props.children;

    expect(modalContainer.props.role).toBe('dialog');
    expect(modalContainer.props['aria-modal']).toBe('true');
    expect(modalContainer.props['aria-labelledby']).toBe('expedition-teaser-title');
  });

  it('renders heading with id matching aria-labelledby', () => {
    const result = ExpeditionTeaserModal({ open: true, onClose: vi.fn() });
    const backdrop = result.props.children;
    const modalContainer = backdrop.props.children;
    const contentDiv = modalContainer.props.children[1];
    const contentChildren = contentDiv.props.children;

    // Find h2 element
    const heading = contentChildren.find((c) => c && c.type === 'h2');
    expect(heading).toBeDefined();
    expect(heading.props.id).toBe('expedition-teaser-title');
  });

  it('renders close button with descriptive aria-label and focus-visible ring styles', () => {
    const result = ExpeditionTeaserModal({ open: true, onClose: vi.fn() });
    const backdrop = result.props.children;
    const modalContainer = backdrop.props.children;
    const closeBtn = modalContainer.props.children[0];

    expect(closeBtn.props['aria-label']).toBe('Close expedition teaser modal');
    expect(closeBtn.props.className).toContain('focus-visible:ring-2');
  });

  it('renders CTA link with focus-visible ring styles', () => {
    const result = ExpeditionTeaserModal({ open: true, onClose: vi.fn() });
    const backdrop = result.props.children;
    const modalContainer = backdrop.props.children;
    const contentDiv = modalContainer.props.children[1];
    const contentChildren = contentDiv.props.children;

    const ctaLink = contentChildren.find((c) => c && c.type?.name === 'Link');
    expect(ctaLink).toBeDefined();
    expect(ctaLink.props.className).toContain('focus-visible:ring-2');
  });
});
