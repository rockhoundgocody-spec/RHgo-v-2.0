import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, beforeAll, vi } from 'vitest';

globalThis.window = {
  self: 1,
  top: 1,
  location: { href: 'http://localhost' },
  history: { replaceState: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
};

globalThis.document = {
  title: 'Test',
  createElement: () => ({ style: {} }),
  documentElement: { style: {} },
};

vi.mock('leaflet', () => ({ default: {} }));
vi.mock('react-leaflet', () => ({
  MapContainer: () => null,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
}));

let AiCandidateRow;

describe('AiCandidateRow', () => {
  beforeAll(async () => {
    const mod = await import('./SpecimenDetail');
    AiCandidateRow = mod.AiCandidateRow;
  });

  it('renders candidate name and formatted confidence percentage', () => {
    const candidate = {
      name: 'Amethyst',
      confidence: 0.85,
    };

    const markup = renderToStaticMarkup(<AiCandidateRow candidate={candidate} color="#a78bfa" />);

    expect(markup).toContain('Amethyst');
    expect(markup).toContain('85%');
    expect(markup).toContain('width:85%');
    expect(markup).toContain('background:#a78bfa');
  });

  it('falls back to candidate label and score when name and confidence are missing', () => {
    const candidate = {
      label: 'Quartz Cluster',
      score: 0.62,
    };

    const markup = renderToStaticMarkup(<AiCandidateRow candidate={candidate} color="#34d399" />);

    expect(markup).toContain('Quartz Cluster');
    expect(markup).toContain('62%');
    expect(markup).toContain('width:62%');
    expect(markup).toContain('background:#34d399');
  });

  it('handles empty score gracefully', () => {
    const candidate = {
      name: 'Unknown Gem',
    };

    const markup = renderToStaticMarkup(<AiCandidateRow candidate={candidate} color="#94a3b8" />);

    expect(markup).toContain('Unknown Gem');
    expect(markup).toContain('0%');
    expect(markup).toContain('width:0%');
    expect(markup).toContain('background:#94a3b8');
  });
});
