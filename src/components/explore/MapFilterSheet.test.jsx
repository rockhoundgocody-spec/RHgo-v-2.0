// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
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

import MapFilterSheet from './MapFilterSheet.jsx';

describe('MapFilterSheet', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    activeLayer: 'all',
    onLayerChange: vi.fn(),
    selectedMinerals: new Set(['quartz']),
    onToggleMineral: vi.fn(),
    onClearMinerals: vi.fn(),
    minerals: ['quartz', 'tourmaline', 'topaz'],
  };

  it('renders modal dialog with accessible ARIA attributes when open', () => {
    render(<MapFilterSheet {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = screen.getByRole('heading', { name: /map filters/i });
    expect(title).toBeTruthy();
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });

  it('renders access and spots sections as radiogroups with radio options', () => {
    render(<MapFilterSheet {...defaultProps} />);

    const radioGroups = screen.getAllByRole('radiogroup');
    expect(radioGroups).toHaveLength(2);

    const radioOptions = screen.getAllByRole('radio');
    expect(radioOptions.length).toBeGreaterThanOrEqual(6);

    const allAccessRadio = screen.getByRole('radio', { name: /all access/i });
    expect(allAccessRadio.getAttribute('aria-checked')).toBe('true');
  });

  it('triggers onClose when Done button or Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<MapFilterSheet {...defaultProps} onClose={onClose} />);

    const doneBtn = screen.getByRole('button', { name: /done, apply filters and close/i });
    fireEvent.click(doneBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles mineral selection and clear actions', () => {
    const onToggleMineral = vi.fn();
    const onClearMinerals = vi.fn();
    render(
      <MapFilterSheet
        {...defaultProps}
        onToggleMineral={onToggleMineral}
        onClearMinerals={onClearMinerals}
      />
    );

    const tourmalineBtn = screen.getByRole('button', { name: /^tourmaline/i });
    expect(tourmalineBtn).toBeTruthy();
    fireEvent.click(tourmalineBtn);
    expect(onToggleMineral).toHaveBeenCalledWith('tourmaline');

    const clearAllBtn = screen.getByRole('button', { name: /clear all 1 selected minerals/i });
    fireEvent.click(clearAllBtn);
    expect(onClearMinerals).toHaveBeenCalledTimes(1);
  });
});
