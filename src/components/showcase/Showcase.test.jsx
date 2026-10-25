// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FieldJourney from '@/components/showcase/FieldJourney';
import MineralArtwork from '@/components/showcase/MineralArtwork';

afterEach(cleanup);
describe('Public field journey', () => {
  it('shows an honest workflow and allows every step to be explored', () => {
    render(<MemoryRouter><FieldJourney /></MemoryRouter>);
    expect(screen.getByText(/no specimen results are simulated/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Look at the evidence/ }));
    expect(screen.getByRole('region', { name: 'Evidence before certainty.' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Next: Explore/ }));
    expect(screen.getByText(/Unknown land access stays unknown/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Keep its story/ }));
    expect(screen.getByText(/Cloud collection requires an account/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Try a real scan/ }).getAttribute('href')).toBe('/scan');
    expect(screen.queryByRole('button', { name: /Next:/ })).toBeNull();
  });
  it('keeps an intentional fallback if the artwork cannot load', () => {
    render(<MineralArtwork />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Every find holds a story.')).toBeTruthy();
    expect(screen.getByText(/not a scan result/)).toBeTruthy();
    expect(screen.queryByRole('img')).toBeNull();
  });
});