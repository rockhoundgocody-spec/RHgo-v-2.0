import { describe, it, expect, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
    useMemo: (factory) => factory(),
  };
});

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar.jsx';

describe('ExportBar', () => {
  it('renders export buttons disabled when logs array is empty or null', () => {
    const emptyBar = ExportBar({ logs: [] });
    expect(emptyBar).toBeDefined();

    const [csvBtn, kmzBtn] = emptyBar.props.children;
    expect(csvBtn.props.disabled).toBe(true);
    expect(kmzBtn.props.disabled).toBe(true);
  });

  it('renders export buttons with proper ARIA labels and focus-visible ring classes when logs are present', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
    const bar = ExportBar({ logs: mockLogs });

    const [csvBtn, kmzBtn] = bar.props.children;

    expect(csvBtn.props.type).toBe('button');
    expect(csvBtn.props.disabled).toBe(false);
    expect(csvBtn.props['aria-label']).toBe('Export as CSV spreadsheet');
    expect(csvBtn.props.className).toContain('focus-visible:ring-emerald-400/50');

    expect(kmzBtn.props.type).toBe('button');
    expect(kmzBtn.props.disabled).toBe(false);
    expect(kmzBtn.props['aria-label']).toBe('Export as KMZ for Google Earth');
    expect(kmzBtn.props.className).toContain('focus-visible:ring-amber-400/50');
  });
});
