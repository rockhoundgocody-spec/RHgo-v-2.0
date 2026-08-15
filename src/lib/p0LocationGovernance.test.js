import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

function readRepoFile(relativePath) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    'utf8',
  );
}

function readJson(relativePath) {
  return JSON.parse(readRepoFile(relativePath));
}

describe('P0 location governance regression', () => {
  it('defaults every specimen location to private', () => {
    const specimen = readJson('base44/entities/Specimen.jsonc');
    expect(specimen.properties.geo_privacy.default).toBe('private');
    expect(specimen.required).toContain('geo_privacy');
  });

  it('requires reviewed publication, access, collection, and coordinate states', () => {
    const hotspot = readJson('base44/entities/Hotspot.jsonc');
    expect(hotspot.properties.publication_state.default).toBe('hold');
    expect(hotspot.properties.access_status.default).toBe('unverified');
    expect(hotspot.properties.collection_status.default).toBe('unknown');
    expect(hotspot.properties.coordinate_quality.default).toBe('unknown');
    expect(hotspot.properties.navigation_eligible.default).toBe(false);

    const publicStates = hotspot.rls.read.$or.find(
      (rule) => rule['data.publication_state'],
    )?.['data.publication_state']?.$in;
    expect(publicStates).toEqual([
      'verified_managed_collecting',
      'managed_educational_destination',
      'research_locality',
    ]);
  });

  it('never promotes a user find directly into a public hotspot', () => {
    const identify = readRepoFile('base44/functions/identifySpecimen/entry.ts');
    const submission = readJson('base44/entities/location-submission.jsonc');
    expect(identify).not.toMatch(/entities\.Hotspot\.(create|update)/);
    expect(identify).toContain('entities.LocationSubmission.create');
    expect(identify).toContain('geo_privacy:');
    expect(submission.properties).not.toHaveProperty('lat');
    expect(submission.properties).not.toHaveProperty('lng');
    expect(submission.properties).not.toHaveProperty('image_url');
    expect(submission.rls.create.user_condition.role).toBe('admin');
  });

  it('keeps quick pins in the owner-only private log', () => {
    const quickPin = readRepoFile('src/components/explore/QuickPinButton.jsx');
    expect(quickPin).not.toMatch(/entity:\s*['"]Hotspot['"]/);
    expect(quickPin).toMatch(/entity:\s*['"]PrivateRockLog['"]/);
  });

  it('does not present land ownership or an internal score as collecting safety', () => {
    const explore = readRepoFile('src/pages/Explore.jsx');
    const map = readRepoFile('src/components/explore/HotspotMap.jsx');
    const detail = readRepoFile('src/components/explore/HotspotDetailSheet.jsx');
    const listItem = readRepoFile('src/components/explore/HotspotListItem.jsx');

    for (const source of [explore, map, detail, listItem]) {
      expect(source).not.toContain('trust_score');
    }
    expect(explore).not.toMatch(/\['public','blm','forest_service','state_park'\]/);
    expect(map).not.toMatch(/\['public','blm','forest_service','state_park'\]/);
    expect(detail).not.toMatch(/\['public','blm','forest_service','state_park'\]/);
  });

  it('applies the same fail-closed gate to every route and recommendation path', () => {
    const roulette = readRepoFile('base44/functions/intentionRoulette/entry.ts');
    const suggestions = readRepoFile('base44/functions/suggestNextFinds/entry.ts');
    const planner = readRepoFile('src/components/explore/ExpeditionPlanner.jsx');

    for (const source of [roulette, suggestions, planner]) {
      expect(source).toContain('getNavigationStatus');
    }
    expect(roulette).not.toContain('randomLat');
    expect(roulette).not.toContain('randomLng');
    expect(suggestions).not.toContain('trust_score');
  });
});
