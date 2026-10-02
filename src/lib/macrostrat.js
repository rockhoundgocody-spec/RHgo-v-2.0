/**
 * Macrostrat API helpers — bedrock geology lookup (https://macrostrat.org/api/v2)
 * Free, open, CC-BY 4.0. No API key required.
 */

/** Fetch geologic map units at a point. Returns array of units (may be empty). */
export async function fetchGeologyAt(lat, lng) {
  // Sanitize coordinates to prevent parameter injection and out-of-bounds requests
  if (
    lat === null ||
    lat === undefined ||
    lng === null ||
    lng === undefined ||
    typeof lat === 'boolean' ||
    typeof lng === 'boolean' ||
    typeof lat === 'symbol' ||
    typeof lng === 'symbol'
  ) {
    return [];
  }
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (
    !Number.isFinite(numLat) ||
    !Number.isFinite(numLng) ||
    numLat < -90 ||
    numLat > 90 ||
    numLng < -180 ||
    numLng > 180
  ) {
    return [];
  }

  // Bounded: this sits on the critical path of every scan — a hung upstream
  // request must not stall identification.
  let res;
  try {
    res = await fetch(
      `https://macrostrat.org/api/v2/geologic_units/map?lat=${numLat}&lng=${numLng}`,
      { signal: AbortSignal.timeout(5000) }
    );
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const json = await res.json();
  return json?.success?.data || [];
}

/** Build an LLM prompt fragment from Macrostrat units. Returns '' when nothing useful. */
export function formatGeologyContext(units) {
  if (!units?.length) return '';
  const lines = units.slice(0, 3).map((u) => {
    const parts = [
      u.name || u.strat_name,
      u.age ? `age: ${u.age}` : null,
      u.lith ? `lithology: ${u.lith}` : null,
      u.descrip ? `description: ${u.descrip.slice(0, 200)}` : null,
    ].filter(Boolean);
    return '- ' + parts.join(' | ');
  });
  return (
    ' LOCAL GEOLOGY CONTEXT (bedrock map units at the find location, from Macrostrat): ' +
    lines.join(' ') +
    ' Weight candidates that are geologically plausible for this bedrock higher, and mention the local geology in your reasoning when relevant.'
  );
}