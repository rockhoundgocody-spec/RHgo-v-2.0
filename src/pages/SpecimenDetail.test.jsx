import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Specimen: {
        filter: vi.fn(),
      },
    },
  },
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'specimen-123' }),
  useNavigate: () => vi.fn(),
}));

let mockQueryResult = { data: null, isLoading: false };
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => mockQueryResult,
}));

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
};

let SpecimenDetail;

describe('SpecimenDetail Page', () => {
  beforeAll(async () => {
    SpecimenDetail = (await import('./SpecimenDetail')).default;
  });

  it('renders loading spinner when specimen is loading', () => {
    mockQueryResult = { data: undefined, isLoading: true };
    const markup = renderToStaticMarkup(<SpecimenDetail />);
    expect(markup).toContain('animate-spin');
  });

  it('renders "Specimen not found" when query returns no specimen', () => {
    mockQueryResult = { data: undefined, isLoading: false };
    const markup = renderToStaticMarkup(<SpecimenDetail />);
    expect(markup).toContain('Specimen not found.');
    expect(markup).toContain('← Go back');
  });

  it('renders detailed specimen information when data exists', () => {
    const mockSpecimen = {
      id: 'specimen-123',
      mineral_name: 'Amethyst Cluster',
      common_name: 'Purple Quartz',
      rarity: 'rare',
      ai_confidence: 0.92,
      verified: true,
      found_date: '2026-03-15',
      found_at: 'Thunder Bay, ON',
      image_url: 'https://example.com/amethyst.jpg',
      notes: 'Beautiful violet crystals with hematite inclusions.',
      weather: { condition: 'Sunny', temperature_f: 72 },
      lunar_phase: { phase_name: 'Waxing Gibbous' },
    };
    mockQueryResult = { data: mockSpecimen, isLoading: false };

    const markup = renderToStaticMarkup(<SpecimenDetail />);

    expect(markup).toContain('Amethyst Cluster');
    expect(markup).toContain('Purple Quartz');
    expect(markup).toContain('Rare');
    expect(markup).toContain('AI: Near Certain');
    expect(markup).toContain('92%');
    expect(markup).toContain('Thunder Bay, ON');
    expect(markup).toContain('Evolution Stage');
    expect(markup).toContain('Your Field Notes');
    expect(markup).toContain('Beautiful violet crystals with hematite inclusions.');
  });
});
