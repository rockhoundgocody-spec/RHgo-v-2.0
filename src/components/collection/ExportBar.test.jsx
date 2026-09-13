import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
    useId: () => 'export-bar-id',
  };
});

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar.jsx';

describe('ExportBar', () => {
  const mockLogs = [
    { id: '1', mineral_name: 'Quartz', found_at: 'Colorado' },
    { id: '2', mineral_name: 'Fluorite', found_at: 'Illinois' },
  ];

  it('renders disabled buttons with explanatory title tooltips when logs are empty', () => {
    const el = ExportBar({ logs: [] });
    expect(el).toBeDefined();
    expect(el.props.role).toBe('region');
    expect(el.props['aria-label']).toBe('Export collection options');

    const [csvBtn, kmzBtn] = el.props.children;
    expect(csvBtn.props.disabled).toBe(true);
    expect(csvBtn.props.title).toBe('No items available to export');
    expect(csvBtn.props['aria-label']).toBe('Export collection as CSV spreadsheet');

    expect(kmzBtn.props.disabled).toBe(true);
    expect(kmzBtn.props.title).toBe('No items available to export');
    expect(kmzBtn.props['aria-label']).toBe('Export collection as KMZ for Google Earth');
  });

  it('renders enabled buttons with action title tooltips when logs exist', () => {
    const el = ExportBar({ logs: mockLogs });
    const [csvBtn, kmzBtn] = el.props.children;

    expect(csvBtn.props.disabled).toBe(false);
    expect(csvBtn.props.title).toBe('Export collection as CSV spreadsheet');
    expect(csvBtn.props['aria-label']).toBe('Export collection as CSV spreadsheet');

    expect(kmzBtn.props.disabled).toBe(false);
    expect(kmzBtn.props.title).toBe('Export collection as KMZ for Google Earth');
    expect(kmzBtn.props['aria-label']).toBe('Export collection as KMZ for Google Earth');
  });
});
