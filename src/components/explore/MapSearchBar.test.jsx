// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  afterEach(() => {
    cleanup();
  });

  const mockHotspots = [
    { id: '1', name: 'Crystal Ridge', state: 'CA', minerals: ['Quartz', 'Amethyst'] },
    { id: '2', name: 'Emerald Peak', state: 'NC', minerals: ['Emerald', 'Beryl'] },
  ];

  it('renders input with ARIA combobox attributes', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search hotspots, minerals, states/i });

    expect(input).toBeDefined();
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-controls')).toBe('map-search-results');
  });

  it('displays matching results when query is entered and updates aria-expanded', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Crystal' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');

    const listbox = screen.getByRole('listbox', { name: /search results/i });
    expect(listbox).toBeDefined();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0].getAttribute('aria-label')).toBe('Select Crystal Ridge, CA');
  });

  it('calls onSelect and clears input when an option is selected', () => {
    const onSelect = vi.fn();
    render(<MapSearchBar hotspots={mockHotspots} onSelect={onSelect} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Emerald' } });

    const option = screen.getByRole('option', { name: 'Select Emerald Peak, NC' });
    fireEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(mockHotspots[1]);
    expect(input.value).toBe('');
  });

  it('renders empty state feedback when query yields no results', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'NonexistentMineral' } });

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('No hotspots or minerals found matching "NonexistentMineral"');
  });

  it('clears query when clear button is clicked', () => {
    render(<MapSearchBar hotspots={mockHotspots} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Crystal' } });

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton.getAttribute('type')).toBe('button');

    fireEvent.click(clearButton);
    expect(input.value).toBe('');
  });
});
