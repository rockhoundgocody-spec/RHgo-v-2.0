import { describe, it, expect } from 'vitest';
import { getMineralStory, MINERAL_STORIES } from './mineralStories.js';

describe('getMineralStory', () => {
  it('returns null when input is null, undefined, or empty string', () => {
    expect(getMineralStory(null)).toBeNull();
    expect(getMineralStory(undefined)).toBeNull();
    expect(getMineralStory('')).toBeNull();
  });

  it('returns story object for exact matches', () => {
    const result = getMineralStory('Petoskey Stone');
    expect(result).not.toBeNull();
    expect(result.mineral).toBe('Petoskey Stone');
    expect(result.unlock_badge).toBe('coral_keeper');
    expect(result.emoji).toBe('🪸');
    expect(result.era).toBe(MINERAL_STORIES['Petoskey Stone'].era);
    expect(result.story).toBe(MINERAL_STORIES['Petoskey Stone'].story);
    expect(result.field_tip).toBe(MINERAL_STORIES['Petoskey Stone'].field_tip);
    expect(result.color).toBe(MINERAL_STORIES['Petoskey Stone'].color);
  });

  it('handles case-insensitive matching', () => {
    const lowerResult = getMineralStory('lake superior agate');
    expect(lowerResult).not.toBeNull();
    expect(lowerResult.mineral).toBe('Lake Superior Agate');

    const upperResult = getMineralStory('PETOSKEY STONE');
    expect(upperResult).not.toBeNull();
    expect(upperResult.mineral).toBe('Petoskey Stone');
  });

  it('handles partial string matches where query is contained in key', () => {
    const agateResult = getMineralStory('Agate');
    expect(agateResult).not.toBeNull();
    expect(agateResult.mineral).toBe('Lake Superior Agate');

    const yooperliteResult = getMineralStory('Yooperlite');
    expect(yooperliteResult).not.toBeNull();
    expect(yooperliteResult.mineral).toBe('Yooperlite');
  });

  it('handles partial string matches where key is contained in first word of query', () => {
    const copperResult = getMineralStory('Native Copper Specimen');
    expect(copperResult).not.toBeNull();
    expect(copperResult.mineral).toBe('Native Copper');
  });

  it('returns null when no matching mineral is found', () => {
    expect(getMineralStory('Quartz')).toBeNull();
    expect(getMineralStory('Diamond')).toBeNull();
    expect(getMineralStory('Unicorn Stone')).toBeNull();
  });
});
