import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let PsvProvenancePanel;

describe('PsvProvenancePanel', () => {
  beforeAll(async () => {
    PsvProvenancePanel = (await import('./PsvProvenancePanel')).default;
  });

  it('exposes the collapsed derivation control to assistive technology', () => {
    const markup = renderToStaticMarkup(
      <PsvProvenancePanel
        revision={3}
        engine={{
          fired_rules: [],
          unfired_rules: [],
          base_llm_score: 0.5,
          rule_contribution: 0,
          final_score: 0.5,
        }}
      />
    );

    expect(markup).toContain('type="button"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls=');
    expect(markup).toContain('focus-visible:ring-hud-cyan/70');
  });
});
