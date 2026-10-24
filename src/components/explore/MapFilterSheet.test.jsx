// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, onClick, ...props }, ref) => (
      <div ref={ref} className={className} onClick={onClick} {...props}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('lucide-react', () => ({
  Search: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="search-icon" aria-hidden={ariaHidden} />,
  X: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="x-icon" aria-hidden={ariaHidden} />,
  Check: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="check-icon" aria-hidden={ariaHidden} />,
  Plus: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="plus-icon" aria-hidden={ariaHidden} />,
  MessageCircle: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="message-icon" aria-hidden={ariaHidden} />,
}));

import MapFilterSheet from './MapFilterSheet.jsx';

describe('MapFilterSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render content when open is false', () => {
    render(
      <MapFilterSheet
        open={false}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz']}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders dialog with aria-modal and aria-label when open is true', () => {
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
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const searchInput = screen.getByRole('textbox', { name: 'Search rocks' });
    expect(searchInput).toBeTruthy();
  });

  it('closes when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <MapFilterSheet
        open={true}
        onClose={handleClose}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz']}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders control buttons with explicit type="button"', () => {
    render(
      <MapFilterSheet
        open={true}
        onClose={vi.fn()}
        activeLayer="public"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set(['quartz'])}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'amethyst']}
      />
    );

    const doneButton = screen.getByRole('button', { name: 'Done, apply filters and close' });
    expect(doneButton.getAttribute('type')).toBe('button');

    const resetButton = screen.getByRole('button', { name: 'Reset all map filters' });
    expect(resetButton.getAttribute('type')).toBe('button');

    const clearMineralsButton = screen.getByRole('button', { name: 'Clear all 1 selected minerals' });
    expect(clearMineralsButton.getAttribute('type')).toBe('button');
  });
});
