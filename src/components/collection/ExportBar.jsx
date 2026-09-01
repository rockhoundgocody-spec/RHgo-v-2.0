/**
 * ExportBar — CSV and KMZ export buttons for the Private Rock Log.
 * Lets users download their full collection as a spreadsheet or Google Earth file.
 */
import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2, Check } from 'lucide-react';
import { exportToCsv, exportToKmz } from '@/lib/specimenExport';

export default function ExportBar({ logs }) {
  const [exporting, setExporting] = useState(null);
  const [done, setDone] = useState(null);

  const handleExport = async (format) => {
    if (!logs || logs.length === 0) return;
    setExporting(format);
    setDone(null);
    // Small delay so the spinner is visible for large exports
    await new Promise(r => setTimeout(r, 300));
    try {
      if (format === 'csv') {
        exportToCsv(logs);
      } else {
        exportToKmz(logs);
      }
      setDone(format);
      setTimeout(() => setDone(null), 2000);
    } catch {}
    setExporting(null);
  };

  const hasLogs = logs && logs.length > 0;

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={!hasLogs || exporting !== null}
        aria-label="Export as CSV spreadsheet"
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-40"
        style={{
          background: done === 'csv' ? 'hsla(150,60%,25%,0.4)' : 'hsla(150,40%,15%,0.5)',
          border: `1px solid ${done === 'csv' ? 'hsla(150,70%,50%,0.4)' : 'hsla(150,50%,40%,0.25)'}`,
          color: done === 'csv' ? '#34d399' : '#86efac',
        }}
      >
        {exporting === 'csv' ? <Loader2 size={12} className="animate-spin" />
         : done === 'csv' ? <Check size={12} />
         : <FileSpreadsheet size={12} />}
        {done === 'csv' ? 'Exported' : 'CSV'}
      </button>
      <button
        onClick={() => handleExport('kmz')}
        disabled={!hasLogs || exporting !== null}
        aria-label="Export as KMZ for Google Earth"
        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-40"
        style={{
          background: done === 'kmz' ? 'hsla(45,60%,25%,0.4)' : 'hsla(45,40%,15%,0.5)',
          border: `1px solid ${done === 'kmz' ? 'hsla(45,70%,50%,0.4)' : 'hsla(45,50%,40%,0.25)'}`,
          color: done === 'kmz' ? '#fbbf24' : '#fcd34d',
        }}
      >
        {exporting === 'kmz' ? <Loader2 size={12} className="animate-spin" />
         : done === 'kmz' ? <Check size={12} />
         : <FileText size={12} />}
        {done === 'kmz' ? 'Exported' : 'KMZ'}
      </button>
    </div>
  );
}