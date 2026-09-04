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
  it('renders export buttons with accessibility attributes when disabled (no logs)', () => {
    const component = ExportBar({ logs: [] });
    expect(component).toBeDefined();

    const [csvBtn, kmzBtn] = component.props.children;

    expect(csvBtn.props.disabled).toBe(true);
    expect(csvBtn.props['aria-label']).toBe('Export as CSV spreadsheet');
    expect(csvBtn.props.title).toBe('No logs available to export');
    expect(csvBtn.props.className).toContain('focus-visible:ring-2');
    expect(csvBtn.props.className).toContain('focus-visible:ring-emerald-400/50');

    expect(kmzBtn.props.disabled).toBe(true);
    expect(kmzBtn.props['aria-label']).toBe('Export as KMZ for Google Earth');
    expect(kmzBtn.props.title).toBe('No logs available to export');
    expect(kmzBtn.props.className).toContain('focus-visible:ring-2');
    expect(kmzBtn.props.className).toContain('focus-visible:ring-amber-400/50');
  });

  it('enables export buttons when logs are provided', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
    const component = ExportBar({ logs: mockLogs });

    const [csvBtn, kmzBtn] = component.props.children;

    expect(csvBtn.props.disabled).toBe(false);
    expect(csvBtn.props.title).toBeUndefined();

    expect(kmzBtn.props.disabled).toBe(false);
    expect(kmzBtn.props.title).toBeUndefined();
  });
});
