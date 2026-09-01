/**
 * mindatApi.js — Open mineralogical intelligence & IMA scientific properties.
 * Provides instant lookups for crystal systems, hardness, cleavage, UV fluorescence,
 * chemical formulas, and field test diagnostics.
 */

export const MINERAL_REGISTRY = {
  'agate': {
    name: 'Agate (Banded Chalcedony)',
    ima_status: 'Variety of Quartz (SiO₂)',
    formula: 'SiO₂',
    crystal_system: 'Trigonal (microcrystalline)',
    hardness: '6.5 – 7.0 Mohs',
    cleavage: 'None (Conchoidal fracture)',
    luster: 'Waxy to vitreous',
    specific_gravity: '2.58 – 2.64',
    uv_fluorescence: 'Variable (inert to pale yellow/green under shortwave UV)',
    key_diagnostics: 'Fortification banding, chalcedonic translucency, wax luster on weathered cobbles, scratches glass easily.',
    field_test: 'Cannot be scratched by hardened steel knife (6.5). Conchoidal shell-like fracture surfaces.',
  },
  'lake superior agate': {
    name: 'Lake Superior Agate',
    ima_status: 'Variety of Chalcedony',
    formula: 'SiO₂ (with Fe-rich banding)',
    crystal_system: 'Trigonal / Cryptocrystalline',
    hardness: '7.0 Mohs',
    cleavage: 'None (Conchoidal)',
    luster: 'Vitreous to waxy',
    specific_gravity: '2.60',
    uv_fluorescence: 'Occasionally green under shortwave (trace uranyl activation)',
    key_diagnostics: 'Peeling rinds, rich iron-red, orange, and carnelian banding, eyes, quartz crystal centers.',
    field_test: 'Check weathered husk for circular "eyes" and banded peelers along beach gravel wash lines.',
  },
  'yooperlite': {
    name: 'Yooperlite (Sodalite-bearing Syenite)',
    ima_status: 'Rock (Syenite clast with Fluorescent Sodalite)',
    formula: 'Na₈(Al₆Si₆O₂₄)Cl₂ in feldspar matrix',
    crystal_system: 'Isometric (Sodalite)',
    hardness: '5.5 – 6.0 Mohs',
    cleavage: 'Poor/variable',
    luster: 'Dull earthy to vitreous when wet',
    specific_gravity: '2.6',
    uv_fluorescence: 'Vibrant fiery orange-yellow under 365nm Longwave UV',
    key_diagnostics: 'Looks like nondescript gray beach cobble in daylight; blazes intense molten lava orange under filtered 365nm UV.',
    field_test: 'Shine a 365nm filtered UV torch along dark Great Lakes wave lines at night.',
  },
  'petoskey stone': {
    name: 'Petoskey Stone (Hexagonaria percarinata)',
    ima_status: 'Fossilized Colonial Rugose Coral (Calcite/Aragonite)',
    formula: 'CaCO₃',
    crystal_system: 'Trigonal / Rhombohedral',
    hardness: '3.0 Mohs',
    cleavage: 'Rhombohedral (calcite matrix)',
    luster: 'Dull when dry, silky vitreous when wet or polished',
    specific_gravity: '2.71',
    uv_fluorescence: 'Weak yellow-white under longwave UV',
    key_diagnostics: 'Distinct six-sided honeycomb corallite patterns with dark central eyes.',
    field_test: 'Fizzes vigorously with mild acid (dilute HCl or vinegar). Wet with water to reveal pattern on dry beaches.',
  },
  'calcite': {
    name: 'Calcite',
    ima_status: 'Approved IMA Species',
    formula: 'CaCO₃',
    crystal_system: 'Trigonal',
    hardness: '3.0 Mohs (Index mineral)',
    cleavage: 'Perfect rhombohedral {1011} in 3 directions',
    luster: 'Vitreous to pearly on cleavage faces',
    specific_gravity: '2.71',
    uv_fluorescence: 'Frequently red, pink, or orange under UV (Mn activation)',
    key_diagnostics: '3 directions of oblique cleavage (rhomb forms), double refraction in clear Iceland spar, violent effervescence in acid.',
    field_test: 'Easily scratched by a copper penny (3.5). Fizzes immediately in cold vinegar.',
  },
  'fluorite': {
    name: 'Fluorite',
    ima_status: 'Approved IMA Species',
    formula: 'CaF₂',
    crystal_system: 'Isometric (Cubic)',
    hardness: '4.0 Mohs (Index mineral)',
    cleavage: 'Perfect octahedral {111} in 4 directions',
    luster: 'Vitreous',
    specific_gravity: '3.18',
    uv_fluorescence: 'Intense violet-blue under 365nm UV (type mineral for "fluorescence")',
    key_diagnostics: 'Cubic crystals, octahedral cleavage fragments, broad color spectrum (purple, green, yellow, blue).',
    field_test: 'Can be scratched by a steel nail (5.0), but scratches calcite (3.0). Glows blue under blacklight.',
  },
  'amethyst': {
    name: 'Amethyst (Ferric Quartz)',
    ima_status: 'Variety of Quartz',
    formula: 'SiO₂:Fe³⁺',
    crystal_system: 'Trigonal (trapezohedral)',
    hardness: '7.0 Mohs',
    cleavage: 'None',
    luster: 'Vitreous',
    specific_gravity: '2.65',
    uv_fluorescence: 'Usually inert',
    key_diagnostics: 'Purple/violet color zoning, six-sided prism capped with rhombohedra, conchoidal fracture.',
    field_test: 'Scratches glass (5.5) and pocketknife blades (6.0). Does not react to acid.',
  },
  'pyrite': {
    name: 'Pyrite ("Fool\'s Gold")',
    ima_status: 'Approved IMA Species',
    formula: 'FeS₂',
    crystal_system: 'Isometric (Diploidal)',
    hardness: '6.0 – 6.5 Mohs',
    cleavage: 'Indistinct {001}',
    luster: 'Brilliant metallic',
    specific_gravity: '5.01',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Pale brass-yellow color, greenish-black streak, striations on cube or pyritohedron faces.',
    field_test: 'Streak test produces a dark greenish-black powder. Brittle (shatters when struck, unlike malleable gold).',
  },
};

/**
 * Searches the mineral registry for matches against names or query strings.
 */
export function lookupMineralIntelligence(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();

  // Exact match
  if (MINERAL_REGISTRY[q]) return MINERAL_REGISTRY[q];

  // Substring match
  const keys = Object.keys(MINERAL_REGISTRY);
  for (const key of keys) {
    if (q.includes(key) || key.includes(q)) {
      return MINERAL_REGISTRY[key];
    }
  }

  // Common keywords fallback
  if (q.includes('quartz') || q.includes('flint') || q.includes('chert')) {
    return MINERAL_REGISTRY['agate'];
  }
  if (q.includes('coral') || q.includes('fossil')) {
    return MINERAL_REGISTRY['petoskey stone'];
  }
  if (q.includes('glow') || q.includes('uv') || q.includes('blacklight')) {
    return MINERAL_REGISTRY['yooperlite'];
  }

  return null;
}
