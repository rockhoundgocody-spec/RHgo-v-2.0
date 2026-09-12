import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar.jsx';

describe('ExportBar', () => {
  const mockLogs = [
    { id: '1', mineral_name: 'Quartz', found_at: 'Location A' },
    { id: '2', mineral_name: 'Amethyst', found_at: 'Location B' },
  ];

  it('renders disabled buttons with explanatory title when logs array is empty or undefined', () => {
    const componentNoLogs = ExportBar({ logs: [] });
    expect(componentNoLogs).toBeDefined();

    const [csvBtn, kmzBtn] = componentNoLogs.props.children;

    expect(csvBtn.props.disabled).toBe(true);
    expect(kmzBtn.props.disabled).toBe(true);
    expect(csvBtn.props.title).toBe('No specimens in log to export');
    expect(kmzBtn.props.title).toBe('No specimens in log to export');
  });

  it('renders enabled buttons with state-aware aria-labels and titles when logs are present', () => {
    const componentWithLogs = ExportBar({ logs: mockLogs });
    const [csvBtn, kmzBtn] = componentWithLogs.props.children;

    expect(csvBtn.props.disabled).toBe(false);
    expect(kmzBtn.props.disabled).toBe(false);
    expect(csvBtn.props.title).toBe('Export 2 log entries as CSV');
    expect(kmzBtn.props.title).toBe('Export 2 log entries as KMZ');
    expect(csvBtn.props['aria-label']).toBe('Export 2 log entries as CSV spreadsheet');
    expect(kmzBtn.props['aria-label']).toBe('Export 2 log entries as KMZ for Google Earth');
  });
});
