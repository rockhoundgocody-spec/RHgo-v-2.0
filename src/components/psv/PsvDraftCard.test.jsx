import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let PsvDraftCard;

describe('PsvDraftCard', () => {
  beforeAll(async () => {
    PsvDraftCard = (await import('./PsvDraftCard')).default;
  });

  it('exposes the collapsed verification plan control', () => {
    const markup = renderToStaticMarkup(
      <PsvDraftCard
        confidencePct={65}
        revisions={0}
        draft={{
          primary_name: 'Quartz',
          verification_plan: [{ test: 'Hardness', why: 'Confirm Mohs range' }],
        }}
      />
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls=');
    expect(markup).toContain('focus-visible:ring-amethyst-glow/70');
  });
});
