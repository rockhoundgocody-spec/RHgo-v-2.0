/**
 * agateData — structured mineralogical data for the Agate Guide page and
 * AI identification prompt enrichment. Sourced from the comprehensive agate
 * treatise (Genesis, Crystallography, Inclusion Geochemistry, Global Taxonomy).
 */

export const AGATE_GENESIS = `Agate forms through low-temperature (<200°C) precipitation of silica from aqueous hydrothermal solutions filling vesicular gas cavities (amygdales) in volcanic lava flows, fault fractures, and dissolution voids in limestone. Monosilicic acid (H₄SiO₄) supersaturates, polymerizes into colloidal silica nanoparticles (2–10 nm), forming a hydrous gel that self-organizes into fibrous chalcedony and crystalline quartz. The iconic banding is governed by Liesegang ring phenomena — a non-equilibrium reaction-diffusion mechanism of periodic mineral precipitation.`;

export const AGATE_TRACE_COLORS = [
  { element: 'Iron (Fe²⁺/Fe³⁺)', colors: 'Reds, oranges, yellows, chocolate browns' },
  { element: 'Manganese (Mn²⁺/Mn⁴⁺)', colors: 'Blacks, purples, dendritic arborizations' },
  { element: 'Chromium (Cr³⁺) / Nickel (Ni²⁺)', colors: 'Vibrant greens' },
  { element: 'Rayleigh scattering', colors: 'Sky-blue and lavender hues' },
];

export const AGATE_OPTICAL = [
  {
    name: 'Iris Agate',
    mechanism: 'Transmission Diffraction',
    description: 'Ultra-fine periodic parallel bands (0.5–1.5 μm spacing) act as a natural transmission diffraction grating, splitting white light into a brilliant rainbow spectrum when a thin polished slice is illuminated.',
  },
  {
    name: 'Fire Agate',
    mechanism: 'Thin-Film Interference',
    description: 'Botryoidal chalcedony domes with microscopic alternating goethite/limonite thin films create iridescence and Schiller effects through constructive and destructive wave interference.',
  },
  {
    name: 'Shadow Agate',
    mechanism: 'Parallax & Optical Depth',
    description: 'Alternating bands of high transparency and dense opacified silica project a 3D optical shadow (chatoyancy) that shifts dynamically as the viewing angle changes.',
  },
];

export const AGATE_STRUCTURAL = [
  {
    category: 'Fortification Agate',
    inclusion: 'Periodic Liesegang diffusion rings',
    features: 'Sharp, concentric, angular polygonal bands mirroring host cavity walls',
    localities: ['Lake Superior (USA)', 'Laguna (Mexico)', 'Fairburn (South Dakota)'],
  },
  {
    category: 'Plume Agate',
    inclusion: '3D iron/manganese oxides, marcasite, clay',
    features: 'Feather-like, cloud-like, or shrub-like suspended mineral inclusions',
    localities: ['Graveyard Point (OR/ID)', 'Woodward Ranch (Texas)', 'Java (Indonesia)'],
  },
  {
    category: 'Sagenite Agate',
    inclusion: 'Acicular needle sprays (goethite, rutile, aragonite)',
    features: 'Radiating, needle-like mineral sprays embedded in translucent chalcedony',
    localities: ['Nipomo (California)', 'Texas Trans-Pecos', 'Bulgaria'],
  },
  {
    category: 'Dendritic / Moss Agate',
    inclusion: 'Chlorite, celadonite, hornblende, pyrolusite',
    features: 'Branching 3D moss-like foliage or arborized tree structures',
    localities: ['Montana (Yellowstone River)', 'Deccan Traps (India)'],
  },
  {
    category: 'Enhydro Agate',
    inclusion: 'Hydrothermal encapsulation of groundwater',
    features: 'Trapped liquid inclusions and mobile air bubbles within sealed cavities',
    localities: ['Rio Grande do Sul (Brazil)', 'Uruguay', 'Indonesia'],
  },
  {
    category: 'Pseudomorphic Agate',
    inclusion: 'Silica replacement of pre-existing mineral crystals',
    features: 'Agate preserving external crystal geometry of aragonite, anhydrite, or calcite',
    localities: ['Coyamito (Mexico)', 'Turkish Stick Agate (Ankara)'],
  },
  {
    category: 'Fossil Agatization',
    inclusion: 'Silica replacement of organic tissue',
    features: 'Silicified biological structures — gastropod shells, ancient wood tissue',
    localities: ['Green River (Elimia tenera)', 'Blue Forest Petrified Wood'],
  },
  {
    category: 'Polyhedroid Agate',
    inclusion: 'Growth constrained by intersecting volcanic crystal faces',
    features: 'Flat-faced, geometric multi-sided angular nodules (triangles, polygons)',
    localities: ['Paraíba / Rio Grande do Sul (Brazil)'],
  },
];

export const AGATE_VARIETIES = [
  {
    name: 'Lake Superior Agate',
    region: 'North America',
    rarity: 'uncommon',
    age: '~1.1 billion years (Mesoproterozoic)',
    setting: 'Midcontinent Rift System basalts; glacial drift spread across MN, MI, WI, IA, IL',
    characteristics: 'Dense, razor-sharp fortification banding in brick-red, orange, and carnelian hues from oxidized iron (hematite, goethite). Rare Copper Replacement Agates from the Keweenaw Peninsula feature native metallic copper replacing silica bands.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Agate_nodule_%28%22Lake_Superior_Agate%22%29_%28floor_of_Lake_Superior%2C_offshore_Keweenaw_Peninsula%2C_Michigan_USA%29_2_%2833741645898%29.jpg',
  },
  {
    name: 'Fairburn Agate',
    region: 'North America',
    rarity: 'rare',
    age: 'Pennsylvanian-Permian (Minnelusa Formation)',
    setting: 'Black Hills uplift, SD; alluvial gravels across SD, NE, WY',
    characteristics: 'Official state gemstone of South Dakota. Needle-point "holly leaf" fortification patterns with extreme color contrast — vivid crimson red, salmon pink, bright yellow, cream, and dark brown within a chert matrix rind.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Fairburn_Agate_%28ultimately_derived_from_the_Minnelusa_Formation%2C_Pennsylvanian-Permian%3B_collected_east_of_the_Black_Hills%2C_western_South_Dakota%2C_USA%29_32_%2844632240655%29.jpg',
  },
  {
    name: 'Montana Moss Agate',
    region: 'North America',
    rarity: 'uncommon',
    age: '~50 Ma (Eocene)',
    setting: 'Challis/Absaroka volcanic field; Yellowstone River basin, MT & ND',
    characteristics: 'Highly translucent to clear chalcedony lacking fortification lines, filled with dramatic 3D black manganese dioxide and reddish-brown iron oxide dendrites forming natural landscape, tree, and foliage motifs.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Montana_Moss_Agate.jpg',
  },
  {
    name: 'Ellensburg Blue Agate',
    region: 'North America',
    rarity: 'legendary',
    age: '~47–50 Ma (Eocene Teanaway Basalt)',
    setting: 'Kittitas County, Central Washington; Ellensburg Formation',
    characteristics: 'Extremely rare gem-grade chalcedony. Sky-blue to royal-blue hue from Rayleigh scattering through microscopic colloidal silica particles. Higher density and hardness (up to 7.5 Mohs) than standard agates.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Ellensburg_Blue_agate.jpg',
  },
  {
    name: 'Coyamito Agate',
    region: 'North America',
    rarity: 'rare',
    age: 'Tertiary',
    setting: 'Rancho Coyamito, Chihuahua, Mexico; rhyolitic/andesitic ash-flow tuffs',
    characteristics: 'Ultra-fine fortification banding in vivid magenta, hot pink, yellow, and deep purple. Renowned for spectacular pseudomorphs where silica replaced radiating aragonite, calcite, or barite crystal sprays, preserving acicular geometry.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/CoyamitosAgatesFromMexico.jpg',
  },
  {
    name: 'Nipomo Plume Agate',
    region: 'North America',
    rarity: 'rare',
    age: 'Miocene',
    setting: 'Nipomo, San Luis Obispo County, California; volcanic rhyolites',
    characteristics: 'Brilliant metallic golden and silver plumes of marcasite and pyrite suspended in clear to gray chalcedony. One of the most distinctive plume agates in the world.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Oregon001.jpg',
  },
  {
    name: 'Mojave Plume Agate',
    region: 'North America',
    rarity: 'uncommon',
    age: 'Miocene',
    setting: 'Mojave Desert, California; volcanic basalts and rhyolites',
    characteristics: 'Soft lavender or clear matrix containing fluffy feather-like plumes of pink, red, and orange iron oxides. Distinct from Nipomo by its softer, warmer plume colors.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Richardson_Ranch_Thunder_Egg_with_Plume_from_Plume_Beds%2C_Richardson_Ranch%2C_Madras%2C_Oregon_detail%2C_from-_Oregon001_%28cropped%29.jpg',
  },
  {
    name: 'Dryhead Agate',
    region: 'North America',
    rarity: 'uncommon',
    age: 'Mississippian–Pennsylvanian',
    setting: 'Pryor/Bighorn Mountains, south-central Montana; Madison Limestone & Minnelusa Formation',
    characteristics: 'Thick dark chocolate-brown or reddish-brown outer rind enclosing vibrant orange, brick-red, mustard-yellow, and pink fortification bands. Displays brilliant neon-green shortwave UV fluorescence due to trace uranium.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Agate-_%26_quartz-lined_geode_%28Dryhead%2C_Montana%2C_USA%29_3_%2831971016393%29.jpg',
  },
  {
    name: 'Iris Agate',
    region: 'Optical Variety',
    rarity: 'rare',
    age: 'Varies',
    setting: 'Worldwide; requires ultra-fine periodic banding',
    characteristics: 'When sliced thin and illuminated with white light, the micro-bands (0.5–1.5 μm) act as a natural diffraction grating, splitting light into a brilliant rainbow spectrum. The effect is only visible with proper slicing and backlighting.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Malawi_Agate_%28Malawi%2C_southeastern_Africa%29_%2832734668126%29.jpg',
  },
  {
    name: 'Fire Agate',
    region: 'Optical Variety',
    rarity: 'uncommon',
    age: 'Varies',
    setting: 'Southwestern USA (Arizona, California), Mexico',
    characteristics: 'Botryoidal chalcedony domes with microscopic alternating layers of goethite and limonite thin films. Iridescent Schiller effect — flashes of red, orange, green, and gold that shift with viewing angle.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/High_Grade_Slaughter_Mountain_Arizona_Fire_Agate_Rough.jpg',
  },
  {
    name: 'Shadow (Parallax) Agate',
    region: 'Optical Variety',
    rarity: 'uncommon',
    age: 'Varies',
    setting: 'Worldwide; requires alternating transparent/opaque banding',
    characteristics: 'Alternating bands of high transparency and dense opacified silica create a 3D optical shadow (chatoyancy) that shifts dynamically across the stone as the viewing angle changes — giving the illusion of depth and movement.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Agate-180670.jpg',
  },
  {
    name: 'Enhydro Agate',
    region: 'Structural Variety',
    rarity: 'rare',
    age: 'Varies',
    setting: 'Brazil, Uruguay, Indonesia',
    characteristics: 'Contains trapped liquid inclusions and mobile air bubbles within sealed cavities — ancient groundwater encapsulated during silica precipitation. Shaking the stone can make the bubble move visibly.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Enhydros.jpg',
  },
  {
    name: 'Blue Lace Agate',
    region: 'Africa',
    rarity: 'uncommon',
    age: 'Jurassic',
    setting: 'Ysterputz Mine, Namibia; also Malawi, Kenya, Turkey, Georgia, Zambia',
    characteristics: 'Delicate pale blue and white lace-like banding in swirling, convoluted patterns. One of the most popular ornamental agates, prized for its soft, calming color palette and intricate vein-style banding.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Blue_Lace_Agate.jpg',
  },
  {
    name: 'Botswana Agate',
    region: 'Africa',
    rarity: 'uncommon',
    age: 'Permian (Karoo Series)',
    setting: 'Bobonong, Botswana; volcanic basalts',
    characteristics: 'Small nodules (2.5–5cm) with extraordinarily fine, tightly packed contrasting bands of purple, pink, black, grey, and white. Renowned for subtle, elegant color layering and occasional "eye" formations.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Agat_-_Bobonong%2C_Botswana.jpg',
  },
  {
    name: 'Crazy Lace Agate',
    region: 'North America',
    rarity: 'common',
    age: 'Late Cretaceous',
    setting: 'Chihuahua, Mexico; sedimentary deposits',
    characteristics: 'Chaotic, twisting "lace-like" patterns in bright white, red, yellow, and grey. Also called "Laughter Stone" or "Mexican Lace Agate." Its wildly convoluted, decorative banding makes each piece entirely unique.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Crazy_Lace_Agate_-_Macro_Panorama.jpg',
  },
  {
    name: 'Brazilian Agate',
    region: 'South America',
    rarity: 'common',
    age: 'Late Permian',
    setting: 'Rio Grande do Sul, Brazil; decomposed volcanic ash and basalt',
    characteristics: 'Often massive nodules up to 0.9m diameter. Natural specimens are pale yellow, gray, or colorless with fine concentric banding. Widely commercially dyed in bright colors — natural specimens have subtle, high-quality banding.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Brazilian_agate_section_%28detail%29_%28cropped%29.JPG',
  },
  {
    name: 'Condor Agate',
    region: 'South America',
    rarity: 'rare',
    age: 'Tertiary',
    setting: 'Mendoza Province, Argentina',
    characteristics: 'Bright red and yellow fortification banding with exceptional color saturation. May contain mossy or sagenitic inclusions. One of the most sought-after Argentine agates for its vivid, warm color palette.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Argentina001_%28cropped%29.jpg',
  },
  {
    name: 'Dugway Geode',
    region: 'North America',
    rarity: 'uncommon',
    age: 'Tertiary',
    setting: 'Juab County, Utah, USA; volcanic geode beds',
    characteristics: 'Light grey to blue chalcedony nodules (thunder eggs) often containing hollow cavities lined with sparkling drusy quartz crystals. Popular for collecting as the geodes can be cracked open to reveal crystal-lined interiors.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Dugway_Geode_%28Juab_County%2C_Utah%2C_USA%29_2_%2834581522545%29.jpg',
  },
  {
    name: 'Priday Blue Bed Thunder Egg',
    region: 'North America',
    rarity: 'uncommon',
    age: 'Miocene (John Day Formation)',
    setting: 'Richardson Ranch, near Madras, Oregon, USA; rhyolitic volcanic ash',
    characteristics: 'Blue and white level-banded agate filling thunder egg nodules with a dark brown shell. The famous "Blue Bed" at Pony Butte produces distinctive blue-tinted agate sought by collectors worldwide.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Thunder_Egg_Agate_%28Priday_Blue_Bed%2C_John_Day_Formation%2C_Miocene%3B_near_Madras%2C_Oregon%2C_USA%29_3_%2833992544563%29.jpg',
  },
  {
    name: 'Antarctica Agate',
    region: 'Antarctica',
    rarity: 'rare',
    age: 'Tertiary',
    setting: 'King George Island, South Shetland Islands, Antarctica',
    characteristics: 'White and clear banded nodular agate from one of the most remote localities on Earth. Collected near Bellingshausen Station. Extremely rare due to the inaccessibility of the source.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Agate_%28Tertiary%3B_Agate_Bay%2C_King_George_Island%2C_South_Shetland_Islands%29_1.jpg',
  },
  {
    name: 'Sagenitic Agate',
    region: 'Structural Variety',
    rarity: 'uncommon',
    age: 'Varies',
    setting: 'Worldwide; notable in Brazil, Nipomo CA, Texas Trans-Pecos, Bulgaria',
    characteristics: 'Contains acicular (needle-shaped) mineral inclusions — anhydrite, aragonite, goethite, rutile, or zeolite — that form radiating needle sprays within translucent chalcedony. Chalcedony often forms tubes around these crystals, sometimes replacing the original mineral as a pseudomorph.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Agate_Rio_Grande_do_Sul_Caillois_Donation_MNHN_n24.jpg',
  },
  {
    name: 'Dendritic Agate',
    region: 'Structural Variety',
    rarity: 'uncommon',
    age: 'Varies',
    setting: 'Worldwide; notable in India, Brazil, USA, Kazakhstan',
    characteristics: 'Features dark-colored, fern-patterned or tree-like inclusions (dendrites) of manganese oxides or iron oxides on agate surfaces or between bands. Despite plant-like appearance, the dendrites are entirely mineral — a fractal growth pattern of oxide crystallization.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Dendritic_agate_6.jpg',
  },
  {
    name: 'Laguna Agate',
    region: 'North America',
    rarity: 'rare',
    age: 'Tertiary',
    setting: 'Ojo Laguna, Chihuahua, Mexico; rhyolitic ash-flow tuffs',
    characteristics: 'Considered one of the finest agates in the world. Exceptionally tight, vivid fortification banding in scarlet red, orange, yellow, pink, and purple. Known for "strawberry" color zones and incredible band count — up to 50+ bands per centimeter.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/03/LagunaAgateFromMexico_%28cropped%29.jpg',
  },
  {
    name: 'Turritella Agate',
    region: 'North America',
    rarity: 'uncommon',
    age: 'Eocene (Green River Formation)',
    setting: 'Wyoming, USA; lacustrine fossiliferous limestone',
    characteristics: 'Dark chert packed with fossilized freshwater gastropod shells (Elimia tenera, misidentified as Turritella). The snail shells are silicified — replaced by chalcedony — creating a distinctive dark matrix with light spiral fossils throughout. A fossil agatization variety.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Elimia_fossils_Wyoming.jpg',
  },
];

// ── AI Prompt Enrichment Block ─────────────────────────────────────────────
// Concise subtypology the LLM uses to identify specific agate varieties
// rather than just returning "agate". Folded into the scan identification prompt.
export const AGATE_PROMPT_BLOCK = `AGATE SUBTYPOLOGY: When the specimen is an agate or chalcedony, identify the SPECIFIC variety — not just "agate." Key varieties and their diagnostic features:
- Lake Superior Agate: razor-sharp fortification banding, brick-red/orange/carnelian, water-worn, Great Lakes region.
- Fairburn Agate: needle-point "holly leaf" fortification, extreme color contrast (crimson/pink/yellow/cream), chert rind, Black Hills SD.
- Montana Moss Agate: clear/translucent chalcedony, black MnO₂ + reddish Fe-oxide dendrites forming landscape/foliage motifs, Yellowstone River MT.
- Ellensburg Blue: sky-blue to royal-blue, Rayleigh scattering, high hardness (7.5), Central Washington. Very rare.
- Coyamito Agate: ultra-fine fortification in magenta/pink/yellow/purple, pseudomorphs of aragonite/calcite sprays, Chihuahua Mexico.
- Fire Agate: botryoidal habit, iridescent thin-film goethite/limonite layers, Schiller effect, SW USA/Mexico.
- Iris Agate: ultra-fine periodic banding that diffracts light into rainbow spectrum when backlit.
- Plume Agate: 3D feather/cloud/shrub inclusions of iron/manganese oxides or marcasite.
- Sagenite Agate: radiating needle sprays (goethite, rutile, aragonite) in translucent chalcedony.
- Dendritic/Moss Agate: branching moss-like or tree-like inclusions (chlorite, celadonite, pyrolusite).
- Enhydro Agate: trapped liquid + mobile air bubbles in sealed cavities.
- Pseudomorphic Agate: silica preserving external crystal geometry of replaced aragonite, anhydrite, or calcite.
- Polyhedroid Agate: flat-faced geometric multi-sided nodules constrained by volcanic crystal faces.
- Shadow/Parallax Agate: alternating transparent and opaque bands creating 3D chatoyant shadow effect.
- Blue Lace Agate: pale blue and white delicate lace-like swirling banding, Namibia.
- Botswana Agate: small nodules, fine tightly packed purple/pink/black/grey/white bands, Botswana.
- Crazy Lace Agate: chaotic twisting lace patterns in white/red/yellow/grey, Mexico.
- Brazilian Agate: large nodules, pale yellow/gray/colorless fine concentric banding (often dyed commercially), Brazil.
- Condor Agate: bright red and yellow fortification banding, sometimes mossy/sagenitic inclusions, Argentina.
- Dugway Geode: light grey/blue thunder eggs with hollow drusy quartz cavities, Utah USA.
- Priday Blue Bed Thunder Egg: blue and white level-banded agate in dark brown shell, Oregon USA.
- Laguna Agate: ultra-tight vivid fortification banding (50+ bands/cm) in scarlet/orange/yellow/pink/purple, Chihuahua Mexico.
- Turritella Agate: dark chert packed with silicified freshwater gastropod fossils (Elimia tenera), Wyoming USA.
- Dendritic Agate: fern/tree-like manganese or iron oxide dendrites on or between bands, worldwide.
- Sagenitic Agate: radiating needle sprays (goethite, rutile, aragonite, anhydrite) in translucent chalcedony.
Use the banding pattern, inclusion type, color spectrum, and locality to determine the variety.`;
