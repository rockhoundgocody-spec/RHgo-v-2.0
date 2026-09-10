import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
  };
});

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar.jsx';

describe('ExportBar', () => {
  it('renders disabled state with informative aria-label and title when logs are empty', () => {
    const element = ExportBar({ logs: [] });
    expect(element).toBeDefined();

    const [csvButton, kmzButton] = element.props.children;

    expect(csvButton.props.disabled).toBe(true);
    expect(csvButton.props['aria-label']).toBe('Export as CSV disabled: No rock logs available');
    expect(csvButton.props.title).toBe('No rock logs available to export');

    expect(kmzButton.props.disabled).toBe(true);
    expect(kmzButton.props['aria-label']).toBe('Export as KMZ disabled: No rock logs available');
    expect(kmzButton.props.title).toBe('No rock logs available to export');
  });

  it('renders active state with accessible aria-label and title when logs exist', () => {
    const mockLogs = [{ id: 1, mineral_name: 'Quartz' }];
    const element = ExportBar({ logs: mockLogs });

    const [csvButton, kmzButton] = element.props.children;

    expect(csvButton.props.disabled).toBe(false);
    expect(csvButton.props['aria-label']).toBe('Export collection as CSV spreadsheet');
    expect(csvButton.props.title).toBe('Export as CSV spreadsheet');

    expect(kmzButton.props.disabled).toBe(false);
    expect(kmzButton.props['aria-label']).toBe('Export collection as KMZ for Google Earth');
    expect(kmzButton.props.title).toBe('Export as KMZ for Google Earth');
  });
});
