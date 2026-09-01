import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatGeologyContext, fetchGeologyAt } from './macrostrat.js';

describe('formatGeologyContext', () => {
  it('returns empty string for null, undefined, or empty units array', () => {
    expect(formatGeologyContext(null)).toBe('');
    expect(formatGeologyContext(undefined)).toBe('');
    expect(formatGeologyContext([])).toBe('');
  });

  it('formats a single unit with all fields present', () => {
    const units = [
      {
        name: 'Columbia River Basalt',
        age: '15 Ma',
        lith: 'Basalt',
        descrip: 'Thick flows of dark basaltic lava.',
      },
    ];
    const result = formatGeologyContext(units);
    expect(result).toBe(
      ' LOCAL GEOLOGY CONTEXT (bedrock map units at the find location, from Macrostrat): - Columbia River Basalt | age: 15 Ma | lithology: Basalt | description: Thick flows of dark basaltic lava. Weight candidates that are geologically plausible for this bedrock higher, and mention the local geology in your reasoning when relevant.'
    );
  });

  it('falls back to strat_name when name is not provided', () => {
    const units = [
      {
        strat_name: 'Yakima Basalt',
        age: '16 Ma',
      },
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain('- Yakima Basalt | age: 16 Ma');
  });

  it('prefers name over strat_name when both are provided', () => {
    const units = [
      {
        name: 'Primary Name',
        strat_name: 'Secondary Strat Name',
      },
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain('- Primary Name');
    expect(result).not.toContain('Secondary Strat Name');
  });

  it('truncates descriptions longer than 200 characters', () => {
    const longDesc = 'A'.repeat(250);
    const units = [
      {
        name: 'Unit A',
        descrip: longDesc,
      },
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain(`description: ${'A'.repeat(200)}`);
    expect(result).not.toContain('A'.repeat(201));
  });

  it('filters out falsy and omitted fields', () => {
    const units = [
      {
        name: 'Partial Unit',
        age: '',
        lith: null,
        descrip: undefined,
      },
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain('- Partial Unit');
    expect(result).not.toContain('age:');
    expect(result).not.toContain('lithology:');
    expect(result).not.toContain('description:');
  });

  it('limits output to at most 3 units', () => {
    const units = [
      { name: 'Unit 1' },
      { name: 'Unit 2' },
      { name: 'Unit 3' },
      { name: 'Unit 4' },
      { name: 'Unit 5' },
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain('- Unit 1');
    expect(result).toContain('- Unit 2');
    expect(result).toContain('- Unit 3');
    expect(result).not.toContain('Unit 4');
    expect(result).not.toContain('Unit 5');
  });

  describe('table-driven formatting tests', () => {
    const testCases = [
      {
        description: 'unit with only age',
        units: [{ age: 'Jurassic' }],
        expectedSegment: '- age: Jurassic',
      },
      {
        description: 'unit with only lithology',
        units: [{ lith: 'Granite' }],
        expectedSegment: '- lithology: Granite',
      },
      {
        description: 'multiple units joined together',
        units: [{ name: 'Unit A' }, { name: 'Unit B' }],
        expectedSegment: '- Unit A - Unit B',
      },
    ];

    testCases.forEach(({ description, units, expectedSegment }) => {
      it(`handles ${description}`, () => {
        expect(formatGeologyContext(units)).toContain(expectedSegment);
      });
    });
  });
});

describe('fetchGeologyAt', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('fetches geologic units successfully from Macrostrat API', async () => {
    const mockData = [{ name: 'Granite' }, { name: 'Gneiss' }];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: { data: mockData } }),
    });

    const result = await fetchGeologyAt(45.5, -122.6);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://macrostrat.org/api/v2/geologic_units/map?lat=45.5&lng=-122.6',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(result).toEqual(mockData);
  });

  it('returns empty array when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await fetchGeologyAt(45.5, -122.6);
    expect(result).toEqual([]);
  });

  it('returns empty array on fetch network error / rejection', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchGeologyAt(45.5, -122.6);
    expect(result).toEqual([]);
  });

  it('returns empty array when response JSON is malformed or missing data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchGeologyAt(45.5, -122.6);
    expect(result).toEqual([]);
  });
  it('returns empty array when fetch times out with a TimeoutError/AbortError', async () => {
    const timeoutError = new DOMException('The operation timed out.', 'TimeoutError');
    globalThis.fetch = vi.fn().mockRejectedValue(timeoutError);

    const result = await fetchGeologyAt(45.5, -122.6);
    expect(result).toEqual([]);
  });

  it('passes AbortSignal.timeout(5000) to fetch request options', async () => {
    const mockSignal = AbortSignal.abort('timeout');
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(mockSignal);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: { data: [{ name: 'Basalt' }] } }),
    });

    await fetchGeologyAt(45.5, -122.6);

    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://macrostrat.org/api/v2/geologic_units/map?lat=45.5&lng=-122.6',
      { signal: mockSignal }
    );
  });
});
