import { describe, it, expect } from 'vitest';
import { buildGalaxy, classifyMineral, placeKey, sampleGalaxy, searchGalaxy, speciesKey } from './vaultGraph';

const specimens = [
  { id: 's1', mineral_name: 'Lake Superior Agate', found_at: 'Grand Marais, MN', rarity: 'uncommon', found_date: '2026-08-02' },
  { id: 's2', mineral_name: 'Lake Superior Agate', found_at: 'Two Harbors, MN', rarity: 'rare' },
  { id: 's3', mineral_name: 'Native Copper with Limonite/Goethite', found_at: 'Bartonville, Peoria County, Illinois', rarity: 'uncommon' },
  { id: 's4', mineral_name: 'Barite', found_at: 'Sweetwater wash, WY', rarity: 'common' },
];

describe('classifyMineral', () => {
  it('sorts specimens into mineral classes, most specific first', () => {
    expect(classifyMineral('Native Copper with Limonite/Goethite')).toBe('native');
    expect(classifyMineral('Botryoidal Chalcedony (Agate Limb Cast)')).toBe('silicate');
    expect(classifyMineral('Petoskey Stone')).toBe('organic');
    expect(classifyMineral('Desert Rose Selenite')).toBe('sulfate');
    expect(classifyMineral('Yooperlite')).toBe('rock');
    expect(classifyMineral('Mystery rock')).toBe('other');
  });
});

describe('keys', () => {
  it('normalizes species and places', () => {
    expect(speciesKey('Native Copper with Limonite (Keweenaw)')).toBe('native copper');
    expect(speciesKey('  Lake Superior  Agate ')).toBe('lake superior agate');
    expect(placeKey('Grand Marais,  MN!')).toBe('grand marais, mn');
  });
});

describe('buildGalaxy', () => {
  const g = buildGalaxy({
    specimens,
    logs: [{ id: 'l1', mineral_name: 'Barite', location_label: 'Sweetwater wash, WY' }],
    capsules: [{ id: 'c1', expedition_name: 'Wyoming loop', location_name: 'Sweetwater wash, WY' }],
  });

  it('creates one hub per species and site, one star per record', () => {
    expect(g.stats).toEqual({ finds: 4, species: 3, sites: 4 });
    const agate = g.nodes.find((n) => n.id === 'species:lake superior agate');
    expect(agate.count).toBe(2);
    expect(g.nodes.find((n) => n.id === 'site:sweetwater wash, wy').count).toBe(3);
  });

  it('links records to their species and site', () => {
    expect(g.links).toContainEqual({ source: 'find:s1', target: 'species:lake superior agate', kind: 'species' });
    expect(g.links).toContainEqual({ source: 'find:s1', target: 'site:grand marais, mn', kind: 'site' });
    expect(g.links).toContainEqual({ source: 'trip:c1', target: 'site:sweetwater wash, wy', kind: 'trip' });
  });

  it('gives every node a finite position and size', () => {
    for (const n of g.nodes) {
      expect(n.position).toHaveLength(3);
      n.position.forEach((v) => expect(Number.isFinite(v)).toBe(true));
      expect(n.size).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const again = buildGalaxy({ specimens });
    const first = buildGalaxy({ specimens });
    expect(again.nodes.map((n) => n.position)).toEqual(first.nodes.map((n) => n.position));
  });

  it('maps entity ids to stars and reports classes present', () => {
    expect(g.byRef.get('s3')).toBe('find:s3');
    expect(g.groups.map((x) => x.id).sort()).toEqual(['native', 'silicate', 'sulfate']);
  });

  it('handles an empty vault', () => {
    const empty = buildGalaxy({});
    expect(empty.nodes).toEqual([]);
    expect(empty.stats.finds).toBe(0);
  });
});

describe('searchGalaxy', () => {
  const g = buildGalaxy({ specimens });
  it('finds the record a spoken pull is about', () => {
    expect(searchGalaxy(g.nodes, 'pull Sweetwater barite')[0].id).toBe('find:s4');
    expect(searchGalaxy(g.nodes, 'grand marais agate')[0].id).toBe('find:s1');
  });
  it('matches by mineral class', () => {
    expect(searchGalaxy(g.nodes, 'native elements').map((n) => n.id)).toContain('find:s3');
  });
  it('returns nothing for filler', () => {
    expect(searchGalaxy(g.nodes, 'hey clover pull the')).toEqual([]);
  });
});

describe('sampleGalaxy', () => {
  it('builds a populated preview', () => {
    const s = sampleGalaxy();
    expect(s.stats.finds).toBeGreaterThan(15);
    expect(s.groups.length).toBeGreaterThan(4);
  });
});
