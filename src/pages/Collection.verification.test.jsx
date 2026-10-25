// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('@/lib/useEntityQuery', () => ({ useEntityList: () => ({ data: [
  { id: 'high-confidence-only', mineral_name: 'AI-only fixture', verified: false, ai_confidence: 0.99 },
  { id: 'verified-record', mineral_name: 'Verified fixture', verified: true, ai_confidence: 0.4 },
], isLoading: false, refetch: vi.fn() }) }));
vi.mock('@/components/collection/CrystalCard.jsx', () => ({ default: ({ specimen }) => <div>{specimen.mineral_name}</div> }));
vi.mock('@/components/collection/SpecimenCard.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/GalleryGrid.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/CrystalSystemInsights.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/CollectionMap.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/HolographicVaultView.jsx', () => ({ default: () => null }));
vi.mock('@/components/collection/CollectionDashboard.jsx', () => ({ default: () => null }));
vi.mock('@/components/nav/PullToRefresh.jsx', () => ({ default: ({ children }) => <div>{children}</div> }));
import Collection from '@/pages/Collection';
afterEach(cleanup);
describe('Recorded verification filter', () => {
  it('does not turn AI confidence into verification', () => {
    render(<MemoryRouter><Collection /></MemoryRouter>);
    expect(screen.getByText('AI-only fixture')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '✓ Verified' }));
    expect(screen.queryByText('AI-only fixture')).toBeNull();
    expect(screen.getByText('Verified fixture')).toBeTruthy();
  });
});