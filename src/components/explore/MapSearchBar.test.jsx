// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  const mockHotspots = [
    { id: '1', name: 'Emerald Creek', state: 'Idaho', minerals: ['Star Garnet', 'Quartz'] },
    { id: '2', name: 'Crystal Park', state: 'Montana', minerals: ['Quartz', 'Amethyst'] },
    { id: '3', name: 'Glass Butte', state: 'Oregon', minerals: ['Obsidian'] },
  ];

  beforeEach(() => {
    cleanup();
  });

  it('renders input with combobox role and aria attributes', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });

    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('displays search results in listbox with options on query and focuses dropdown', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Quartz' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox', { name: /search results/i });
    expect(listbox).toBeDefined();

    const options = screen.getAllByRole('option');
    expect(options.length).toBe(2);
    expect(options[0].textContent).toContain('Emerald Creek');
    expect(options[1].textContent).toContain('Crystal Park');
  });

  it('handles keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', () => {
    const handleSelect = vi.fn();
    render(<MapSearchBar hotspots={mockHotspots} onSelect={handleSelect} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Quartz' } });

    // ArrowDown to select first option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0].getAttribute('aria-selected')).toBe('true');

    // ArrowDown to select second option
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1].getAttribute('aria-selected')).toBe('true');

    // Enter to select active option
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(mockHotspots[1]);

    // Check query is cleared after selection
    expect(input.value).toBe('');
  });

  it('closes dropdown on Escape key', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Emerald' } });
    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
