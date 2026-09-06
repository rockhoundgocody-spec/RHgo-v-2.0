import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CreateCapsuleSheet from './CreateCapsuleSheet';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, onClick, role, 'aria-modal': ariaModal, 'aria-labelledby': ariaLabelledby, ...props }) => {
      const filteredProps = {};
      Object.keys(props).forEach((key) => {
        if (
          key.startsWith('aria-') ||
          key.startsWith('data-') ||
          key === 'id' ||
          key === 'onClick'
        ) {
          filteredProps[key] = props[key];
        }
      });
      return (
        <div
          className={className}
          style={style}
          onClick={onClick}
          role={role}
          aria-modal={ariaModal}
          aria-labelledby={ariaLabelledby}
          {...filteredProps}
        >
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    auth: {
      me: vi.fn().mockResolvedValue({ email: 'explorer@example.com' }),
    },
    entities: {
      MemoryCapsule: {
        create: vi.fn().mockResolvedValue({ id: 'cap_123' }),
      },
    },
  },
}));

describe('CreateCapsuleSheet', () => {
  it('renders modal with correct ARIA dialog attributes when open', () => {
    const html = renderToStaticMarkup(
      <CreateCapsuleSheet open={true} onClose={vi.fn()} onCreate={vi.fn()} />
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="create-capsule-title"');
    expect(html).toContain('id="create-capsule-title"');
  });

  it('renders mood buttons with aria-pressed and aria-hidden emoji spans', () => {
    const html = renderToStaticMarkup(
      <CreateCapsuleSheet open={true} onClose={vi.fn()} onCreate={vi.fn()} />
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('aria-label="Mood selection"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('<span aria-hidden="true" class="mr-1">🔥</span>');
    expect(html).toContain('<span aria-hidden="true" class="mr-1">🔍</span>');
  });

  it('provides close button with explicit aria-label', () => {
    const html = renderToStaticMarkup(
      <CreateCapsuleSheet open={true} onClose={vi.fn()} onCreate={vi.fn()} />
    );
    expect(html).toContain('aria-label="Close"');
  });
});
