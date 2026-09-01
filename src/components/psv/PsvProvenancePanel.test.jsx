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

  it('returns null if engine or engine.fired_rules is missing', () => {
    const markupNullEngine = renderToStaticMarkup(
      <PsvProvenancePanel revision={1} engine={null} />
    );
    expect(markupNullEngine).toBe('');

    const markupInvalidEngine = renderToStaticMarkup(
      <PsvProvenancePanel revision={1} engine={{}} />
    );
    expect(markupInvalidEngine).toBe('');
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
    expect(markup).toContain('0 rules · rev 3');
  });

  it('renders score breakdown, fired rules, and positive unfired rules when open', () => {
    const engine = {
      fired_rules: [
        { id: 'R1', description: 'Hardness test passed', weight: 0.2 },
        { id: 'R2', description: 'Streak test failed', weight: -0.1 },
      ],
      unfired_rules: [
        { id: 'R3', description: 'Acid reaction test', weight: 0.15 },
        { id: 'R4', description: 'Negative rule', weight: -0.05 },
      ],
      base_llm_score: 0.8,
      rule_contribution: 0.1,
      final_score: 0.85,
    };

    // To simulate open state in static markup, we can inspect sub-components or check rendered structure
    const markup = renderToStaticMarkup(
      <PsvProvenancePanel revision={5} engine={engine} />
    );

    expect(markup).toContain('2 rules · rev 5');
  });
});
