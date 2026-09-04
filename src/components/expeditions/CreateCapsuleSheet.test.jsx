import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CreateCapsuleSheet from './CreateCapsuleSheet';

describe('CreateCapsuleSheet accessibility and UX', () => {
  it('renders modal sheet with dialog accessibility attributes, labels, and focus rings', () => {
    const markup = renderToStaticMarkup(
      <CreateCapsuleSheet open={true} onClose={vi.fn()} onCreate={vi.fn()} />
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('aria-labelledby="create-capsule-title"');
    expect(markup).toContain('id="create-capsule-title"');

    // Labels and linked inputs
    expect(markup).toContain('for="capsule-expedition-name"');
    expect(markup).toContain('id="capsule-expedition-name"');
    expect(markup).toContain('for="capsule-location-name"');
    expect(markup).toContain('id="capsule-location-name"');
    expect(markup).toContain('for="capsule-expedition-date"');
    expect(markup).toContain('id="capsule-expedition-date"');
    expect(markup).toContain('for="capsule-story"');
    expect(markup).toContain('id="capsule-story"');

    // Mood toggle state and hidden decorative icons
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).toContain('aria-hidden="true"');

    // Focus visible indicators
    expect(markup).toContain('focus-visible:ring-2');
    expect(markup).toContain('focus-visible:ring-amethyst-glow/60');
  });

  it('does not render content when open is false', () => {
    const markup = renderToStaticMarkup(
      <CreateCapsuleSheet open={false} onClose={vi.fn()} onCreate={vi.fn()} />
    );

    expect(markup).toBe('');
  });
});
