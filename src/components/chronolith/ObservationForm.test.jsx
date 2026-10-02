// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let buildObservationsPayload;
let ObservationForm;

beforeAll(async () => {
  const mod = await import('./ObservationForm');
  buildObservationsPayload = mod.buildObservationsPayload;
  ObservationForm = mod.default;
});

describe('buildObservationsPayload', () => {
  it('returns empty array when no values or free text are provided', () => {
    const payload = buildObservationsPayload({}, '');
    expect(payload).toEqual([]);
  });

  it('correctly maps preset field values with default reliability and timestamp', () => {
    const values = { weight: '150', magnetism: 'Strong' };
    const payload = buildObservationsPayload(values, '');

    expect(payload).toHaveLength(2);
    expect(payload[0]).toMatchObject({
      key: 'weight',
      label: 'Weight (g)',
      value: '150',
      reliability: 0.8,
    });
    expect(payload[1]).toMatchObject({
      key: 'magnetism',
      label: 'Magnetism',
      value: 'Strong',
      reliability: 0.8,
    });
    expect(payload[0].entered_at).toBeDefined();
  });

  it('correctly includes free text observation when provided', () => {
    const payload = buildObservationsPayload({}, '   Contains metallic flecks   ');

    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      key: 'free_text',
      label: 'Additional observation',
      value: 'Contains metallic flecks',
      reliability: 0.6,
    });
  });

  it('combines preset fields and free text observations', () => {
    const values = { hardness: '7' };
    const freeText = 'Slightly magnetic';
    const payload = buildObservationsPayload(values, freeText);

    expect(payload).toHaveLength(2);
    expect(payload[0].key).toBe('hardness');
    expect(payload[1].key).toBe('free_text');
  });

  it('ignores empty or whitespace-only preset values and free text', () => {
    const values = { weight: '   ', streak: '' };
    const payload = buildObservationsPayload(values, '   ');
    expect(payload).toEqual([]);
  });
});

describe('ObservationForm JSX Accessibility', () => {
  it('renders form elements with proper htmlFor, focus-visible classes, and choice ARIA attributes when open', () => {
    const html = renderToStaticMarkup(
      <ObservationForm open={true} onClose={() => {}} onSubmit={() => {}} />
    );

    // Verify for attributes exist on labels in rendered HTML
    expect(html).toContain('for="');

    // Verify inputs have focus-visible styling
    expect(html).toContain('focus-visible:ring-amber-400');

    // Verify choice buttons have type="button" and aria-pressed / aria-label
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Magnetism: Strong"');
  });
});
