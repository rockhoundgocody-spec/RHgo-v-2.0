// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MapFilterSheet from './MapFilterSheet.jsx';

describe('MapFilterSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <MapFilterSheet
        open={false}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders with role="dialog", aria-modal="true", and aria-label="Map filters" when open', () => {
    render(
      <MapFilterSheet
        open={true}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Map filters' });
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('provides accessible search input with aria-label="Search rocks"', () => {
    render(
      <MapFilterSheet
        open={true}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );

    const searchInput = screen.getByRole('textbox', { name: 'Search rocks' });
    expect(searchInput).toBeDefined();
  });

  it('closes sheet on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <MapFilterSheet
        open={true}
        onClose={onClose}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onLayerChange when selecting an access or spot option', () => {
    const onLayerChange = vi.fn();
    render(
      <MapFilterSheet
        open={true}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={onLayerChange}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );

    const publicLandRadio = screen.getByRole('radio', { name: /Public land/i });
    expect(publicLandRadio).toBeDefined();
    expect(publicLandRadio.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(publicLandRadio);
    expect(onLayerChange).toHaveBeenCalledWith('public');
  });
});
