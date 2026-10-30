// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

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
  it('does not render sheet modal when open is false', () => {
    const { container } = render(
      <MapFilterSheet
        open={false}
        onClose={vi.fn()}
        activeLayer="all"
        onLayerChange={vi.fn()}
        selectedMinerals={new Set()}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
      />
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog with accessible ARIA attributes, radio groups, and options when open is true', () => {
    const onClose = vi.fn();
    const onLayerChange = vi.fn();

    render(
      <MapFilterSheet
        open={true}
        onClose={onClose}
        activeLayer="public"
        onLayerChange={onLayerChange}
        selectedMinerals={new Set(['quartz'])}
        onToggleMineral={vi.fn()}
        onClearMinerals={vi.fn()}
        minerals={['quartz', 'beryl']}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeDefined();
    expect(dialog.getAttribute('tabindex')).toBe('-1');

    // Verify radio groups and radio items
    const radioGroups = screen.getAllByRole('radiogroup');
    expect(radioGroups.length).toBeGreaterThanOrEqual(2);

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);

    const publicRadio = screen.getByRole('radio', { name: /public land/i });
    expect(publicRadio.getAttribute('aria-checked')).toBe('true');

    // Test layer change
    const feeRadio = screen.getByRole('radio', { name: /fee \/ permit/i });
    fireEvent.click(feeRadio);
    expect(onLayerChange).toHaveBeenCalledWith('land');

    // Test Escape key dismissal (handled by focus trap / Escape listener)
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
