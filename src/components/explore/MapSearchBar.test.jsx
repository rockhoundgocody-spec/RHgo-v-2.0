// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MapSearchBar from './MapSearchBar.jsx';

describe('MapSearchBar', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleHotspots = [
    { id: 'h1', name: 'Emerald Ridge', state: 'NC', minerals: ['Beryl', 'Quartz'] },
    { id: 'h2', name: 'Sapphire Gulch', state: 'MT', minerals: ['Corundum', 'Sapphire'] },
    { id: 'h3', name: 'Quartz Creek', state: 'NC', minerals: ['Quartz', 'Mica'] },
  ];

  it('renders input with combobox ARIA attributes', () => {
    render(<MapSearchBar hotspots={sampleHotspots} />);
    const input = screen.getByRole('combobox', { name: /search hotspots/i });

    expect(input).toBeDefined();
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('filters and displays matching hotspots when query is typed', () => {
    const handleSelect = vi.fn();
    render(<MapSearchBar hotspots={sampleHotspots} onSelect={handleSelect} />);

    const input = screen.getByRole('combobox', { name: /search hotspots/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Sapphire' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const option = screen.getByRole('option', { name: /sapphire gulch/i });
    expect(option).toBeDefined();

    fireEvent.click(option);
    expect(handleSelect).toHaveBeenCalledWith(sampleHotspots[1]);
  });

  it('renders empty feedback state when query matches no hotspots or minerals', () => {
    render(<MapSearchBar hotspots={sampleHotspots} />);

    const input = screen.getByRole('combobox', { name: /search hotspots/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'NonexistentMineral123' } });

    expect(input.getAttribute('aria-expanded')).toBe('true');
    const emptyStatus = screen.getByRole('status');
    expect(emptyStatus).toBeDefined();
    expect(emptyStatus.textContent).toContain('No matching hotspots or minerals found');
    expect(emptyStatus.getAttribute('aria-live')).toBe('polite');
  });

  it('clears query and closes results when clear button is clicked', () => {
    render(<MapSearchBar hotspots={sampleHotspots} />);

    const input = screen.getByRole('combobox', { name: /search hotspots/i });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Quartz' } });

    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);

    const clearBtn = screen.getByRole('button', { name: /clear search/i });
    fireEvent.click(clearBtn);

    expect(input.value).toBe('');
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });
});
