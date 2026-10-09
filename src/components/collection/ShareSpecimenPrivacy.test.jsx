// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
vi.mock('@/api/base44Client', () => ({ base44: { analytics: { track: vi.fn() } } }));
import ShareSpecimenButton from '@/components/collection/ShareSpecimenButton';
afterEach(cleanup);
describe('specimen sharing privacy', () => {
  it.each(['private', 'approximate', 'exact', undefined])('never implicitly publishes a stored location for %s privacy', async geo_privacy => {
    const writeText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<ShareSpecimenButton specimen={{ mineral_name: 'Quartz', geo_privacy, found_at: 'Sensitive exact collecting spot', image_url: 'https://example.test/photo.jpg' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share Quartz specimen' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(writeText.mock.calls[0][0]).not.toContain('Sensitive exact collecting spot');
    expect(writeText.mock.calls[0][0]).toContain('Quartz');
  });
});