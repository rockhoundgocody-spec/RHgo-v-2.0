import { describe, it, expect } from 'vitest';
import { generateSpawns } from './spawnEngine';

describe('generateSpawns', () => {
  it('should return an empty array if lat is null', () => {
    expect(generateSpawns(null, -122.6)).toEqual([]);
  });

  it('should return an empty array if lng is null', () => {
    expect(generateSpawns(45.5, null)).toEqual([]);
  });

  it('should return an empty array if both lat and lng are null', () => {
    expect(generateSpawns(null, null)).toEqual([]);
  });

  it('should return an empty array if lat is undefined', () => {
    expect(generateSpawns(undefined, -122.6)).toEqual([]);
  });

  it('should return an empty array if lng is undefined', () => {
    expect(generateSpawns(45.5, undefined)).toEqual([]);
  });

  it('should return an empty array if both are undefined', () => {
    expect(generateSpawns(undefined, undefined)).toEqual([]);
  });

  it('should generate spawns when valid coordinates are provided', () => {
    const spawns = generateSpawns(45.5, -122.6);
    expect(Array.isArray(spawns)).toBe(true);
    expect(spawns.length).toBe(6); // Default count is 6

    // Check structure of first spawn
    const spawn = spawns[0];
    expect(spawn).toHaveProperty('id');
    expect(spawn).toHaveProperty('mineral_name');
    expect(spawn).toHaveProperty('rarity');
    expect(spawn).toHaveProperty('lat');
    expect(spawn).toHaveProperty('lng');
  });

  it('should respect the count option', () => {
    const spawns = generateSpawns(45.5, -122.6, { count: 10 });
    expect(spawns.length).toBe(10);
  });
});
