import { assertEquals, assertAlmostEquals } from 'jsr:@std/assert@1';

// Haversine distance in miles (original implementation)
function originalDistanceMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Optimized distance calculation
const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_MI = 3959;

function fastDistanceMi(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  lat1Rad = lat1 * DEG_TO_RAD,
  cosLat1 = Math.cos(lat1Rad)
) {
  const lat2Rad = lat2 * DEG_TO_RAD;
  const dLat = lat2Rad - lat1Rad;
  const dLng = (lng2 - lng1) * DEG_TO_RAD;
  const cosLat2 = Math.cos(lat2Rad);
  const sinHalfDLat = Math.sin(dLat * 0.5);
  const sinHalfDLng = Math.sin(dLng * 0.5);
  const a = sinHalfDLat * sinHalfDLat + cosLat1 * cosLat2 * sinHalfDLng * sinHalfDLng;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.test('distance calculation correctness', () => {
  const distOrig = originalDistanceMi(44.3148, -85.6024, 46.5436, -87.3954);
  const distFast = fastDistanceMi(44.3148, -85.6024, 46.5436, -87.3954);
  assertEquals(Math.round(distOrig), 178);
  assertAlmostEquals(distFast, distOrig, 1e-5);
  assertEquals(Math.round(distFast), Math.round(distOrig));
});

Deno.test('benchmark distance processing and sorting over hotspots', () => {
  // Generate 1000 synthetic hotspots
  const hotspots = Array.from({ length: 1000 }, (_, i) => ({
    name: `Hotspot ${i}`,
    state: 'MI',
    lat: 42.0 + (i % 100) * 0.05 + (i * 0.001),
    lng: -85.0 - (i % 80) * 0.05 - (i * 0.001),
    minerals: ['Agate', 'Quartz', 'Copper'],
    difficulty: 'moderate',
    trust_score: 90,
    land_type: 'public',
  }));

  const userLat = 44.3148;
  const userLng = -85.6024;

  const iterations = 500;

  // Measure original
  const startOrig = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const scoredOrig = hotspots.map(h => ({
      name: h.name,
      state: h.state,
      lat: h.lat,
      lng: h.lng,
      minerals: h.minerals || [],
      difficulty: h.difficulty,
      trust_score: h.trust_score,
      land_type: h.land_type,
      distanceMi: (userLat != null && h.lat != null) ? Math.round(originalDistanceMi(userLat, userLng, h.lat, h.lng)) : null,
    }));
    if (userLat != null) {
      scoredOrig.sort((a, b) => (a.distanceMi ?? 9999) - (b.distanceMi ?? 9999));
    }
    const _nearbyOrig = scoredOrig.slice(0, 8);
  }
  const endOrig = performance.now();
  const durOrig = endOrig - startOrig;

  // Measure optimized
  const startOpt = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    let scoredOpt;
    if (userLat != null) {
      const userLatRad = userLat * DEG_TO_RAD;
      const cosUserLat = Math.cos(userLatRad);
      scoredOpt = hotspots.map(h => {
        const hasGeo = h.lat != null && h.lng != null;
        const dist = hasGeo
          ? fastDistanceMi(userLat, userLng, h.lat, h.lng, userLatRad, cosUserLat)
          : null;
        return {
          name: h.name,
          state: h.state,
          lat: h.lat,
          lng: h.lng,
          minerals: h.minerals || [],
          difficulty: h.difficulty,
          trust_score: h.trust_score,
          land_type: h.land_type,
          distanceMi: dist != null ? Math.round(dist) : null,
        };
      });
      scoredOpt.sort((a, b) => (a.distanceMi ?? 9999) - (b.distanceMi ?? 9999));
    } else {
      scoredOpt = hotspots.map(h => ({
        name: h.name,
        state: h.state,
        lat: h.lat,
        lng: h.lng,
        minerals: h.minerals || [],
        difficulty: h.difficulty,
        trust_score: h.trust_score,
        land_type: h.land_type,
        distanceMi: null,
      }));
    }
    const _nearbyOpt = scoredOpt.slice(0, 8);
  }
  const endOpt = performance.now();
  const durOpt = endOpt - startOpt;

  console.log(`Original duration (${iterations} runs, 1000 items): ${durOrig.toFixed(2)}ms`);
  console.log(`Optimized duration (${iterations} runs, 1000 items): ${durOpt.toFixed(2)}ms`);
  console.log(`Speedup: ${(durOrig / durOpt).toFixed(2)}x`);
});
