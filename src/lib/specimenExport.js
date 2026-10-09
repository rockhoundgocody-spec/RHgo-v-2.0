/**
 * specimenExport — CSV and KML export utilities for PrivateRockLog entries.
 * CSV is a flat spreadsheet; KML is a Google Earth-compatible placemark file.
 */

/**
 * Export an array of rock log entries as a downloadable CSV file.
 */
export function exportToCsv(logs, filename = 'rockhound-finds.csv') {
  const headers = [
    'Mineral Name',
    'Rarity',
    'Found Date',
    'Location',
    'Latitude',
    'Longitude',
    'Weight (lbs)',
    'Notes',
    'Image URL',
  ];

  const escape = (val) => {
    if (val == null) return '';
    const raw = String(val);
    const s = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = logs.map(log => [
    escape(log.mineral_name),
    escape(log.rarity),
    escape(log.found_date),
    escape(log.location_label),
    typeof log.lat === 'number' && Number.isFinite(log.lat) ? log.lat : '',
    typeof log.lng === 'number' && Number.isFinite(log.lng) ? log.lng : '',
    typeof log.weight_lbs === 'number' && Number.isFinite(log.weight_lbs) ? log.weight_lbs : '',
    escape(log.notes),
    escape(log.image_url),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadBlob(csv, filename, 'text/csv');
}

/**
 * Export an array of rock log entries as a downloadable KMZ-compatible KML file.
 * (We generate KML — Google Earth opens KML directly; zipping to KMZ adds no
 * value for this data volume and would require a zip library we don't have.)
 */
export function exportToKmz(logs, filename = 'rockhound-finds.kml') {
  const placemarks = logs
    .filter(log => typeof log.lat === 'number' && Number.isFinite(log.lat) && typeof log.lng === 'number' && Number.isFinite(log.lng))
    .map(log => {
      const name = log.mineral_name || 'Unknown';
      const desc = [
        log.rarity ? `Rarity: ${escapeXml(log.rarity)}` : '',
        log.found_date ? `Found: ${escapeXml(log.found_date)}` : '',
        log.location_label ? `Location: ${escapeXml(log.location_label)}` : '',
        log.weight_lbs != null ? `Weight: ${escapeXml(log.weight_lbs)} lbs` : '',
        log.notes ? `Notes: ${escapeXml(log.notes)}` : '',
        /^https:\/\//i.test(log.image_url || '') ? `<img src="${escapeXml(log.image_url)}" width="200"/>` : '',
      ].filter(Boolean).join('<br/>');

      return `    <Placemark>
      <name>${escapeXml(name)}</name>
      <description><![CDATA[${desc}]]></description>
      <Point>
        <coordinates>${log.lng},${log.lat},0</coordinates>
      </Point>
    </Placemark>`;
    })
    .join('\n');

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>RockHound GO Finds</name>
    <description>Private rock collection export</description>
${placemarks}
  </Document>
</kml>`;

  downloadBlob(kml, filename, 'application/vnd.google-earth.kml+xml');
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}