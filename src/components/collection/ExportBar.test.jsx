import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

let stateIndex = 0;
let mockExporting = null;
let mockDone = null;
const mockSetExporting = vi.fn((val) => { mockExporting = val; });
const mockSetDone = vi.fn((val) => { mockDone = val; });

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      stateIndex++;
      if (stateIndex === 1) {
        return [mockExporting !== null ? mockExporting : (typeof initial === 'function' ? initial() : initial), mockSetExporting];
      }
      if (stateIndex === 2) {
        return [mockDone !== null ? mockDone : (typeof initial === 'function' ? initial() : initial), mockSetDone];
      }
      return [typeof initial === 'function' ? initial() : initial, vi.fn()];
    },
  };
});

vi.mock('lucide-react', () => ({
  FileSpreadsheet: vi.fn(({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-csv" aria-hidden={ariaHidden} />),
  FileText: vi.fn(({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-kmz" aria-hidden={ariaHidden} />),
  Loader2: vi.fn(({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-loader" aria-hidden={ariaHidden} />),
  Check: vi.fn(({ 'aria-hidden': ariaHidden }) => <svg data-testid="icon-check" aria-hidden={ariaHidden} />),
}));

vi.mock('@/lib/specimenExport', () => ({
  exportToCsv: vi.fn(),
  exportToKmz: vi.fn(),
}));

import ExportBar from './ExportBar';
import { exportToCsv, exportToKmz } from '@/lib/specimenExport';
import { FileSpreadsheet, FileText, Loader2, Check } from 'lucide-react';

function renderExportBar({ logs, exporting = null, done = null }) {
  stateIndex = 0;
  mockExporting = exporting;
  mockDone = done;
  return ExportBar({ logs });
}

describe('ExportBar', () => {
  beforeEach(() => {
    mockExporting = null;
    mockDone = null;
    mockSetExporting.mockClear();
    mockSetDone.mockClear();
    vi.mocked(exportToCsv).mockClear();
    vi.mocked(exportToKmz).mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Disabled and empty states', () => {
    it('renders disabled buttons with title tooltips and descriptive aria-labels when logs are empty, null, or undefined', () => {
      [[], null, undefined].forEach((logs) => {
        const result = renderExportBar({ logs });
        const [csvButton, kmzButton] = result.props.children;

        expect(csvButton.props.type).toBe('button');
        expect(csvButton.props.disabled).toBe(true);
        expect(csvButton.props.title).toBe('No specimens available to export');
        expect(csvButton.props['aria-label']).toBe('Export as CSV spreadsheet (No specimens to export)');

        expect(kmzButton.props.type).toBe('button');
        expect(kmzButton.props.disabled).toBe(true);
        expect(kmzButton.props.title).toBe('No specimens available to export');
        expect(kmzButton.props['aria-label']).toBe('Export as KMZ for Google Earth (No specimens to export)');
      });
    });

    it('returns early and does not trigger export or state updates when logs are missing', async () => {
      const result = renderExportBar({ logs: [] });
      const [csvButton, kmzButton] = result.props.children;

      await csvButton.props.onClick();
      await kmzButton.props.onClick();

      expect(mockSetExporting).not.toHaveBeenCalled();
      expect(mockSetDone).not.toHaveBeenCalled();
      expect(exportToCsv).not.toHaveBeenCalled();
      expect(exportToKmz).not.toHaveBeenCalled();
    });
  });

  describe('Enabled state & button properties', () => {
    it('renders enabled buttons with active aria-labels and no title when valid logs exist', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs });
      const [csvButton, kmzButton] = result.props.children;

      expect(csvButton.props.disabled).toBe(false);
      expect(csvButton.props.title).toBeUndefined();
      expect(csvButton.props['aria-label']).toBe('Export as CSV spreadsheet');
      expect(csvButton.props.className).toContain('focus-visible:ring-emerald-400');

      expect(kmzButton.props.disabled).toBe(false);
      expect(kmzButton.props.title).toBeUndefined();
      expect(kmzButton.props['aria-label']).toBe('Export as KMZ for Google Earth');
      expect(kmzButton.props.className).toContain('focus-visible:ring-amber-400');
    });

    it('sets aria-hidden="true" on default file icons', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs });
      const [csvButton, kmzButton] = result.props.children;

      const [csvIcon, csvLabel] = csvButton.props.children;
      const [kmzIcon, kmzLabel] = kmzButton.props.children;

      expect(csvIcon.type).toBe(FileSpreadsheet);
      expect(csvIcon.props['aria-hidden']).toBe('true');
      expect(csvLabel.props.children).toBe('CSV');

      expect(kmzIcon.type).toBe(FileText);
      expect(kmzIcon.props['aria-hidden']).toBe('true');
      expect(kmzLabel.props.children).toBe('KMZ');
    });
  });

  describe('Exporting loading state (exporting)', () => {
    it('renders loading UI and disables buttons when exporting === "csv"', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs, exporting: 'csv' });
      const [csvButton, kmzButton] = result.props.children;

      expect(csvButton.props.disabled).toBe(true);
      expect(csvButton.props['aria-label']).toBe('Exporting CSV spreadsheet...');
      expect(csvButton.props.children[0].type).toBe(Loader2);
      expect(csvButton.props.children[0].props['aria-hidden']).toBe('true');

      // KMZ button is also disabled while CSV is exporting
      expect(kmzButton.props.disabled).toBe(true);
    });

    it('renders loading UI and disables buttons when exporting === "kmz"', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs, exporting: 'kmz' });
      const [csvButton, kmzButton] = result.props.children;

      expect(kmzButton.props.disabled).toBe(true);
      expect(kmzButton.props['aria-label']).toBe('Exporting KMZ file...');
      expect(kmzButton.props.children[0].type).toBe(Loader2);
      expect(kmzButton.props.children[0].props['aria-hidden']).toBe('true');

      // CSV button is also disabled while KMZ is exporting
      expect(csvButton.props.disabled).toBe(true);
    });
  });

  describe('Export completed state (done)', () => {
    it('renders completed UI with check icon and emerald theme when done === "csv"', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs, done: 'csv' });
      const [csvButton] = result.props.children;

      expect(csvButton.props['aria-label']).toBe('Exported CSV spreadsheet');
      expect(csvButton.props.children[0].type).toBe(Check);
      expect(csvButton.props.children[0].props['aria-hidden']).toBe('true');
      expect(csvButton.props.children[1].props.children).toBe('Exported');

      expect(csvButton.props.style.background).toBe('hsla(150,60%,25%,0.4)');
      expect(csvButton.props.style.color).toBe('#34d399');
    });

    it('renders completed UI with check icon and amber theme when done === "kmz"', () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs, done: 'kmz' });
      const [, kmzButton] = result.props.children;

      expect(kmzButton.props['aria-label']).toBe('Exported KMZ file');
      expect(kmzButton.props.children[0].type).toBe(Check);
      expect(kmzButton.props.children[0].props['aria-hidden']).toBe('true');
      expect(kmzButton.props.children[1].props.children).toBe('Exported');

      expect(kmzButton.props.style.background).toBe('hsla(45,60%,25%,0.4)');
      expect(kmzButton.props.style.color).toBe('#fbbf24');
    });
  });

  describe('Async export execution & lifecycle (handleExport)', () => {
    it('executes full CSV export lifecycle when CSV button is clicked', async () => {
      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs });
      const [csvButton] = result.props.children;

      const exportPromise = csvButton.props.onClick();

      expect(mockSetExporting).toHaveBeenCalledWith('csv');
      expect(mockSetDone).toHaveBeenCalledWith(null);

      // Advance 300ms spinner delay
      await vi.advanceTimersByTimeAsync(300);
      await exportPromise;

      expect(exportToCsv).toHaveBeenCalledWith(mockLogs);
      expect(exportToKmz).not.toHaveBeenCalled();
      expect(mockSetDone).toHaveBeenCalledWith('csv');
      expect(mockSetExporting).toHaveBeenCalledWith(null);

      // Advance 2000ms done message clearing timeout
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockSetDone).toHaveBeenLastCalledWith(null);
    });

    it('executes full KMZ export lifecycle when KMZ button is clicked', async () => {
      const mockLogs = [{ id: '2', mineral_name: 'Amethyst' }];
      const result = renderExportBar({ logs: mockLogs });
      const [, kmzButton] = result.props.children;

      const exportPromise = kmzButton.props.onClick();

      expect(mockSetExporting).toHaveBeenCalledWith('kmz');
      expect(mockSetDone).toHaveBeenCalledWith(null);

      // Advance 300ms spinner delay
      await vi.advanceTimersByTimeAsync(300);
      await exportPromise;

      expect(exportToKmz).toHaveBeenCalledWith(mockLogs);
      expect(exportToCsv).not.toHaveBeenCalled();
      expect(mockSetDone).toHaveBeenCalledWith('kmz');
      expect(mockSetExporting).toHaveBeenCalledWith(null);

      // Advance 2000ms done message clearing timeout
      await vi.advanceTimersByTimeAsync(2000);
      expect(mockSetDone).toHaveBeenLastCalledWith(null);
    });

    it('handles export errors gracefully without throwing and ensures exporting state is reset', async () => {
      vi.mocked(exportToCsv).mockImplementationOnce(() => {
        throw new Error('Export error');
      });

      const mockLogs = [{ id: '1', mineral_name: 'Quartz' }];
      const result = renderExportBar({ logs: mockLogs });
      const [csvButton] = result.props.children;

      const exportPromise = csvButton.props.onClick();
      await vi.advanceTimersByTimeAsync(300);
      await exportPromise;

      expect(exportToCsv).toHaveBeenCalledWith(mockLogs);
      expect(mockSetDone).not.toHaveBeenCalledWith('csv');
      expect(mockSetExporting).toHaveBeenLastCalledWith(null);
    });
  });
});
