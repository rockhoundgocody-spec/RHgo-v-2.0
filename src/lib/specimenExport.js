/**
 * specimenExport — CSV and KMZ export utilities for PrivateRockLog entries.
 * CSV is a flat spreadsheet; KMZ is a Google Earth-compatible placemark file.
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
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = logs.map(log => [
    escape(log.mineral_name),
    escape(log.rarity),
    escape(log.found_date),
    escape(log.location_label),
    log.lat || '',
    log.lng || '',
    log.weight_lbs || '',
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
    .filter(log => log.lat && log.lng)
    .map(log => {
      const name = log.mineral_name || 'Unknown';
      const desc = [
        log.rarity ? `Rarity: ${log.rarity}` : '',
        log.found_date ? `Found: ${log.found_date}` : '',
        log.location_label ? `Location: ${log.location_label}` : '',
        log.weight_lbs ? `Weight: ${log.weight_lbs} lbs` : '',
        log.notes ? `Notes: ${log.notes}` : '',
        log.image_url ? `<img src="${log.image_url}" width="200"/>` : '',
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
    <name>RockHound-GO Finds</name>
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
    .replace(/>/g, '&gt;');
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