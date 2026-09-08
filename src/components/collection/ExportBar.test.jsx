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
  it('renders disabled buttons with explanatory title tooltips when logs are empty', () => {
    const tree = ExportBar({ logs: [] });
    expect(tree).toBeDefined();

    const [statusDiv, csvBtn, kmzBtn] = tree.props.children;

    expect(statusDiv.props.role).toBe('status');
    expect(statusDiv.props['aria-live']).toBe('polite');

    expect(csvBtn.props.disabled).toBe(true);
    expect(csvBtn.props.title).toBe('No logged specimens available to export');
    expect(csvBtn.props['aria-label']).toBe('Export as CSV spreadsheet');

    expect(kmzBtn.props.disabled).toBe(true);
    expect(kmzBtn.props.title).toBe('No logged specimens available to export');
    expect(kmzBtn.props['aria-label']).toBe('Export as KMZ for Google Earth');
  });

  it('renders active enabled buttons with title tooltips when logs are present', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
    const tree = ExportBar({ logs: mockLogs });

    const [, csvBtn, kmzBtn] = tree.props.children;

    expect(csvBtn.props.disabled).toBe(false);
    expect(csvBtn.props.title).toBe('Export as CSV spreadsheet');
    expect(csvBtn.props['aria-label']).toBe('Export as CSV spreadsheet');
    expect(csvBtn.props.className).toContain('focus-visible:ring-emerald-400');

    expect(kmzBtn.props.disabled).toBe(false);
    expect(kmzBtn.props.title).toBe('Export as KMZ for Google Earth');
    expect(kmzBtn.props['aria-label']).toBe('Export as KMZ for Google Earth');
    expect(kmzBtn.props.className).toContain('focus-visible:ring-amber-400');
  });
});
