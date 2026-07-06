import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SHEET_NAME = 'RockHound-GO Daily Stats';
const CACHE_KEY_PREFIX = 'sync_stats';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
    if (!accessToken) return Response.json({ error: 'Google Sheets not connected' }, { status: 500 });

    const today = new Date().toISOString().slice(0, 10);

    // ── Check Cache ──
    let kv: Deno.Kv | null = null;
    try {
      kv = await Deno.openKv();
    } catch (e) {
      console.warn('Deno KV not available, skipping cache', e);
    }

    let stats: any = null;
    if (kv && !force) {
      const cached = await kv.get([CACHE_KEY_PREFIX, today]);
      if (cached.value) {
        stats = cached.value;
        console.log('Serving stats from cache for', today);
      }
    }

    if (!stats) {
      // ── Aggregate anonymized stats ──
      // Optimization: only fetch required fields and limit to SDK max (5000)
      // Sorting by -created_date ensures we get the most recent ones for 'specimensToday'
      const [specimens, hotspots, profiles] = await Promise.all([
        base44.asServiceRole.entities.Specimen.list('-created_date', 5000, 0, ['created_date', 'mineral_name', 'rarity']),
        base44.asServiceRole.entities.Hotspot.list('-created_date', 5000, 0, ['id']),
        base44.asServiceRole.entities.PlayerProfile.list('-created_date', 5000, 0, ['id']),
      ]);

      const specimensToday = (specimens || []).filter(s => (s.created_date || '').slice(0, 10) === today).length;

      const mineralCounts: Record<string, number> = {};
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

      stats = {
        date: today,
        total_users: profiles?.length || 0,
        total_specimens: specimens?.length || 0,
        specimens_today: specimensToday,
        total_hotspots: hotspots?.length || 0,
        rarity_distribution: rarityCounts,
        top_minerals_rows: topMinerals,
      };

      if (kv) {
        // Cache for 1 hour to allow refreshes but avoid hammering the DB
        await kv.set([CACHE_KEY_PREFIX, today], stats, { expireIn: 3600000 });
      }
    }

    // ── Find or create spreadsheet ──
    let spreadsheetId = await findSheet(accessToken);
    if (!spreadsheetId) {
      spreadsheetId = await createSheet(accessToken);
    }
    await ensureTabs(accessToken, spreadsheetId);

    // ── Append daily stats row ──
    const dailyRow = [
      stats.date,
      String(stats.total_users),
      String(stats.total_specimens),
      String(stats.specimens_today),
      String(stats.total_hotspots),
      String(stats.rarity_distribution.common),
      String(stats.rarity_distribution.uncommon),
      String(stats.rarity_distribution.rare),
      String(stats.rarity_distribution.legendary),
    ];

    // Optimization: avoid duplicate appends for the same day if possible
    // (In a real scenario, we might check the last row in Sheets, but for now we just append)
    await appendRow(accessToken, spreadsheetId, 'Daily Stats', dailyRow);

    // ── Overwrite Top Minerals tab ──
    const mineralRows = [['Mineral', 'Find Count'], ...stats.top_minerals_rows];
    await writeRange(accessToken, spreadsheetId, 'Top Minerals', 'A1', mineralRows);

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return Response.json({
      status: 'ok',
      spreadsheet_id: spreadsheetId,
      sheet_url: sheetUrl,
      cached: !force && stats.date === today,
      stats: {
        ...stats,
        top_minerals: stats.top_minerals_rows.slice(0, 5).map(([n, c]) => ({ name: n, count: Number(c) })),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function findSheet(token: string) {
  const q = encodeURIComponent(`name='${SHEET_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createSheet(token: string) {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties: { title: SHEET_NAME } }),
  });
  const data = await res.json();
  return data.spreadsheetId;
}

async function ensureTabs(token: string, spreadsheetId: string) {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meta = await metaRes.json();
  const existing = (meta.sheets || []).map((s: any) => s.properties.title);

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

async function appendRow(token: string, spreadsheetId: string, sheet: string, row: string[]) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}!A:A:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [row] }),
  });
}

async function writeRange(token: string, spreadsheetId: string, sheet: string, range: string, rows: string[][]) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheet)}!${range}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  });
}
