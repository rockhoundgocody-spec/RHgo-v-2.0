/**
 * seedHotspots.js — Verified, High-Yield, Family-Friendly Rockhounding Hotspots.
 *
 * Pre-seeded hotspots covering North America with high-confidence public/fee access,
 * parking notes, kid-friendly ratings, and seasonal hunting strategies.
 */

export const SEED_HOTSPOTS = [
  // ── Great Lakes & Midwest ──────────────────────────────────────────────────
  {
    id: 'seed-duluth-park-point',
    name: 'Park Point Beach (Duluth, MN)',
    lat: 46.7725,
    lng: -92.0833,
    land_type: 'public',
    minerals: ['Lake Superior Agate', 'Banded Chert', 'Basalt', 'Epidote'],
    difficulty: 'easy',
    trust_score: 0.98,
    rules: 'Public city beach. Surface hand-collecting permitted. No mechanical digging.',
    description: 'A 7-mile freshwater sand and shingle spit. Outstanding agate hunting along the surf swash line, especially after northeast gale-force waves turn over the gravel.',
    family_tips: 'Kid-friendly, paved parking at Park Point Beach House, playground and public restrooms nearby.',
  },
  {
    id: 'seed-beaver-bay-beach',
    name: 'Beaver Bay Shingle Beach (MN)',
    lat: 47.2575,
    lng: -91.2986,
    land_type: 'public',
    minerals: ['Lake Superior Agate', 'Thomsonite', 'Prehnite', 'Chlorastrolite'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'Public North Shore access. Hand-collecting pebbles along the shoreline allowed.',
    description: 'Renowned rocky shoreline where volcanic Keweenawan basalts wash out banded agates and zeolites.',
    family_tips: 'Smooth flat stones make great skipping stones; wearable water shoes or sneakers recommended.',
  },
  {
    id: 'seed-petoskey-state-park',
    name: 'Petoskey State Park (Little Traverse Bay, MI)',
    lat: 45.4056,
    lng: -84.9125,
    land_type: 'state_park',
    minerals: ['Petoskey Stone', 'Favosites (Charlevoix Stone)', 'Calcite'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'Michigan state park. Limit of 25 lbs per person per year. Surface gathering only.',
    description: 'The premier location for collecting authentic Devonian fossil coral hexagonaria (Petoskey Stone). Look for stones that are wet in the surf to see the starburst coral pattern clearly.',
    family_tips: 'Wonderful sandy beaches with dunes, picnic pavilions, restrooms, and family-friendly swimming.',
  },
  {
    id: 'seed-crisp-point-yooperlite',
    name: 'Crisp Point Light Beach (Lake Superior, MI)',
    lat: 46.7533,
    lng: -85.2581,
    land_type: 'public',
    minerals: ['Yooperlite (Fluorescent Sodalite Syenite)', 'Lake Superior Agate', 'Jasper'],
    difficulty: 'moderate',
    trust_score: 0.97,
    rules: 'Public beach. Bring 365nm longwave UV flashlights for night hunting.',
    description: 'Remote, pristine Lake Superior shoreline. At night under UV light, glacial syenite pebbles glow fire-orange like burning embers!',
    family_tips: 'Night hunting under the stars is unforgettable for kids. Bring UV safety glasses and warm jackets.',
  },
  {
    id: 'seed-keokuk-geodes',
    name: 'Keokuk Geode Beds (Des Moines River, IA/MO)',
    lat: 40.4042,
    lng: -91.3855,
    land_type: 'public',
    minerals: ['Quartz Geode', 'Chalcedony', 'Pyrite', 'Calcite'],
    difficulty: 'moderate',
    trust_score: 0.96,
    rules: 'Public creek gravel bars and pay-quarries available. Always check landowner boundaries.',
    description: 'World-famous Mississippian Warsaw Formation geodes filled with sparkling quartz crystals and calcite scalenohedrons.',
    family_tips: 'Bring safety goggles and a crack-hammer; kids love the surprise of breaking open their first sparkling geode!',
  },

  // ── Northeast & Mid-Atlantic ────────────────────────────────────────────────
  {
    id: 'seed-herkimer-diamond-mines',
    name: 'Herkimer Diamond Mines (Middleville, NY)',
    lat: 43.1417,
    lng: -74.9669,
    land_type: 'public',
    minerals: ['Herkimer Diamond (Doubly Terminated Quartz)', 'Anthraxolite', 'Dolomite'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'Commercial pay-to-dig quarry and tailings sluicing. You keep everything you find.',
    description: 'Famous 500-million-year-old Cambrian Little Falls Dolostone producing naturally faceted, crystal-clear doubly terminated quartz crystals.',
    family_tips: 'Has shaded gemstone sluicing tables for younger children, museum, gift shop, and equipment rentals.',
  },
  {
    id: 'seed-st-clair-fern-fossils',
    name: 'St. Clair Carboniferous Fern Beds (PA)',
    lat: 40.7189,
    lng: -76.1953,
    land_type: 'public',
    minerals: ['Pyrophyllite White Fern Fossils', 'Anthracite', 'Pecopteris'],
    difficulty: 'moderate',
    trust_score: 0.95,
    rules: 'Old abandoned coal strip mine tailings. Wear sturdy boots and safety glasses.',
    description: 'Unique Pennsylvanian-age black shale split open to reveal stunning snow-white fossil ferns coated in white pyrophyllite.',
    family_tips: 'Fossils split easily with a butter knife or light hammer; kids can quickly find museum-grade leaf imprints.',
  },

  // ── Southeast & Appalachia ──────────────────────────────────────────────────
  {
    id: 'seed-crater-of-diamonds',
    name: 'Crater of Diamonds State Park (Murfreesboro, AR)',
    lat: 34.0333,
    lng: -93.6706,
    land_type: 'state_park',
    minerals: ['Diamond', 'Amethyst', 'Jasper', 'Agate', 'Peridot'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'State Park fee site. 37-acre plowed field over a volcanic lamproite pipe. You keep all diamonds found!',
    description: 'The only public diamond-bearing site in the world where visitors can search for real diamonds in their original volcanic matrix.',
    family_tips: 'Water park on site in summer, diamond identification lab that certifies finds with official registration.',
  },
  {
    id: 'seed-emerald-hollow-mine',
    name: 'Emerald Hollow Mine (Hiddenite, NC)',
    lat: 35.9189,
    lng: -81.0808,
    land_type: 'public',
    minerals: ['Emerald', 'Hiddenite (Spodumene)', 'Aquamarine', 'Rutile', 'Garnet'],
    difficulty: 'easy',
    trust_score: 0.98,
    rules: 'Public pay-to-prospect mine. Sluice tables, creek prospecting, and open dig areas.',
    description: 'The only emerald mine in North America open to the public for prospecting, producing deep green beryl and rare hiddenite.',
    family_tips: 'Very family-friendly with seated sluicing troughs, staff instructors, and creek prospecting.',
  },
  {
    id: 'seed-graves-mountain',
    name: 'Graves Mountain (Lincolnton, GA)',
    lat: 33.7431,
    lng: -82.5186,
    land_type: 'public',
    minerals: ['Rutile', 'Iridescent Hematite', 'Lazulite', 'Pyrophyllite'],
    difficulty: 'moderate',
    trust_score: 0.97,
    rules: 'Open during spring and fall Rock Swap & Dig days. Check Georgia Mineral Society schedule.',
    description: 'World-renowned geological locality featuring lustrous metallic rutile crystals and rainbow-colored iridescent hematite.',
    family_tips: 'Spectacular colors on hematite that shine like gasoline rainbows in the sunlight.',
  },

  // ── West & Mountain States ──────────────────────────────────────────────────
  {
    id: 'seed-topaz-mountain',
    name: 'Topaz Mountain (Thomas Range, UT)',
    lat: 39.7128,
    lng: -113.1039,
    land_type: 'blm',
    minerals: ['Sherry Topaz', 'Bixbyite', 'Pseudobrookite', 'Red Beryl'],
    difficulty: 'moderate',
    trust_score: 0.98,
    rules: 'Free public BLM land. Open collecting with hand tools.',
    description: 'Chalky white volcanic rhyolite containing pockets of gem-quality amber-gold topaz crystals that sparkle in sunlight.',
    family_tips: 'Topaz crystals weather out of the rhyolite and lie right on the sandy washes where kids can spot them easily.',
  },
  {
    id: 'seed-crystal-park-montana',
    name: 'Crystal Park (Pioneer Mountains, MT)',
    lat: 45.4975,
    lng: -113.0972,
    land_type: 'forest_service',
    minerals: ['Quartz Crystal', 'Smoky Quartz', 'Amethyst'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'US Forest Service recreation area ($5 day-use fee). Hand digging with trowels and screens.',
    description: 'High-elevation decomposed granite park filled with hexagonal quartz crystal prisms, smoky quartz, and pale amethyst.',
    family_tips: 'Picnic tables, paved trails, and clean restrooms make this an idyllic mountain family outing.',
  },
  {
    id: 'seed-oregon-sunstone-area',
    name: 'Oregon Sunstone Public Collection Area (Plush, OR)',
    lat: 42.7214,
    lng: -119.8822,
    land_type: 'blm',
    minerals: ['Oregon Sunstone (Labradorite Feldspar)', 'Copper Schiller Sunstone'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'Free BLM public collecting area. 4 square miles reserved for hobby collecting.',
    description: 'Basalt flows weathered into desert soil packed with transparent champagne, salmon, and copper-schiller feldspar crystals.',
    family_tips: 'Surface crawling: children often find the biggest sunstones because their eyes are closer to the ground.',
  },
  {
    id: 'seed-glass-buttes-obsidian',
    name: 'Glass Buttes (High Desert, OR)',
    lat: 43.5594,
    lng: -120.0617,
    land_type: 'blm',
    minerals: ['Rainbow Obsidian', 'Mahogany Obsidian', 'Midnight Lace Obsidian', 'Fire Obsidian'],
    difficulty: 'moderate',
    trust_score: 0.98,
    rules: 'Free BLM collecting. Limit of 250 lbs per person per year.',
    description: 'A massive volcanic obsidian dome producing iridescent rainbow, gold sheen, and mahogany volcanic glass.',
    family_tips: 'Kids marvel at the glassy sheen. Leather gloves and safety glasses are recommended for handling sharp edges.',
  },
  {
    id: 'seed-rockhound-state-park',
    name: 'Rockhound State Park (Deming, NM)',
    lat: 32.1869,
    lng: -107.6167,
    land_type: 'state_park',
    minerals: ['Thundereggs', 'Agate', 'Jasper', 'Rhyolite Geodes', 'Perlite'],
    difficulty: 'easy',
    trust_score: 0.99,
    rules: 'First state park established specifically to allow rock collecting! Up to 15 lbs per person allowed.',
    description: 'Rugged volcanic Little Florida Mountains packed with spherical thundereggs and chalcedony nodules.',
    family_tips: 'Campgrounds, visitor center with geode displays, well-marked family trails, and playground.',
  },
];

/**
 * Returns merged hotspots prioritizing user/backend database records while ensuring
 * all geographic seed hotspots exist so the map is never empty.
 */
export function getAugmentedHotspots(liveHotspots = []) {
  if (!liveHotspots || liveHotspots.length === 0) {
    return SEED_HOTSPOTS;
  }

  const liveNames = new Set(liveHotspots.map(h => (h.name || '').toLowerCase().trim()));
  const missingSeeds = SEED_HOTSPOTS.filter(s => !liveNames.has(s.name.toLowerCase().trim()));

  return [...liveHotspots, ...missingSeeds];
}
