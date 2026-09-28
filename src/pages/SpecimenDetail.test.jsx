import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import SpecimenDetail from './SpecimenDetail';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'specimen-123' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      id: 'specimen-123',
      mineral_name: 'Amethyst Quartz',
      rarity: 'rare',
      ai_confidence: 0.92,
      collected: false,
      geo_privacy: 'public',
      verified: false,
    },
    isLoading: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: { Specimen: { get: vi.fn(), update: vi.fn() } },
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/components/visuals/GlassPanel.jsx', () => ({
  default: ({ children, className = '' }) => <div className={`glass-panel ${className}`}>{children}</div>,
}));

vi.mock('@/components/collection/ShareSpecimenButton.jsx', () => ({
  default: () => <button type="button">Share Specimen</button>,
}));

vi.mock('@/components/scan/FoundLocationPicker.jsx', () => ({
  default: () => <div>Location Picker</div>,
}));

describe('SpecimenDetail Accessibility', () => {
  it('renders tab list with role="tablist" and tabs with role="tab" & aria-selected', () => {
    const markup = renderToStaticMarkup(<SpecimenDetail />);

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('focus-visible:ring-amethyst-glow/60');
  });

  it('includes focus-visible keyboard focus styling on back button and action buttons', () => {
    const markup = renderToStaticMarkup(<SpecimenDetail />);

    expect(markup).toContain('aria-label="Go back"');
    expect(markup).toContain('focus-visible:ring-2');
    expect(markup).toContain('focus-visible:ring-amethyst-glow/60');
  });
});
