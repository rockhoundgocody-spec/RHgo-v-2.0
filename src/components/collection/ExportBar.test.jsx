import { describe, it, expect, vi } from 'vitest';
import React from 'react';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  };
});

vi.mock('lucide-react', () => ({
  FileSpreadsheet: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-csv" aria-hidden={ariaHidden} />,
  FileText: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-kmz" aria-hidden={ariaHidden} />,
  Loader2: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-loader" aria-hidden={ariaHidden} />,
  Check: ({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-check" aria-hidden={ariaHidden} />,
}));

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar';

describe('ExportBar', () => {
  it('renders disabled buttons with title tooltips and descriptive aria-labels when logs are empty', () => {
    const result = ExportBar({ logs: [] });
    const children = result.props.children;
    const [csvButton, kmzButton] = children;

    expect(csvButton.props.type).toBe('button');
    expect(csvButton.props.disabled).toBe(true);
    expect(csvButton.props.title).toBe('No specimens available to export');
    expect(csvButton.props['aria-label']).toBe('Export as CSV spreadsheet (No specimens to export)');

    expect(kmzButton.props.type).toBe('button');
    expect(kmzButton.props.disabled).toBe(true);
    expect(kmzButton.props.title).toBe('No specimens available to export');
    expect(kmzButton.props['aria-label']).toBe('Export as KMZ for Google Earth (No specimens to export)');
  });

  it('renders enabled buttons with active aria-labels when logs exist', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
    const result = ExportBar({ logs: mockLogs });
    const [csvButton, kmzButton] = result.props.children;

    expect(csvButton.props.disabled).toBe(false);
    expect(csvButton.props.title).toBeUndefined();
    expect(csvButton.props['aria-label']).toBe('Export as CSV spreadsheet');

    expect(kmzButton.props.disabled).toBe(false);
    expect(kmzButton.props.title).toBeUndefined();
    expect(kmzButton.props['aria-label']).toBe('Export as KMZ for Google Earth');
  });

  it('sets aria-hidden="true" on icons inside buttons', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
    const result = ExportBar({ logs: mockLogs });
    const [csvButton, kmzButton] = result.props.children;

    expect(csvButton.props.children[0].props['aria-hidden']).toBe('true');
    expect(kmzButton.props.children[0].props['aria-hidden']).toBe('true');
  });
});
