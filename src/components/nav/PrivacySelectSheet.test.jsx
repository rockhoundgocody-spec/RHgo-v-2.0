// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import PrivacySelectSheet from './PrivacySelectSheet';

describe('PrivacySelectSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders trigger button with current selection label', () => {
    render(<PrivacySelectSheet value="private" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /privacy private change/i })).not.toBeNull();
  });

  it('opens dialog sheet when trigger is clicked', () => {
    render(<PrivacySelectSheet value="private" onChange={() => {}} />);
    const trigger = screen.getByRole('button', { name: /privacy private change/i });
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: /location privacy/i })).not.toBeNull();
    expect(screen.getByRole('listbox', { name: /location privacy/i })).not.toBeNull();

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    expect(options[1].getAttribute('aria-selected')).toBe('false');
  });

  it('calls onChange with selected value and closes when option is clicked', () => {
    const handleChange = vi.fn();
    render(<PrivacySelectSheet value="private" onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button', { name: /privacy private change/i }));

    const options = screen.getAllByRole('option');
    fireEvent.click(options[1]); // Friends only

    expect(handleChange).toHaveBeenCalledWith('friends');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('navigates listbox options with Arrow keys', () => {
    render(<PrivacySelectSheet value="private" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /privacy private change/i }));

    const listbox = screen.getByRole('listbox', { name: /location privacy/i });
    const options = screen.getAllByRole('option');

    options[0].focus();
    expect(document.activeElement).toBe(options[0]);

    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]);

    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[2]);

    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[1]);

    fireEvent.keyDown(listbox, { key: 'End' });
    expect(document.activeElement).toBe(options[2]);

    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(document.activeElement).toBe(options[0]);
  });
});
