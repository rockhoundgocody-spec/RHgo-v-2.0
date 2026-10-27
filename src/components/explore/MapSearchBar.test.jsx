// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import MapSearchBar from './MapSearchBar';

afterEach(() => {
  cleanup();
});

const mockHotspots = [
  { id: '1', name: 'Emerald Creek', state: 'Idaho', minerals: ['Emerald', 'Garnet'] },
  { id: '2', name: 'Graves Mountain', state: 'Georgia', minerals: ['Rutile', 'Kyanite', 'Pyrophyllite'] },
  { id: '3', name: 'Crystal Park', state: 'Montana', minerals: ['Quartz', 'Amethyst'] },
];

describe('MapSearchBar', () => {
  it('renders search input with ARIA combobox attributes', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={() => {}} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('shows dropdown results when input matches query and sets aria-expanded to true', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={() => {}} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'emerald' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox', { name: /search results/i });
    expect(listbox).toBeDefined();

    const option = screen.getByRole('option', { name: /emerald creek/i });
    expect(option).toBeDefined();
  });

  it('displays empty state feedback when query yields no matching hotspots', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={() => {}} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'nonexistentmineral123' } });

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('No matching hotspots found')).toBeDefined();
  });

  it('navigates search options via ArrowDown, ArrowUp, and selects option with Enter', () => {
    const handleSelect = vi.fn();
    render(<MapSearchBar hotspots={mockHotspots} onSelect={handleSelect} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } });

    // Press ArrowDown to select first option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    // Press ArrowDown to select second option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1].getAttribute('aria-selected')).toBe('true');

    // Press ArrowUp to go back to first option
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    // Press Enter to select first option
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(mockHotspots[0]);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes dropdown when Escape key is pressed', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={() => {}} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'emerald' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
