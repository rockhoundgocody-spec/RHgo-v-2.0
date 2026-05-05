import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Map Open-Meteo WMO weather code → human label
function weatherLabel(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Heavy freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Heavy rain showers', 82: 'Violent rain showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm',
  };
  return map[code] || 'Unknown';
}

// Lunar phase calculation (Conway approximation, accurate within a day)
function lunarPhase(date) {
  const d = new Date(date);
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  if (m < 3) { y -= 1; m += 12; }
  const c = 365.25 * y;
  const e = 30.6 * (m + 1);
  const jd = c + e + day - 694039.09;
  const phase = (jd / 29.5305882) % 1;       // 0..1 across synodic cycle
  const illumination = (1 - Math.cos(phase * 2 * Math.PI)) / 2; // 0..1

  const names = [
    [0.0625, 'New Moon'],
    [0.1875, 'Waxing Crescent'],
    [0.3125, 'First Quarter'],
    [0.4375, 'Waxing Gibbous'],
    [0.5625, 'Full Moon'],
    [0.6875, 'Waning Gibbous'],
    [0.8125, 'Last Quarter'],
    [0.9375, 'Waning Crescent'],
  ];
  let phase_name = 'New Moon';
  for (const [t, n] of names) { if (phase < t) { phase_name = n; break; } }

  return {
    phase_name,
    illumination: Math.round(illumination * 1000) / 1000,
    phase_value: Math.round(phase * 1000) / 1000,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate caller — entity automations invoke as the triggering user.
    // This blocks anonymous/unauthenticated webhook calls from external sources.
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body || {};
    if (!event || event.type !== 'create' || event.entity_name !== 'Specimen') {
      return Response.json({ skipped: true, reason: 'not a Specimen create event' });
    }

    let specimen = data;
    if (!specimen) {
      specimen = await base44.asServiceRole.entities.Specimen.get(event.entity_id);
    }

    const updates = {};

    // 1) Lunar phase — uses found_date or now
    const dateStr = specimen.found_date || specimen.created_date || new Date().toISOString();
    updates.lunar_phase = lunarPhase(dateStr);

    // 2) Weather — only if we have coordinates
    if (typeof specimen.lat === 'number' && typeof specimen.lng === 'number') {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${specimen.lat}&longitude=${specimen.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph`;
      const wRes = await fetch(url);
      if (wRes.ok) {
        const wJson = await wRes.json();
        const c = wJson.current || {};
        updates.weather = {
          temperature_f: c.temperature_2m,
          condition: weatherLabel(c.weather_code),
          humidity: c.relative_humidity_2m,
          wind_mph: c.wind_speed_10m,
          fetched_at: c.time || new Date().toISOString(),
        };
      }
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ updated: false });
    }

    await base44.asServiceRole.entities.Specimen.update(event.entity_id, updates);
    return Response.json({ updated: true, updates });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});