import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ─────────────────────────────────────────────────────────────────────────────
// Temporal-Depletion Engine — resolveDepletion
//
// Given a mineral name + coordinates, resolves the current field rarity weight
// for that mineral in its specific geologic unit (Macrostrat bedrock map unit).
//
// Two modes:
//   1. Read (apply=false): Returns current rarity weight after temporal recovery.
//      Used by the frontend to display "Field Rarity" during scan results.
//   2. Apply (apply=true): Also decrements the record (depletion) — called when
//      a specimen is saved. The entity automation on Specimen-create calls this
//      with the automation payload, which is auto-detected.
//
// Rarity decay model:
//   - Each discovery in the same geologic unit reduces current_rarity_weight
//     by depletion_factor × base_rarity_weight (default 5% of base per find).
//   - Each day since last discovery, current_rarity_weight recovers by
//     recovery_rate_per_day × base_rarity_weight (default 1% of base per day),
//     capped at base_rarity_weight. This models natural weathering re-exposing
//     material over time.
//   - Entropy contribution accumulates and feeds the Global Entropy Counter.
// ─────────────────────────────────────────────────────────────────────────────

const RARITY_BASE_WEIGHTS: Record<string, number> = {
  common: 1.0,
  uncommon: 2.5,
  rare: 5.0,
  legendary: 10.0,
};

function weightToRarity(weight: number): string {
  if (weight >= 7.0) return 'legendary';
  if (weight >= 3.5) return 'rare';
  if (weight >= 1.5) return 'uncommon';
  return 'common';
}

function getBaseWeight(hintRarity?: string): number {
  if (hintRarity && RARITY_BASE_WEIGHTS[hintRarity]) return RARITY_BASE_WEIGHTS[hintRarity];
  return RARITY_BASE_WEIGHTS.common;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: require admin for write operations (apply:true), allow any
    // authenticated user for read-only queries. Entity-automation calls from
    // the workflow system resolve to an admin-level caller via auth.me().
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Detect automation payload ({ event, data }) vs direct call ({ mineral_name, lat, lng })
    const isAutomation = !!body.event;
    const mineralName: string | undefined = isAutomation
      ? body.data?.mineral_name
      : body.mineral_name;
    const lat: number | undefined = isAutomation ? body.data?.lat : body.lat;
    const lng: number | undefined = isAutomation ? body.data?.lng : body.lng;
    const apply: boolean = isAutomation ? true : body.apply === true;
    const hintRarity: string | undefined = body.rarity || body.data?.rarity;

    // Write operations (depletion) require admin — stops anonymous rarity manipulation
    if (apply && caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required to modify depletion records' }, { status: 403 });
    }

    if (!mineralName || lat == null || lng == null) {
      return Response.json({
        error: 'mineral_name, lat, lng required',
        received: { mineralName, lat, lng },
      }, { status: 400 });
    }

    // 1. Fetch geologic unit from Macrostrat
    let geologicUnit = 'Unknown';
    let geologicUnitId: string | null = null;
    let state = 'Unknown';
    try {
      const geoRes = await fetch(
        `https://macrostrat.org/api/v2/geologic_units/map?lat=${lat}&lng=${lng}&format=json`
      );
      if (geoRes.ok) {
        const geoJson = await geoRes.json();
        const unit = geoJson?.success?.data?.[0];
        if (unit) {
          geologicUnit = unit.name || unit.strat_name || 'Unknown';
          geologicUnitId = unit.unit_id ? String(unit.unit_id) : null;
        }
      }
    } catch {
      // Macrostrat unavailable — proceed with 'Unknown'
    }

    // 2. Find or create the depletion record
    const records = await base44.asServiceRole.entities.GeoDepletionRecord.filter({
      mineral_name: mineralName,
      geologic_unit: geologicUnit,
    });

    let record = records[0];
    const baseWeight = getBaseWeight(hintRarity);

    if (!record) {
      record = await base44.asServiceRole.entities.GeoDepletionRecord.create({
        mineral_name: mineralName,
        geologic_unit: geologicUnit,
        geologic_unit_id: geologicUnitId,
        state,
        base_rarity_weight: baseWeight,
        current_rarity_weight: baseWeight,
        discovery_count: 0,
        last_discovery_date: null,
        depletion_factor: 0.05,
        recovery_rate_per_day: 0.01,
        entropy_contribution: 0,
      });
    }

    // 3. Apply temporal recovery (lazy evaluation — recover based on days since last discovery)
    let currentWeight = record.current_rarity_weight;
    const today = new Date().toISOString().split('T')[0];

    if (record.last_discovery_date) {
      const lastDate = new Date(record.last_discovery_date);
      const daysSince = Math.max(0, Math.floor((Date.now() - lastDate.getTime()) / 86400000));
      const recovery = daysSince * (record.recovery_rate_per_day || 0.01) * record.base_rarity_weight;
      currentWeight = Math.min(record.base_rarity_weight, currentWeight + recovery);
    }

    // 4. Apply depletion if this is a save event
    let discoveryCount = record.discovery_count;
    let lastDiscoveryDate = record.last_discovery_date;
    let entropyContribution = record.entropy_contribution || 0;

    if (apply) {
      const depletionAmount = (record.depletion_factor || 0.05) * record.base_rarity_weight;
      currentWeight = Math.max(0.1, currentWeight - depletionAmount);
      discoveryCount += 1;
      lastDiscoveryDate = today;
      entropyContribution += depletionAmount;

      await base44.asServiceRole.entities.GeoDepletionRecord.update(record.id, {
        current_rarity_weight: currentWeight,
        discovery_count: discoveryCount,
        last_discovery_date: lastDiscoveryDate,
        entropy_contribution: entropyContribution,
      });
    } else if (Math.abs(currentWeight - record.current_rarity_weight) > 0.001) {
      // Read-only call: persist the recovered weight (lazy evaluation)
      await base44.asServiceRole.entities.GeoDepletionRecord.update(record.id, {
        current_rarity_weight: currentWeight,
      });
    }

    // 5. Return the depletion state
    const depletionPercentage = Math.max(0, 1 - (currentWeight / record.base_rarity_weight));
    const adjustedRarity = weightToRarity(currentWeight);

    return Response.json({
      mineral_name: mineralName,
      geologic_unit: geologicUnit,
      state,
      base_rarity_weight: record.base_rarity_weight,
      current_rarity_weight: Math.round(currentWeight * 100) / 100,
      discovery_count: discoveryCount,
      last_discovery_date: lastDiscoveryDate,
      depletion_percentage: Math.round(depletionPercentage * 100) / 100,
      adjusted_rarity: adjustedRarity,
      entropy_contribution: Math.round(entropyContribution * 100) / 100,
      applied: apply,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});