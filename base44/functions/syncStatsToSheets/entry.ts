import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SHEET_NAME = 'RockHound-GO Daily Stats';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    if (!accessToken) return Response.json({ error: 'Google Sheets not connected' }, { status: 500 });

    // ── Aggregate anonymized stats ──
    const [specimens, hotspots, profiles] = await Promise.all([
      base44.asServiceRole.entities.Specimen.list('-created_date', 10000),
      base44.asServiceRole.entities.Hotspot.list('-created_date', 10000),
      base44.asServiceRole.entities.PlayerProfile.list('-created_date', 10000),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    const specimensToday = (specimens || []).filter(s => (s.created_date || '').slice(0, 10) === today).length;

    const mineralCounts = {};
    const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (const s of specimens || []) {
      const name = (s.mineral_name || 'Unknown').trim();
      mineralCounts[name] = (mineralCounts[name] || 0) + 1;
      if (rarityCounts[s.rarity] != null) rarityCounts[s.rarity]++;
    }
    const topMinerals = Object.entries(mineralCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => [name, String(count)]);

    // ── Find or create spreadsheet ──
    let spreadsheetId = await findSheet(accessToken);
    if (!spreadsheetId) {
      spreadsheetId = await createSheet(accessToken);
    }
    await ensureTabs(accessToken, spreadsheetId);

    // ── Append daily stats row ──
    const dailyRow = [
      today,
      String(profiles?.length || 0),
      String(specimens?.length || 0),
      String(specimensToday),
      String(hotspots?.length || 0),
      String(rarityCounts.common),
      String(rarityCounts.uncommon),
      String(rarityCounts.rare),
      String(rarityCounts.legendary),
    ];
    await appendRow(accessToken, spreadsheetId, 'Daily Stats', dailyRow);

    // ── Overwrite Top Minerals tab ──
    const mineralRows = [['Mineral', 'Find Count'], ...topMinerals];
    await writeRange(accessToken, spreadsheetId, 'Top Minerals', 'A1', mineralRows);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return Response.json({
      status: 'ok',
      spreadsheet_id: spreadsheetId,
      sheet_url: sheetUrl,
      stats: {
        date: today,
        total_users: profiles?.length || 0,
        total_specimens: specimens?.length || 0,
        specimens_today: specimensToday,
        total_hotspots: hotspots?.length || 0,
        rarity_distribution: rarityCounts,
        top_minerals: topMinerals.slice(0, 5).map(([n, c]) => ({ name: n, count: Number(c) })),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findSheet(token) {
  const q = encodeURIComponent(`name='${SHEET_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createSheet(token) {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title: SHEET_NAME } }),
  });
  const data = await res.json();
  return data.spreadsheetId;
}

async function ensureTabs(token, spreadsheetId) {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const existing = (meta.sheets || []).map(s => s.properties.title);

  const need = ['Daily Stats', 'Top Minerals'].filter(t => !existing.includes(t));
  if (need.length) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: need.map(title => ({ addSheet: { properties: { title } } })) }),
    });
  }

  // Initialize Daily Stats header if the tab was just added
  if (!existing.includes('Daily Stats')) {
    await writeRange(token, spreadsheetId, 'Daily Stats', 'A1', [[
      'Date', 'Total Users', 'Total Specimens', 'Specimens Today',
      'Total Hotspots', 'Common', 'Uncommon', 'Rare', 'Legendary',
    ]]);
  }
}

async function appendRow(token, spreadsheetId, sheet, row) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}!A:A:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
}

async function writeRange(token, spreadsheetId, sheet, range, rows) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}!${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  });
}