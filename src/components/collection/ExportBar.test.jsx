import { describe, it, expect, vi } from 'vitest';
import ExportBar from './ExportBar';

// Mock react's useState to support calling components directly as pure functions
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: (initial) => [initial, vi.fn()],
  };
});

// Mock export functions
vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

describe('ExportBar', () => {
  it('renders disabled buttons with tooltips and disabled ARIA labels when logs are empty', () => {
    const result = ExportBar({ logs: [] });

    // Result is a React element (div)
    const [csvBtn, kmzBtn] = result.props.children;

    expect(csvBtn.props.disabled).toBe(true);
    expect(kmzBtn.props.disabled).toBe(true);
    expect(csvBtn.props['aria-label']).toBe('CSV export disabled: no specimens in collection');
    expect(kmzBtn.props['aria-label']).toBe('KMZ export disabled: no specimens in collection');
    expect(csvBtn.props.title).toBe('No specimens to export yet');
    expect(kmzBtn.props.title).toBe('No specimens to export yet');
  });

  it('renders enabled buttons with proper ARIA labels when logs exist', () => {
    const mockLogs = [{ id: '1', mineral_name: 'Amethyst' }];
    const result = ExportBar({ logs: mockLogs });

    const [csvBtn, kmzBtn] = result.props.children;

    expect(csvBtn.props.disabled).toBe(false);
    expect(kmzBtn.props.disabled).toBe(false);
    expect(csvBtn.props['aria-label']).toBe('Export collection as CSV spreadsheet');
    expect(kmzBtn.props['aria-label']).toBe('Export collection as KMZ file for Google Earth');
    expect(csvBtn.props.title).toBeUndefined();
    expect(kmzBtn.props.title).toBeUndefined();
  });
});
