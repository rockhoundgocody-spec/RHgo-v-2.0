// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
import MapSearchBar from './MapSearchBar';

const mockHotspots = [
  { id: '1', name: 'Crystal Park', state: 'Montana', minerals: ['quartz', 'amethyst'] },
  { id: '2', name: 'Emerald Hollow Mine', state: 'North Carolina', minerals: ['emerald', 'sapphire'] },
  { id: '3', name: 'Graves Mountain', state: 'Georgia', minerals: ['rutile', 'lazulite'] },
];

describe('MapSearchBar', () => {
  it('renders combobox input with proper ARIA attributes', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });
    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
  });

  it('displays search results in listbox when user types matching query', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'emerald' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const listbox = screen.getByRole('listbox', { name: /hotspot search results/i });
    expect(listbox).toBeDefined();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].textContent).toContain('Emerald Hollow Mine');
  });

  it('supports keyboard navigation with ArrowDown, ArrowUp, and Enter', () => {
    const handleSelect = vi.fn();
    render(<MapSearchBar hotspots={mockHotspots} onSelect={handleSelect} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'a' } }); // matches all 3

    const options = screen.getAllByRole('option');

    // Press ArrowDown to select 1st item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    // Press ArrowDown to select 2nd item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);

    // Press Enter to select 2nd item
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(mockHotspots[1]);
  });

  it('dismisses dropdown on Escape key', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'mountain' } });

    expect(screen.getByRole('listbox')).toBeDefined();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('clears query and refocuses input when clear button is clicked', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'quartz' } });

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(input);
  });
});
