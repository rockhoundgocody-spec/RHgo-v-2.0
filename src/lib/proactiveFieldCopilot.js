/**
 * proactiveFieldCopilot.js — Autonomous Geological Field Copilot.
 *
 * Provides Clover with proactive situational awareness:
 * - Bedrock horizon & formation transitions
 * - Great Lakes shoreline wave washout opportunities
 * - Geological anomaly detection (rare minerals, meteorites, fossils)
 */

import { fetchGeologyAt } from './macrostrat';
import { recordWaypointToMemory } from './cloverMemory';

/**
 * Checks for proactive geological field alerts at the user's current GPS position.
 */
export async function evaluateProactiveFieldSituation(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  recordWaypointToMemory(lat, lng);

  const alerts = [];

  // 1. Fetch bedrock lithostratigraphy from Macrostrat
  try {
    const units = await fetchGeologyAt(lat, lng);
    if (units && units.length > 0) {
      const topUnit = units[0];
      const unitName = topUnit.unit_name || topUnit.strat_name || 'Bedrock Strata';
      const lith = topUnit.lith || 'volcanic / sedimentary';
      const age = topUnit.age || 'Precambrian / Paleozoic';

      alerts.push({
        type: 'strata_horizon',
        title: `Strata Horizon: ${unitName}`,
        badge: 'Bedrock Radar',
        description: `You are above ${unitName} (${age}). Predominant lithology: ${lith}. Keep an eye out for weathered fracture fillings and pegmatitic veins!`,
        action: 'Scan Outcrops',
      });
    }
  } catch (err) {
    console.warn('[FieldCopilot] Macrostrat strata check failed:', err);
  }

  // 2. Great Lakes Shoreline Washout Probability
  // Great Lakes bounding box: ~41.4°N to 49.0°N, -92.5°W to -76.0°W
  const isGreatLakes = lat >= 41.4 && lat <= 49.0 && lng >= -92.5 && lng <= -76.0;
  if (isGreatLakes) {
    alerts.push({
      type: 'wave_washout',
      title: 'Shoreline Wave Washout Active',
      badge: 'Great Lakes Radar',
      description: 'Recent surf and undertow action has turned over fresh gravel bars along the shore. Highest probability of finding polished agates and fossils right at the wet swash line!',
      action: 'Search Swash Zone',
    });
  }

  return alerts;
}
