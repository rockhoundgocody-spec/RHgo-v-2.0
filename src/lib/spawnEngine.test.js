import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { generateSpawns } from './spawnEngine.js';

describe('generateSpawns', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should return empty array if lat or lng is missing', () => {
    expect(generateSpawns(null, 10)).toEqual([]);
    expect(generateSpawns(10, null)).toEqual([]);
    expect(generateSpawns()).toEqual([]);
  });

  it('should return default count of 6 spawns', () => {
    // Set time to a fixed value
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const spawns = generateSpawns(40.7128, -74.0060);
    expect(spawns).toHaveLength(6);
  });

  it('should return custom count of spawns', () => {
    const spawns = generateSpawns(40.7128, -74.0060, { count: 10 });
    expect(spawns).toHaveLength(10);
  });

  it('should add 2 to count if nearHotspot is true', () => {
    const spawns = generateSpawns(40.7128, -74.0060, { count: 5, nearHotspot: true });
    expect(spawns).toHaveLength(7);
  });

  it('should correctly mark already_collected', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    // Generate first to see what we get, or just pass a set and check if it matches
    const spawns = generateSpawns(40.7128, -74.0060);
    expect(spawns.length).toBeGreaterThan(0);

    const firstMineral = spawns[0].mineral_name.toLowerCase();
    const collectedSet = new Set([firstMineral]);

    const newSpawns = generateSpawns(40.7128, -74.0060, { collectedMinerals: collectedSet });
    expect(newSpawns[0].already_collected).toBe(true);
  });

  it('should be deterministic for the same location and time bucket', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const spawns1 = generateSpawns(40.7128, -74.0060);
    const spawns2 = generateSpawns(40.7128, -74.0060);

    expect(spawns1).toEqual(spawns2);
  });

  it('should generate different spawns for different time buckets', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const spawns1 = generateSpawns(40.7128, -74.0060);

    // Advance time by 30 minutes
    vi.setSystemTime(new Date('2024-01-01T12:30:00Z'));
    const spawns2 = generateSpawns(40.7128, -74.0060);

    expect(spawns1).not.toEqual(spawns2);
  });

  it('should generate different spawns for different locations', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const spawns1 = generateSpawns(40.7128, -74.0060);
    const spawns2 = generateSpawns(34.0522, -118.2437);

    expect(spawns1).not.toEqual(spawns2);
  });

  it('should have the correct structure for spawn objects', () => {
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    const spawns = generateSpawns(40.7128, -74.0060, { count: 1 });
    const spawn = spawns[0];

    expect(spawn).toHaveProperty('id');
    expect(spawn).toHaveProperty('mineral_name');
    expect(spawn).toHaveProperty('rarity');
    expect(spawn).toHaveProperty('is_shiny');
    expect(spawn).toHaveProperty('xp');
    expect(spawn).toHaveProperty('lat');
    expect(spawn).toHaveProperty('lng');
    expect(spawn).toHaveProperty('expires_at');
    expect(spawn).toHaveProperty('already_collected');
    expect(spawn).toHaveProperty('catch_chance');
    expect(spawn).toHaveProperty('color');
    expect(spawn).toHaveProperty('glow');
    expect(spawn).toHaveProperty('emoji');

    expect(typeof spawn.id).toBe('string');
    expect(typeof spawn.mineral_name).toBe('string');
    expect(typeof spawn.rarity).toBe('string');
    expect(typeof spawn.is_shiny).toBe('boolean');
    expect(typeof spawn.xp).toBe('number');
    expect(typeof spawn.lat).toBe('number');
    expect(typeof spawn.lng).toBe('number');
    expect(typeof spawn.expires_at).toBe('number');
    expect(typeof spawn.already_collected).toBe('boolean');
    expect(typeof spawn.catch_chance).toBe('number');
  });
});
