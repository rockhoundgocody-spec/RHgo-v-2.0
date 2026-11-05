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
  'red beryl': {
    name: 'Red beryl',
    ima_status: 'Variety of Beryl (Be₃Al₂Si₆O₁₈)',
    formula: 'Be₃Al₂Si₆O₁₈:Mn³⁺',
    crystal_system: 'Hexagonal',
    hardness: '7.5 – 8.0 Mohs',
    cleavage: 'Imperfect basal {0001}',
    luster: 'Vitreous',
    specific_gravity: '2.66 – 2.70',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Gooseberry-red hexagonal prisms hosted in topaz-bearing rhyolite vugs (Wah Wah Mountains & Thomas Range, Utah).',
    field_test: 'Scratches quartz (7.0). Look for hexagonal barrel habit inside gray miarolitic rhyolite cavities.',
  },
  'slag': {
    name: 'Industrial Slag / Cullet Glass',
    ima_status: 'Anthropogenic Smelter Byproduct (Amorphous Silicate)',
    formula: 'CaO–SiO₂–Al₂O₃–FeO (variable)',
    crystal_system: 'Amorphous (Non-crystalline)',
    hardness: '5.0 – 6.0 Mohs',
    cleavage: 'None (Sharp conchoidal glass fracture)',
    luster: 'Vitreous to sub-metallic or frothy',
    specific_gravity: '2.3 – 3.6 (varies with iron content)',
    uv_fluorescence: 'Occasionally weak green/orange from trace uranium or manganese flux',
    key_diagnostics: 'Spherical gas bubbles (vesicles), swirled flow striae, ropy puddle skin, unnatural electric blues/greens (e.g. Leland Blue).',
    field_test: 'Check with a 10x loupe for round trapped air bubbles and pitted bubble craters; softer than quartz (steel file or quartz tip scratches it).',
  },
  'obsidian': {
    name: 'Obsidian (Volcanic Glass)',
    ima_status: 'Natural Rhyolitic Glass',
    formula: 'SiO₂ (~70–75% with MgO, Fe₃O₄)',
    crystal_system: 'Amorphous (Mineraloid)',
    hardness: '5.0 – 5.5 Mohs',
    cleavage: 'None (Razor-sharp conchoidal fracture)',
    luster: 'Vitreous (jet-black to mahogany/sheen)',
    specific_gravity: '2.40',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Translucent smoky edges against sunlight, cristobalite "snowflakes" or aligned magnetite sheen; lacks the big frothy craters of foundry slag.',
    field_test: 'Hold thin edge to bright sky to check smoky translucency and confirm volcanic geology context.',
  },
  'jasper': {
    name: 'Jasper (Opaque Chalcedony)',
    ima_status: 'Variety of Microcrystalline Quartz',
    formula: 'SiO₂ with Fe₂O₃ / clay inclusions',
    crystal_system: 'Trigonal (microcrystalline)',
    hardness: '6.5 – 7.0 Mohs',
    cleavage: 'None (Smooth conchoidal fracture)',
    luster: 'Waxy to dull vitreous',
    specific_gravity: '2.58 – 2.91',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Opaque even on thin edges (unlike translucent agate), rich brick-red, mustard-yellow, or orbicular patterns.',
    field_test: 'Hold edge to flashlight: jasper blocks light while agate glows translucent along the rim.',
  },
  'labradorite': {
    name: 'Labradorite (Calcium-rich Plagioclase)',
    ima_status: 'Intermediate Plagioclase Feldspar',
    formula: '(Ca,Na)(Al,Si)₄O₈',
    crystal_system: 'Triclinic',
    hardness: '6.0 – 6.5 Mohs',
    cleavage: 'Perfect in 2 directions at ~86° with polysynthetic twinning striations',
    luster: 'Vitreous with metallic Schiller flash',
    specific_gravity: '2.68 – 2.72',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Electric blue, green, and gold labradorescence (Schiller flash) when tilted at a specific angle, fine parallel twin lines on cleavage planes.',
    field_test: 'Wet the stone and tilt slowly in direct sunlight to catch internal lamellar light interference.',
  },
  'selenite': {
    name: 'Selenite (Crystalline Gypsum)',
    ima_status: 'Variety of Gypsum',
    formula: 'CaSO₄·2H₂O',
    crystal_system: 'Monoclinic',
    hardness: '2.0 Mohs (Index mineral)',
    cleavage: 'Perfect micaceous {010} in 1 direction, distinct in 2 others',
    luster: 'Pearly to sub-vitreous or silky (satin spar)',
    specific_gravity: '2.32',
    uv_fluorescence: 'Often pale green-white or yellow with brief phosphorescence (hourglass phantoms)',
    key_diagnostics: 'Water-clear tabular blades, desert rose rosettes, or fibrous satin spar; feels warm to the touch compared to quartz.',
    field_test: 'Easily scratched with a fingernail (2.0). Never soak long in water — gypsum slowly dissolves.',
  },
  'malachite': {
    name: 'Malachite',
    ima_status: 'Approved IMA Species',
    formula: 'Cu₂(CO₃)(OH)₂',
    crystal_system: 'Monoclinic',
    hardness: '3.5 – 4.0 Mohs',
    cleavage: 'Perfect {201} (rarely seen in massive/botryoidal forms)',
    luster: 'Silky in fibrous masses, dull to velvety',
    specific_gravity: '3.6 – 4.05',
    uv_fluorescence: 'Inert',
    key_diagnostics: 'Vivid kelly-to-forest green bullseye banding, botryoidal kidney-like crusts, often paired with deep blue azurite or chrysocolla.',
    field_test: 'Produces a pale green streak and fizzes in cold dilute HCl or warm vinegar (unlike chrysocolla).',
  },
  'rhodochrosite': {
    name: 'Rhodochrosite',
    ima_status: 'Approved IMA Species',
    formula: 'MnCO₃',
    crystal_system: 'Trigonal',
    hardness: '3.5 – 4.0 Mohs',
    cleavage: 'Perfect rhombohedral {1011} in 3 directions',
    luster: 'Vitreous to pearly',
    specific_gravity: '3.70',
    uv_fluorescence: 'Occasionally dull pink-red under shortwave UV',
    key_diagnostics: 'Raspberry-red rhombohedra or bacon-striped pink stalactitic bands; much softer than rhodonite (5.5–6.5).',
    field_test: 'Scratched by a steel knife (unlike hard rhodonite) and fizzes in warm weak acid.',
  },
  'herkimer diamond': {
    name: 'Herkimer Diamond (Doubly-Terminated Quartz)',
    ima_status: 'Morphological Variety of Quartz',
    formula: 'SiO₂ (with anthraxolite & brine inclusions)',
    crystal_system: 'Trigonal',
    hardness: '7.0 – 7.5 Mohs',
    cleavage: 'None (Conchoidal)',
    luster: 'Brilliant adamantine-vitreous',
    specific_gravity: '2.65',
    uv_fluorescence: 'Hydrocarbon inclusions often glow bright yellow-white under longwave UV',
    key_diagnostics: '18-faceted doubly-terminated floater crystals hosted in Cambrian Little Falls dolostone vugs, often containing black anthraxolite or moving water bubbles (enhydros).',
    field_test: 'Look for 18 natural faces with points on both ends inside gray dolostone pockets.',
  },
  'geode': {
    name: 'Geode (Crystal-Lined Nodule)',
    ima_status: 'Geological Structure (Quartz / Chalcedony / Calcite)',
    formula: 'SiO₂ / CaCO₃',
    crystal_system: 'Trigonal (lining dependent)',
    hardness: '6.5 – 7.0 Mohs (outer chalcedony shell)',
    cleavage: 'None on outer rind',
    luster: 'Earthy cauliflower exterior; sparkling druzy interior',
    specific_gravity: '1.8 – 2.4 whole (feels anomalously light for its size)',
    uv_fluorescence: 'Calcite or opal linings often fluoresce under UV',
    key_diagnostics: 'Lumpy cauliflower-textured chalcedony rind that feels noticeably lighter than solid river cobbles of the same size.',
    field_test: 'Heft test: compare weight in hand against a solid cobble of equal size — a hollow geode feels surprisingly light.',
  },
  'thunderegg': {
    name: 'Thunderegg (Lithophysa Agate Nodule)',
    ima_status: 'Rhyolitic Lithophysa Filled with Chalcedony',
    formula: 'SiO₂ in silicified rhyolite shell',
    crystal_system: 'Trigonal (microcrystalline core)',
    hardness: '6.5 – 7.0 Mohs',
    cleavage: 'None',
    luster: 'Rough earthy rhyolite rind; waxy/vitreous star-shaped agate core',
    specific_gravity: '2.55 – 2.65 (solid and heavy)',
    uv_fluorescence: 'Core often glows pale green under shortwave UV',
    key_diagnostics: 'Warty brown/reddish perlite or rhyolite exterior with raised expansion ribs; cuts open to reveal a star-shaped agate or moss-agate center.',
    field_test: 'Unlike hollow geodes, thundereggs feel solid and heavy, with raised suture ridges on a rhyolite skin.',
  },
};

export const FIELD_SLANG_GLOSSARY = [
  { term: 'Leaverite', category: 'Field Slang', meaning: 'Playful rockhound slang for "leave \'er right there" — a common, fractured, or unremarkable rock not worth carrying back in your pack.' },
  { term: 'Slag / Cullet', category: 'Slag & Glass', meaning: 'Vitreous smelter or glassworks waste marked by spherical gas bubbles (vesicles), pitted craters, and swirled striae; often mistaken for agate, obsidian, or meteorites.' },
  { term: 'Leland Blue', category: 'Slag & Glass', meaning: 'Coveted cobalt-to-cerulean blue iron-smelting slag from historic Lake Michigan furnaces, tumbled smooth by surf and recognizable by tiny bubble pits.' },
  { term: 'Frankfort Green', category: 'Slag & Glass', meaning: 'Olive-to-emerald green vitreous blast-furnace slag found along northern Michigan beaches, colored by ferrous iron silicate.' },
  { term: 'Meteor-wrong', category: 'Slag & Glass', meaning: 'Any terrestrial rock, foundry slag, magnetite cobble, or hematite nodule mistaken for a true meteorite; vesicles or a red/brown streak rule out a meteorite immediately.' },
  { term: 'Vug / Pocket', category: 'Formations', meaning: 'An open cavity inside bedrock or vein matrix where mineral-rich fluids allow well-formed euhedral crystals to grow unobstructed.' },
  { term: 'Miarolitic Cavity', category: 'Formations', meaning: 'An irregular gas-bubble pocket in granite, pegmatite, or rhyolite lined with crystals sharing the host rock minerals (classic home of Red beryl and topaz).' },
  { term: 'Float', category: 'Prospecting', meaning: 'Loose mineral or vein fragments eroded and washed downslope from their bedrock source — hounds trace float uphill until it stops to locate the mother lode.' },
  { term: 'Floater', category: 'Crystal Habit', meaning: 'A complete crystal or cluster that grew suspended in pocket mud or solution with no broken attachment point, terminated all the way around.' },
  { term: 'Druzy / Druse', category: 'Crystal Habit', meaning: 'A glittering blanket of tiny, tightly packed quartz, calcite, or garnet micro-crystals coating a rock surface or vug wall.' },
  { term: 'Botryoidal', category: 'Crystal Habit', meaning: 'A globular, grape-bunch mineral habit with smooth rounded domes — classic in malachite, hematite, chalcedony, and smithsonite.' },
  { term: 'Enhydro', category: 'Inclusions', meaning: 'A quartz crystal, agate nodule, or halite crystal containing a trapped pocket of ancient water (often with a moving gas bubble inside).' },
  { term: 'Pseudomorph', category: 'Mineralogy', meaning: 'A "false form" where one mineral chemically replaces another while keeping the original mineral\'s exact crystal shape (like limonite after pyrite cubes).' },
  { term: 'Epimorph', category: 'Mineralogy', meaning: 'A hollow mineral cast formed when a crust (such as druzy quartz) coats an earlier crystal (like calcite or anhydrite) that later dissolves away.' },
  { term: 'Scepter Crystal', category: 'Crystal Habit', meaning: 'A second-generation crystal overgrowth that caps the tip of a thinner prism stem like a royal scepter, common in amethyst and smoky quartz.' },
  { term: 'Phantom Crystal', category: 'Crystal Habit', meaning: 'A visible ghost outline inside a transparent crystal formed when dust, chlorite, or hematite dusted an earlier growth stage before the crystal kept growing.' },
  { term: 'Hopper Crystal', category: 'Crystal Habit', meaning: 'A crystal whose edges grew faster than its face centers, leaving stepped, sunken pyramid cavities (seen in halite, bismuth, and skeletal quartz).' },
  { term: 'Chatoyancy', category: 'Optical', meaning: 'The silky "cat\'s-eye" band of reflected light that glides across fibrous minerals like tiger\'s eye, satin spar gypsum, or chrysoberyl.' },
  { term: 'Labradorescence', category: 'Optical', meaning: 'Vivid metallic flashes of blue, green, and gold caused by light interfering across microscopic twin lamellae inside labradorite feldspar.' },
  { term: 'Asterism', category: 'Optical', meaning: 'A 4- or 6-rayed star effect seen on cabochons when light reflects off oriented rutile needles inside star sapphire, ruby, or rose quartz.' },
  { term: 'Conchoidal Fracture', category: 'Diagnostics', meaning: 'Curved, shell-like ripples on broken surfaces of minerals lacking cleavage — diagnostic for quartz, agate, obsidian, and man-made slag glass.' },
  { term: 'Peeler', category: 'Agates', meaning: 'A Lake Superior agate whose weathered white-or-iron bands separate cleanly like onion layers along concentric fortification lines.' },
  { term: 'Fortification Banding', category: 'Agates', meaning: 'Sharp, angular concentric bands in agate that resemble the bastion walls of a medieval fortress, formed by rhythmic silica gel crystallization.' },
  { term: 'Waterline Agate', category: 'Agates', meaning: 'Parallel, dead-flat gravity-settled chalcedony bands formed at the bottom of a cavity, recording the ancient horizontal level of the pocket.' },
  { term: 'Sagenite', category: 'Agates', meaning: 'Agate containing radiating sprays of acicular needle crystals (or tube casts after aragonite, goethite, or rutile).' },
  { term: 'Dendritic', category: 'Inclusions', meaning: 'Branching fern- or tree-like manganese/iron oxide patterns inside moss agate, opal, or sandstone bedding planes — often mistaken for plant fossils.' },
  { term: 'Pegmatite', category: 'Formations', meaning: 'An ultra-coarse igneous dike where water- and volatile-rich magma cools last, growing giant crystals of quartz, feldspar, mica, tourmaline, and beryl.' },
  { term: 'Gossan', category: 'Prospecting', meaning: 'A rusty, leached "iron hat" of limonite and goethite capping a weathered sulfide ore zone — a premier field indicator for buried mineralization.' },
  { term: 'Tailings / Mine Dump', category: 'Prospecting', meaning: 'Piles of country rock and gangue discarded outside historic mine adits or shafts where rockhounds surface-pick overlooked specimens.' },
  { term: 'Cabochon / Cabbing', category: 'Lapidary', meaning: 'Shaping and polishing a stone with a smooth domed top and flat back on diamond wheels instead of faceting it.' },
  { term: 'High-Grader', category: 'Field Slang', meaning: 'Originally a miner who snuck rich ore home in a lunchpail; today, a hound who cherry-picks only top museum-grade specimens.' },
  { term: 'Skunked', category: 'Field Slang', meaning: 'Walking out of a hunt empty-handed with nothing but boots full of gravel — happens to every hound before a big pocket.' },
];

/**
 * Looks up a rockhounding glossary term if mentioned in a message.
 */
export function lookupTermIntelligence(query) {
  if (!query || typeof query !== 'string') return null;
  const q = query.trim().toLowerCase();
  for (const item of FIELD_SLANG_GLOSSARY) {
    const tokens = item.term.toLowerCase().split(/\s*\/\s*/);
    for (const token of tokens) {
      if (token.length >= 3 && q.includes(token)) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Generates a deterministic daily 3-question terminology quiz (plus bonus rounds)
 * from FIELD_SLANG_GLOSSARY so users and Clover sharpen rockhounding lingo daily.
 */
export function getDailyTerminologyQuiz(dateKey = '', roundOffset = 0) {
  const seedStr = `${dateKey || new Date().toISOString().slice(0, 10)}#${roundOffset}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const total = FIELD_SLANG_GLOSSARY.length;
  const startIdx = Math.abs(hash) % total;

  const questions = [];
  for (let qIdx = 0; qIdx < 3; qIdx++) {
    const targetIdx = (startIdx + qIdx * 7) % total;
    const target = FIELD_SLANG_GLOSSARY[targetIdx];
    const distractor1 = FIELD_SLANG_GLOSSARY[(targetIdx + 5 + qIdx * 3) % total];
    const distractor2 = FIELD_SLANG_GLOSSARY[(targetIdx + 13 + qIdx * 5) % total];

    const rawOptions = [
      { term: target.term, isCorrect: true },
      { term: distractor1.term, isCorrect: false },
      { term: distractor2.term, isCorrect: false },
    ];
    // Deterministic shuffle per question
    const shift = Math.abs(hash + qIdx * 31) % 3;
    const options = [
      rawOptions[shift % 3],
      rawOptions[(shift + 1) % 3],
      rawOptions[(shift + 2) % 3],
    ];

    questions.push({
      id: `${seedStr}_q${qIdx}`,
      term: target.term,
      category: target.category,
      prompt: target.meaning,
      options,
      voiceLine: `${target.term}! ${target.meaning}`,
    });
  }
  return questions;
}

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
  if (q.includes('slag') || q.includes('cullet') || q.includes('leland blue') || q.includes('frankfort green') || q.includes('smelter') || q.includes('vesicle') || q.includes('meteor-wrong')) {
    return MINERAL_REGISTRY['slag'];
  }
  if (q.includes('red beryl') || q.includes('wah wah')) {
    return MINERAL_REGISTRY['red beryl'];
  }
  if (q.includes('obsidian') || q.includes('volcanic glass')) {
    return MINERAL_REGISTRY['obsidian'];
  }
  if (q.includes('herkimer') || q.includes('enhydro')) {
    return MINERAL_REGISTRY['herkimer diamond'];
  }
  if (q.includes('thunderegg') || q.includes('lithophysa')) {
    return MINERAL_REGISTRY['thunderegg'];
  }
  if (q.includes('geode') || q.includes('nodule')) {
    return MINERAL_REGISTRY['geode'];
  }
  if (q.includes('selenite') || q.includes('gypsum') || q.includes('satin spar')) {
    return MINERAL_REGISTRY['selenite'];
  }
  if (q.includes('malachite') || q.includes('azurite')) {
    return MINERAL_REGISTRY['malachite'];
  }
  if (q.includes('labradorite') || q.includes('labradorescence') || q.includes('schiller')) {
    return MINERAL_REGISTRY['labradorite'];
  }
  if (q.includes('rhodochrosite')) {
    return MINERAL_REGISTRY['rhodochrosite'];
  }
  if (q.includes('jasper')) {
    return MINERAL_REGISTRY['jasper'];
  }
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