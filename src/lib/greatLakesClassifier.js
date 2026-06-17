/**
 * Great Lakes 30-class constrained classifier.
 * Provides location priors, wet/dry context, and a ranked candidate list
 * for the region's most common collectible stones.
 *
 * Used by identifySpecimen (backend) and as the offline fallback classifier.
 */

export const GREAT_LAKES_30 = [
  { name: 'Lake Superior Agate',   wetClue: 'Waxy luster, red/orange banding visible when wet',   dryClue: 'Pitted brown husk, banding subtle',        beaches: ['Eagle River', 'Grand Marais', 'Whitefish Point', 'Two Harbors'] },
  { name: 'Petoskey Stone',        wetClue: 'Hexagonal coral pattern pops clearly when wet',       dryClue: 'Faint grey honeycomb, easy to miss dry',   beaches: ['Petoskey', 'Charlevoix', 'Traverse City', 'Sleeping Bear'] },
  { name: 'Charlevoix Stone',      wetClue: 'White with black dot pattern like a game piece',      dryClue: 'Pale with muted spots',                    beaches: ['Charlevoix', 'Petoskey'] },
  { name: 'Leland Blue',           wetClue: 'Vivid blue-green glassy slag, smooth',                dryClue: 'Frosty blue-green, dull surface',           beaches: ['Leland', 'Sleeping Bear'] },
  { name: 'Yooperlite',            wetClue: 'Fluoresces brilliant orange under UV in dark',        dryClue: 'Ordinary grey syenite, no distinctive look', beaches: ['Lake Superior UP shore', 'Brimley'] },
  { name: 'Pudding Stone',         wetClue: 'Red quartzite pebbles in white matrix, vivid wet',    dryClue: 'Distinct red-in-white still visible dry',   beaches: ['Frankenmuth area', 'Lower Michigan'] },
  { name: 'Jacobsville Sandstone', wetClue: 'Brick-red with white veins or spots',                 dryClue: 'Duller red, granular texture',              beaches: ['Houghton', 'Keweenaw', 'Marquette'] },
  { name: 'Native Copper',         wetClue: 'Metallic reddish-orange, heavy for size',             dryClue: 'Green patina crust possible, still heavy',  beaches: ['Keweenaw', 'Copper Harbor', 'Eagle River'] },
  { name: 'Prehnite',              wetClue: 'Pale green, waxy botryoidal surface',                 dryClue: 'Dull green, bubbly texture still visible',  beaches: ['Lake Superior basalt flows'] },
  { name: 'Thomsonite',            wetClue: 'Pink/white eye patterns striking when wet',           dryClue: 'Pale, fibrous radiating patterns',          beaches: ['Grand Marais', 'Thomsonite Beach'] },
  { name: 'Chlorastrolite (Greenstone)', wetClue: 'Turtleback green pattern vivid wet',           dryClue: 'Muted green mosaic, still distinctive',     beaches: ['Isle Royale', 'Keweenaw'] },
  { name: 'Epidote',               wetClue: 'Pistachio green, glassy luster',                      dryClue: 'Yellow-green, columnar crystals',           beaches: ['Lake Superior basalt zones'] },
  { name: 'Basalt (Lake Superior)',wetClue: 'Fine-grained dark grey-black, vesicles may show',    dryClue: 'Uniform dark, rounded water-worn',          beaches: ['All Lake Superior beaches'] },
  { name: 'Rhyolite',              wetClue: 'Pink/purple flow-banded, glassy',                     dryClue: 'Banding still visible, lighter color',      beaches: ['Upper Peninsula', 'Porcupine Mountains'] },
  { name: 'Granite',               wetClue: 'Speckled salt-and-pepper, biotite sparkles',         dryClue: 'Coarse grainy texture, less sparkle',       beaches: ['Lake Michigan', 'Lake Huron'] },
  { name: 'Quartzite',             wetClue: 'White to pink, vitreous luster, very hard',          dryClue: 'Sugary crystalline surface, dull',          beaches: ['Lake Superior', 'UP beaches'] },
  { name: 'Quartz (milky)',        wetClue: 'White to translucent, glassy',                        dryClue: 'Chalky white, less translucent',            beaches: ['All Great Lakes'] },
  { name: 'Quartz (clear/smoky)', wetClue: 'Clear to brown glassy crystal',                       dryClue: 'Vitreous even dry',                        beaches: ['UP', 'Northern Michigan'] },
  { name: 'Chert / Flint',         wetClue: 'Dull grey-black conchoidal fracture, glassy',        dryClue: 'Chalky exterior, glassy on fresh break',   beaches: ['Lake Michigan', 'Lake Erie'] },
  { name: 'Carnelian',             wetClue: 'Orange-red translucent, waxy luster',                 dryClue: 'Duller but still warm orange-red',         beaches: ['Lake Superior', 'Grand Marais'] },
  { name: 'Jasper',                wetClue: 'Opaque reds and yellows, waxy surface',               dryClue: 'Colors slightly muted',                    beaches: ['Lake Superior'] },
  { name: 'Obsidian',              wetClue: 'Jet black glassy, conchoidal fracture sharp',        dryClue: 'Mirror-like even dry',                     beaches: ['Rare, glacial transport'] },
  { name: 'Diorite',               wetClue: 'Salt-and-pepper medium grain, dark minerals',         dryClue: 'Grey speckled, coarser than basalt',       beaches: ['All Great Lakes'] },
  { name: 'Gabbro',                wetClue: 'Dark green-black, coarse, heavy',                     dryClue: 'Dark and heavy, less reflective',          beaches: ['Lake Superior'] },
  { name: 'Schist',                wetClue: 'Silvery foliated flakes, micaceous sheen',            dryClue: 'Platy, glittery mica visible',             beaches: ['Lake Superior north shore'] },
  { name: 'Gneiss',                wetClue: 'Banded light/dark alternating layers',                dryClue: 'Banding still clear, wavy pattern',        beaches: ['All Great Lakes'] },
  { name: 'Limestone',             wetClue: 'Light grey, may show fossils when wet',               dryClue: 'Chalky grey, rough surface',               beaches: ['Lake Michigan', 'Lake Huron', 'Lake Erie'] },
  { name: 'Dolomite',              wetClue: 'White-cream, sometimes pink, smooth',                 dryClue: 'White, powdery surface',                   beaches: ['Northern Michigan', 'Door Peninsula'] },
  { name: 'Slag Glass',            wetClue: 'Shiny black or dark green glassy lumps',             dryClue: 'Black glassy, irregular shape',             beaches: ['Leland', 'UP smelter towns'] },
  { name: 'Copper Ore (Conglomerate)', wetClue: 'Dark matrix with copper-red metallic specs',    dryClue: 'Matrix dull, copper spots still visible',  beaches: ['Keweenaw Peninsula'] },
];

/**
 * Get location-based prior — which stones are most likely at this beach/region.
 * Returns an array of { name, boost } objects.
 */
export function getLocationPriors(beachName = '', state = '') {
  if (!beachName && !state) return [];
  const loc = (beachName + ' ' + state).toLowerCase();

  const priors = [];
  for (const stone of GREAT_LAKES_30) {
    const match = stone.beaches.some((b) => loc.includes(b.toLowerCase().split(' ')[0]));
    if (match) priors.push({ name: stone.name, boost: 0.15 });
  }

  // Regional boosts
  if (loc.includes('superior') || loc.includes('keweenaw') || loc.includes('up') || loc.includes('marquette')) {
    ['Lake Superior Agate', 'Native Copper', 'Yooperlite', 'Jacobsville Sandstone', 'Chlorastrolite (Greenstone)']
      .forEach((n) => { if (!priors.find((p) => p.name === n)) priors.push({ name: n, boost: 0.12 }); });
  }
  if (loc.includes('petoskey') || loc.includes('charlevoix') || loc.includes('traverse')) {
    ['Petoskey Stone', 'Charlevoix Stone', 'Leland Blue']
      .forEach((n) => { if (!priors.find((p) => p.name === n)) priors.push({ name: n, boost: 0.12 }); });
  }
  if (loc.includes('michigan') || loc.includes('huron') || loc.includes('erie')) {
    ['Limestone', 'Dolomite', 'Chert / Flint']
      .forEach((n) => { if (!priors.find((p) => p.name === n)) priors.push({ name: n, boost: 0.08 }); });
  }
  return priors;
}

/**
 * Build the Great Lakes constraint block for the AI prompt.
 */
export function buildGreatLakesPromptContext({ beachName, state, wetDry, season, postStorm }) {
  const classList = GREAT_LAKES_30.map((s) => s.name).join(', ');
  const priors = getLocationPriors(beachName, state);
  const priorStr = priors.length
    ? `Boost probability for: ${priors.map((p) => p.name).join(', ')}.`
    : '';

  const wetNote = wetDry === 'wet'
    ? 'Specimen is WET — colors and patterns are more vivid, waxy lusters enhanced. Agate banding, Petoskey coral patterns, and slag glass are most recognizable wet.'
    : wetDry === 'dry'
    ? 'Specimen is DRY — surface may appear chalky or muted. Luster is reduced. Petoskey patterns may be nearly invisible. Adjust confidence down slightly for pattern-dependent IDs.'
    : '';

  const stormNote = postStorm
    ? 'Recent storm conditions: fresh specimens likely freshly exposed. Agates and copper ore more likely to appear. Boost agate, basalt, and copper ore priors.'
    : '';

  const seasonNote = season === 'spring'
    ? 'Spring thaw — prime hunting season. Ice-transported fresh specimens common. All Great Lakes stones in play.'
    : season === 'winter'
    ? 'Winter conditions: cold fingers, glare ice possible. Specimen surfaces may be frosted. Boost confidence interval for pattern stones.'
    : '';

  return [
    `GREAT LAKES REGIONAL SPECIALIST MODE: You are identifying water-worn beach stones from the Great Lakes region.`,
    `CONSTRAIN your ID to this 30-class list: ${classList}.`,
    `Penalize tropical, desert, or globally rare minerals unless visual evidence is overwhelming.`,
    beachName ? `USER LOCATION: ${beachName}${state ? ', ' + state : ''}.` : '',
    priorStr,
    wetNote,
    stormNote,
    seasonNote,
    `WATER-WORN SURFACE NOTE: These specimens are beach-rounded. Ignore facets and terminations as ID criteria. Focus on luster, color pattern, density feel, translucency, and any visible banding or inclusions.`,
    `For each candidate include a one-sentence FIELD CLUE a hunter can verify on the beach without tools.`,
  ].filter(Boolean).join(' ');
}

/**
 * Offline fallback: rule-based classifier for the 30 GL stones.
 * Returns top 3 candidates based on color + luster + condition keywords.
 * Used when network is unavailable.
 */
export function offlineClassify({ colorKeywords = [], luster = '', wetDry = 'dry', beachName = '', state = '' }) {
  const color = colorKeywords.join(' ').toLowerCase();
  const priors = getLocationPriors(beachName, state);

  const scores = GREAT_LAKES_30.map((stone) => {
    let score = 0;
    const clue = (wetDry === 'wet' ? stone.wetClue : stone.dryClue).toLowerCase();

    // Color match
    if (color.includes('red') || color.includes('orange')) {
      if (['Lake Superior Agate', 'Jasper', 'Carnelian', 'Jacobsville Sandstone'].includes(stone.name)) score += 0.3;
    }
    if (color.includes('green')) {
      if (['Chlorastrolite (Greenstone)', 'Prehnite', 'Epidote', 'Leland Blue'].includes(stone.name)) score += 0.3;
    }
    if (color.includes('blue')) {
      if (['Leland Blue'].includes(stone.name)) score += 0.4;
    }
    if (color.includes('black')) {
      if (['Basalt (Lake Superior)', 'Obsidian', 'Slag Glass'].includes(stone.name)) score += 0.3;
    }
    if (color.includes('white') || color.includes('grey') || color.includes('gray')) {
      if (['Petoskey Stone', 'Quartz (milky)', 'Quartzite', 'Limestone'].includes(stone.name)) score += 0.2;
    }
    if (color.includes('copper') || color.includes('metallic')) {
      if (['Native Copper', 'Copper Ore (Conglomerate)'].includes(stone.name)) score += 0.45;
    }
    if (color.includes('pink') || color.includes('purple')) {
      if (['Rhyolite', 'Quartzite', 'Thomsonite'].includes(stone.name)) score += 0.25;
    }

    // Luster match
    if (luster === 'waxy' && clue.includes('waxy')) score += 0.2;
    if (luster === 'glassy' && clue.includes('glassy')) score += 0.2;
    if (luster === 'metallic' && clue.includes('metallic')) score += 0.25;

    // Location prior boost
    const prior = priors.find((p) => p.name === stone.name);
    if (prior) score += prior.boost;

    return { ...stone, score };
  });

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => ({
      name: s.name,
      confidence: Math.min(0.55, s.score),
      field_clue: wetDry === 'wet' ? s.wetClue : s.dryClue,
      offline: true,
    }));
}