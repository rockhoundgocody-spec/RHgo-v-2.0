import { describe, it, expect } from 'vitest';
import { formatGeologyContext } from './macrostrat';

describe('formatGeologyContext', () => {
  it('returns empty string for null or empty units', () => {
    expect(formatGeologyContext(null)).toBe('');
    expect(formatGeologyContext(undefined)).toBe('');
    expect(formatGeologyContext([])).toBe('');
  });

  it('formats a single unit with all fields', () => {
    const units = [{
      name: 'Formation A',
      age: 'Devonian',
      lith: 'Sandstone',
      descrip: 'A very cool formation'
    }];
    const result = formatGeologyContext(units);
    expect(result).toContain('Formation A');
    expect(result).toContain('age: Devonian');
    expect(result).toContain('lithology: Sandstone');
    expect(result).toContain('description: A very cool formation');
  });

  it('uses strat_name if name is missing', () => {
    const units = [{
      strat_name: 'Strat B',
      age: 'Permian'
    }];
    const result = formatGeologyContext(units);
    expect(result).toContain('Strat B');
  });

  it('slices units to a maximum of 3', () => {
    const units = [
      { name: 'Unit 1' },
      { name: 'Unit 2' },
      { name: 'Unit 3' },
      { name: 'Unit 4' }
    ];
    const result = formatGeologyContext(units);
    expect(result).toContain('Unit 1');
    expect(result).toContain('Unit 2');
    expect(result).toContain('Unit 3');
    expect(result).not.toContain('Unit 4');
  });

  it('handles missing optional fields gracefully', () => {
    const units = [{
      name: 'Sparse Unit'
    }];
    const result = formatGeologyContext(units);
    expect(result).toContain('- Sparse Unit');
    expect(result).not.toContain('age:');
    expect(result).not.toContain('lithology:');
    expect(result).not.toContain('description:');
  });

  it('truncates description to 200 characters', () => {
    const longDesc = 'A'.repeat(300);
    const units = [{
      name: 'Long Desc Unit',
      descrip: longDesc
    }];
    const result = formatGeologyContext(units);
    const expectedDesc = 'description: ' + 'A'.repeat(200);
    expect(result).toContain(expectedDesc);
    expect(result).not.toContain('A'.repeat(201));
  });

  it('includes the full contextual wrapping text', () => {
    const units = [{ name: 'Test Unit' }];
    const result = formatGeologyContext(units);
    expect(result).toContain('LOCAL GEOLOGY CONTEXT');
    expect(result).toContain('Weight candidates that are geologically plausible');
  });
});
