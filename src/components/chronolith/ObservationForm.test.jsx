import { describe, it, expect, beforeAll } from 'vitest';

let buildObservationsPayload;

beforeAll(async () => {
  if (typeof window === 'undefined') {
    globalThis.window = {
      self: 1,
      top: 2,
    };
  }
  const mod = await import('./ObservationForm');
  buildObservationsPayload = mod.buildObservationsPayload;
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
