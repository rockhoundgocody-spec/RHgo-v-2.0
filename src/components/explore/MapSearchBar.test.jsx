// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  const mockHotspots = [
    { id: '1', name: 'Quartz Ridge', state: 'CA', minerals: ['quartz', 'gold'] },
    { id: '2', name: 'Amethyst Mine', state: 'AZ', minerals: ['amethyst'] },
  ];

  beforeEach(() => {
    cleanup();
  });

  it('renders search input with ARIA combobox attributes', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('displays search results listbox with options when query matches', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });
    fireEvent.change(input, { target: { value: 'Quartz' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox', { name: /search results/i });
    expect(listbox).toBeDefined();

    const option = screen.getByRole('option', { name: /Quartz Ridge, CA/i });
    expect(option).toBeDefined();
  });

  it('calls onSelect and clears input when an option is clicked', () => {
    const handleSelect = vi.fn();
    render(<MapSearchBar hotspots={mockHotspots} onSelect={handleSelect} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });
    fireEvent.change(input, { target: { value: 'Amethyst' } });

    const option = screen.getByRole('option', { name: /Amethyst Mine, AZ/i });
    fireEvent.click(option);

    expect(handleSelect).toHaveBeenCalledWith(mockHotspots[1]);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
