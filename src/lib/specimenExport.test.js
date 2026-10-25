// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCsv, exportToKmz } from './specimenExport';

describe('specimenExport', () => {
  let createdLinks = [];
  let capturedBlobs = [];
  let originalCreateObjectURL;
  let originalRevokeObjectURL;
  let originalBlob;

  beforeEach(() => {
    createdLinks = [];
    capturedBlobs = [];

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalBlob = globalThis.Blob;

    globalThis.Blob = class MockBlob {
      constructor(parts, options) {
        const content = parts ? parts.join('') : '';
        const blobInstance = new originalBlob(parts, options);
        capturedBlobs.push({ content, type: options?.type, instance: blobInstance });
        return blobInstance;
      }
    };

    URL.createObjectURL = vi.fn((blob) => {
      return `blob:mock-url-${capturedBlobs.length}`;
    });

    URL.revokeObjectURL = vi.fn();

    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const el = realCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        el.click = vi.fn();
        createdLinks.push(el);
      }
      return el;
    });

    vi.spyOn(document.body, 'appendChild');
    vi.spyOn(document.body, 'removeChild');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    globalThis.Blob = originalBlob;
  });

  describe('exportToCsv', () => {
    it('exports CSV with default filename and correct MIME type', () => {
      const logs = [];
      exportToCsv(logs);

      expect(capturedBlobs.length).toBe(1);
      expect(capturedBlobs[0].type).toBe('text/csv');

      expect(createdLinks.length).toBe(1);
      expect(createdLinks[0].download).toBe('rockhound-finds.csv');
      expect(createdLinks[0].href).toBe('blob:mock-url-1');

      expect(document.body.appendChild).toHaveBeenCalledWith(createdLinks[0]);
      expect(createdLinks[0].click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(createdLinks[0]);

      vi.advanceTimersByTime(1000);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-1');
    });

    it('uses custom filename when provided', () => {
      exportToCsv([], 'my-custom-finds.csv');
      expect(createdLinks[0].download).toBe('my-custom-finds.csv');
    });

    it('generates correct header row when logs array is empty', () => {
      exportToCsv([]);
      const text = capturedBlobs[0].content;
      expect(text).toBe(
        'Mineral Name,Rarity,Found Date,Location,Latitude,Longitude,Weight (lbs),Notes,Image URL'
      );
    });

    it('formats log entries into CSV rows correctly', () => {
      const logs = [
        {
          mineral_name: 'Amethyst',
          rarity: 'Uncommon',
          found_date: '2026-03-15',
          location_label: 'Thunder Bay',
          lat: 48.3809,
          lng: -89.2477,
          weight_lbs: 2.5,
          notes: 'Vibrant purple crystal',
          image_url: 'https://example.com/amethyst.jpg',
        },
      ];

      exportToCsv(logs);
      const text = capturedBlobs[0].content;
      const lines = text.split('\n');

      expect(lines.length).toBe(2);
      expect(lines[0]).toBe(
        'Mineral Name,Rarity,Found Date,Location,Latitude,Longitude,Weight (lbs),Notes,Image URL'
      );
      expect(lines[1]).toBe(
        'Amethyst,Uncommon,2026-03-15,Thunder Bay,48.3809,-89.2477,2.5,Vibrant purple crystal,https://example.com/amethyst.jpg'
      );
    });

    it('handles null, undefined, and missing fields gracefully', () => {
      const logs = [
        {
          mineral_name: null,
          rarity: undefined,
          // other fields missing
        },
      ];

      exportToCsv(logs);
      const text = capturedBlobs[0].content;
      const lines = text.split('\n');

      expect(lines[1]).toBe(',,,,,,,,');
    });

    it('escapes fields containing commas, double quotes, and newlines', () => {
      const logs = [
        {
          mineral_name: 'Agate, Banded',
          rarity: 'Rare "Special"',
          found_date: '2026-01-01',
          location_label: 'Line 1\nLine 2',
          notes: 'Double quote "and" comma, here',
        },
      ];

      exportToCsv(logs);
      const text = capturedBlobs[0].content;

      expect(text).toContain('"Agate, Banded"');
      expect(text).toContain('"Rare ""Special"""');
      expect(text).toContain('"Line 1\nLine 2"');
      expect(text).toContain('"Double quote ""and"" comma, here"');
    });
  });

  it('neutralizes formulas and keeps zero-valued coordinates and weight', () => {
    exportToCsv([{ mineral_name: '=HYPERLINK("https://example.invalid")', notes: '\t@SUM(1)', lat: 0, lng: 0, weight_lbs: 0 }]);
    const csv = capturedBlobs[0].content;
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'\t@SUM(1)");
    expect(csv).toContain(',0,0,0,');
    exportToKmz([{ mineral_name: 'Zero fixture', notes: ']]><script>bad</script>', lat: 0, lng: 0 }]);
    expect(capturedBlobs[1].content).toContain('<coordinates>0,0,0</coordinates>');
    expect(capturedBlobs[1].content).not.toContain('<script>');
  });

  describe('exportToKmz', () => {
    it('exports KML with default filename and correct MIME type', () => {
      exportToKmz([]);

      expect(capturedBlobs.length).toBe(1);
      expect(capturedBlobs[0].type).toBe('application/vnd.google-earth.kml+xml');

      expect(createdLinks.length).toBe(1);
      expect(createdLinks[0].download).toBe('rockhound-finds.kml');
      expect(createdLinks[0].href).toBe('blob:mock-url-1');

      expect(document.body.appendChild).toHaveBeenCalledWith(createdLinks[0]);
      expect(createdLinks[0].click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(createdLinks[0]);

      vi.advanceTimersByTime(1000);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-1');
    });

    it('uses custom filename when provided', () => {
      exportToKmz([], 'custom-map.kml');
      expect(createdLinks[0].download).toBe('custom-map.kml');
    });

    it('filters out logs missing latitude or longitude', () => {
      const logs = [
        { mineral_name: 'No Coordinates' },
        { mineral_name: 'Lat Only', lat: 45.0 },
        { mineral_name: 'Lng Only', lng: -93.0 },
        { mineral_name: 'Valid Specimen', lat: 45.0, lng: -93.0 },
      ];

      exportToKmz(logs);
      const text = capturedBlobs[0].content;

      expect(text).not.toContain('No Coordinates');
      expect(text).not.toContain('Lat Only');
      expect(text).not.toContain('Lng Only');
      expect(text).toContain('Valid Specimen');
    });

    it('generates valid KML structure and Placemark formatting with coordinates', () => {
      const logs = [
        {
          mineral_name: 'Lake Superior Agate',
          rarity: 'Legendary',
          found_date: '2026-05-20',
          location_label: 'Moose Lake, MN',
          lat: 46.4533,
          lng: -92.7616,
          weight_lbs: 1.2,
          notes: 'Found near gravel pit',
          image_url: 'https://example.com/agate.jpg',
        },
      ];

      exportToKmz(logs);
      const text = capturedBlobs[0].content;

      expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(text).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
      expect(text).toContain('<name>RockHound GO Finds</name>');
      expect(text).toContain('<description>Private rock collection export</description>');

      expect(text).toContain('<Placemark>');
      expect(text).toContain('<name>Lake Superior Agate</name>');
      expect(text).toContain('<coordinates>-92.7616,46.4533,0</coordinates>');

      expect(text).toContain('<![CDATA[');
      expect(text).toContain('Rarity: Legendary');
      expect(text).toContain('Found: 2026-05-20');
      expect(text).toContain('Location: Moose Lake, MN');
      expect(text).toContain('Weight: 1.2 lbs');
      expect(text).toContain('Notes: Found near gravel pit');
      expect(text).toContain('<img src="https://example.com/agate.jpg" width="200"/>');
      expect(text).toContain(']]>');
    });

    it('uses "Unknown" as fallback mineral name when mineral_name is missing', () => {
      const logs = [{ lat: 10.0, lng: 20.0 }];

      exportToKmz(logs);
      const text = capturedBlobs[0].content;

      expect(text).toContain('<name>Unknown</name>');
    });

    it('escapes XML special characters in mineral names', () => {
      const logs = [
        {
          mineral_name: 'Quartz & Calcite <A> & <B>',
          lat: 12.34,
          lng: 56.78,
        },
      ];

      exportToKmz(logs);
      const text = capturedBlobs[0].content;

      expect(text).toContain('<name>Quartz &amp; Calcite &lt;A&gt; &amp; &lt;B&gt;</name>');
    });
  });
});