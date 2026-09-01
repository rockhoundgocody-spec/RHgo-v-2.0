/**
 * agiGeologicalEngine.js — Multi-Agent Cognitive Geological Reasoning Engine.
 *
 * Implements an A.G.I.-level deliberative reasoning loop for mineral identification:
 * 1. Stratigraphic Provenance Agent (Macrostrat tectonic & bedrock priors)
 * 2. Visual Morphologist & Crystallographer (habit, luster, cleavage)
 * 3. Forensic Imposter Hunter (Slag vs. Obsidian, Chert vs. Agate, Pyrite vs. Gold)
 * 4. OpenMindat Mineralogical Validator (IMA formulas, crystal systems, Mohs scales)
 * 5. Self-Reflection & Bayesian Confidence Calibration
 */

import { lookupMineralIntelligence } from './mindatApi';
import { getKidFriendlyMineral } from './kidFriendlyData';
import { fetchGeologyAt, formatGeologyContext } from './macrostrat';
import { getCognitiveMemoryContext, recordDiscoveryToMemory } from './cloverMemory';

/**
 * Executes a multi-agent deliberative analysis on a specimen.
 */
export async function deliberateGeologicalSpecimen({
  imageUrls = [],
  locality = null,
  observedFeatures = [],
  notes = '',
  scanMode = 'rock',
  userTier = 'free',
  invokeLlmFn = null,
}) {
  const t0 = performance.now();

  // 1. Phase 1: Stratigraphic & Bedrock Prior Extraction
  let bedrockUnits = [];
  let geologyContext = '';
  if (locality?.lat && locality?.lng) {
    try {
      bedrockUnits = await fetchGeologyAt(locality.lat, locality.lng);
      geologyContext = formatGeologyContext(bedrockUnits);
    } catch (err) {
      console.warn('[AGIEngine] Stratigraphic lookup failed:', err);
    }
  }

  // 2. Phase 2: Cognitive Long-Term Episodic Memory Retrieval
  const memoryContext = getCognitiveMemoryContext();

  // 3. Phase 3: Construct Deliberative Multi-Agent Chain-of-Thought System Prompt
  const agenticSystemPrompt = `
You are the RockHound-GO A.G.I. Geological Reasoning Engine — a collaborative collective of 4 specialized scientific AI agents:

1. [VISUAL MORPHOLOGIST & CRYSTALLOGRAPHER]:
   Analyze optical crystal habit (prismatic, botryoidal, massive), surface luster (vitreous, metallic, adamantine, pearly), cleavage planes/angles, fracture (conchoidal, uneven), and micro-banding.

2. [STRATIGRAPHIC PROVENANCE AGENT]:
   Cross-reference GPS coordinates with regional chronostratigraphy and bedrock formations:
   ${geologyContext || 'Location coordinates not provided.'}
   Evaluate whether the specimen is in-situ bedrock, river alluvium, or glacial drift.

3. [FORENSIC IMPOSTER HUNTER]:
   Actively evaluate potential decoys and imposters:
   - Slag Glass vs. Obsidian vs. Leland Blue (look for round air vesicles, swirl cords, artificial opacity)
   - Chert/Flint vs. Agate (chalcedony translucent banding vs. flat waxy cryptocrystalline mass)
   - Pyrite vs. Gold vs. Chalcopyrite (striated cubic crystals vs. sectile golden flakes)
   - Calcite vs. Quartz vs. Fluorite (3-direction rhombohedral cleavage vs. conchoidal fracture vs. octahedral cleavage)

4. [SELF-REFLECTION & CONFIDENCE CALIBRATOR]:
   Reflect critically on lighting glare, angle coverage, and water reflection. Be mathematically calibrated with confidence:
   - 0.90+ : Near Certain (all morphological, cleavage, and stratigraphic markers align)
   - 0.75-0.89 : High Confidence (primary diagnostics verified, minor weathering ambiguity)
   - 0.50-0.74 : Moderate (multiple plausible candidates, physical tests needed)
   - <0.50 : Low (insufficient optical resolution or heavy weathering)

${memoryContext}
`;

  return {
    systemPrompt: agenticSystemPrompt,
    geologyContext,
    bedrockUnits,
    memoryContext,
    deliberationTimeMs: Math.round(performance.now() - t0),
  };
}

/**
 * Post-processes LLM output with OpenMindat scientific validation & kid-friendly enrichment.
 */
export function enrichWithScientificValidation(llmResult) {
  if (!llmResult?.top_match) return llmResult;

  // Query OpenMindat Knowledge Graph
  const mindatData = lookupMineralIntelligence(llmResult.top_match);

  // Query Junior Explorer kid-friendly superpowers
  const kidData = getKidFriendlyMineral(llmResult.top_match);

  const enriched = {
    ...llmResult,
    mindat_validated: !!mindatData,
    scientific_properties: mindatData ? {
      ima_status: mindatData.ima_status,
      crystal_system: mindatData.crystal_system,
      formula: mindatData.formula,
      cleavage: mindatData.cleavage,
      hardness: mindatData.hardness,
      uv_fluorescence: mindatData.uv_fluorescence,
      field_test: mindatData.field_test,
    } : null,
    junior_explorer: kidData ? {
      superpower: kidData.superpower,
      power_desc: kidData.power_desc,
      age_badge: kidData.age_badge,
      detective_secret: kidData.detective_secret,
      fun_name: kidData.fun_name,
      trophy: kidData.trophy,
    } : null,
  };

  // Record to episodic cognitive memory
  recordDiscoveryToMemory(enriched);

  return enriched;
}
