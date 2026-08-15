import { describe, expect, it } from 'vitest';
import {
  PUBLICATION_STATES,
  getNavigationStatus,
  isManagedDestination,
  isPublishedHotspot,
} from './locationPolicy';

const NOW = new Date('2026-08-15T12:00:00.000Z');

function verified(overrides = {}) {
  return {
    publication_state: PUBLICATION_STATES.VERIFIED_COLLECTING,
    access_status: 'open',
    collection_status: 'allowed',
    coordinate_quality: 'verified_entrance',
    lat: 41.8781,
    lng: -87.6298,
    navigation_eligible: true,
    official_source_url: 'https://example.gov/official-rules',
    last_verified_at: '2026-08-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('location publication policy', () => {
  it('fails closed for legacy records with no governance fields', () => {
    expect(isPublishedHotspot({ land_type: 'public' })).toBe(false);
    expect(isManagedDestination({ land_type: 'state_park' })).toBe(false);
    expect(getNavigationStatus({ land_type: 'public' }, NOW).allowed).toBe(false);
  });

  it('allows directions only to a recently reviewed official entrance', () => {
    expect(getNavigationStatus(verified(), NOW)).toEqual({
      allowed: true,
      collectionAllowed: true,
      reason: 'Collecting allowed under posted rules',
    });
    expect(getNavigationStatus(verified({ coordinate_quality: 'approximate_locality' }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ official_source_url: null }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ official_source_url: 'javascript:alert(1)' }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ lat: 999 }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ last_verified_at: '2025-01-01T00:00:00.000Z' }), NOW).allowed).toBe(false);
  });

  it('never turns a research locality into a destination', () => {
    const status = getNavigationStatus(verified({
      publication_state: PUBLICATION_STATES.RESEARCH,
    }), NOW);
    expect(isPublishedHotspot(verified({ publication_state: PUBLICATION_STATES.RESEARCH }))).toBe(true);
    expect(status.allowed).toBe(false);
    expect(status.reason).toContain('Research localities');
  });

  it('permits a managed educational visit without implying collecting permission', () => {
    const status = getNavigationStatus(verified({
      publication_state: PUBLICATION_STATES.EDUCATIONAL,
      collection_status: 'prohibited',
    }), NOW);
    expect(status.allowed).toBe(true);
    expect(status.collectionAllowed).toBe(false);
  });

  it('does not let a navigation flag override closed access or unknown rules', () => {
    expect(getNavigationStatus(verified({ access_status: 'closed' }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ collection_status: 'unknown' }), NOW).allowed).toBe(false);
    expect(getNavigationStatus(verified({ publication_state: PUBLICATION_STATES.HOLD }), NOW).allowed).toBe(false);
  });
});
