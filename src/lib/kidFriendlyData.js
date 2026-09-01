/**
 * kidFriendlyData.js — Translates complex geology into exciting, kid-friendly
 * superpowers, dinosaur ages, and detective secrets for Junior Explorers.
 */

export const KID_MINERAL_DATA = {
  agate: {
    superpower: '🛡️ Diamond-Tough Armor',
    power_desc: 'Super hard! A steel sword or knife cannot even scratch it!',
    age_badge: '🌋 1 Billion Years Old (Born in bubbling volcano lava!)',
    detective_secret: 'Hold it up to the sun to see glowing red and orange tiger stripes!',
    fun_name: 'Volcano Bubble Tiger Stone',
    trophy: '⭐⭐⭐⭐ Rare Lava Treasure',
  },
  'lake superior agate': {
    superpower: '🛡️ Iron-Fortified Shell',
    power_desc: 'One of the toughest rocks on Earth! Scratches steel and glass easily.',
    age_badge: '🌋 1.1 Billion Years Old (Older than any dinosaur!)',
    detective_secret: 'Look for the waxy smooth feeling and peeling circular "eyes" along the beach!',
    fun_name: 'Superior Volcano Agate',
    trophy: '⭐⭐⭐⭐⭐ Legendary Beach Jewel',
  },
  yooperlite: {
    superpower: '✨ Secret Dark-Glow Magic',
    power_desc: 'Looks like a regular gray stone by day, but explodes into glowing molten lava under a blacklight!',
    age_badge: '☄️ 1 Billion Years Old (Flown here by giant ice sheets!)',
    detective_secret: 'Bring a 365nm UV blacklight to the beach at night and watch it glow bright fiery orange!',
    fun_name: 'Glow-in-the-Dark Lava Rock',
    trophy: '⭐⭐⭐⭐⭐ Ultra Rare Magic Rock',
  },
  'petoskey stone': {
    superpower: '🪸 Ancient Sea Monster Fossil',
    power_desc: 'Not a plain rock — this is the fossilized skeleton of an ancient coral reef that lived underwater!',
    age_badge: '🦕 350 Million Years Old (Way before the first T-Rex walked the Earth!)',
    detective_secret: 'Wet it with a drop of water or spit to watch the hidden honeycomb eyes magically appear!',
    fun_name: 'Prehistoric Coral Eye Stone',
    trophy: '⭐⭐⭐⭐ Ancient Ocean Fossil',
  },
  calcite: {
    superpower: '🔮 Double Vision Rainbow Maker',
    power_desc: 'Clear crystals can split light in two, making words look double! Plus it fizzes when it touches vinegar!',
    age_badge: '🌊 Ancient Sea Bed Crystal',
    detective_secret: 'Drop a tiny drop of lemon juice or vinegar on it and listen closely for tiny bubbles fizzing!',
    fun_name: 'Fizzy Double-Vision Crystal',
    trophy: '⭐⭐⭐ Fizzy Science Wonder',
  },
  fluorite: {
    superpower: '💜 Alien Neon Glow',
    power_desc: 'Glows electric purple and blue in blacklight, and naturally grows in perfect 3D cubes like Minecraft!',
    age_badge: '💎 Underground Crystal Cave Jewel',
    detective_secret: 'Look closely at the square corners — Mother Nature grew this crystal like building blocks!',
    fun_name: 'Minecraft Neon Cube Gem',
    trophy: '⭐⭐⭐⭐ Neon Cave Treasure',
  },
  amethyst: {
    superpower: '👑 Royal Dragon Purple Shield',
    power_desc: 'Super hard quartz infused with iron that turned into a dazzling royal violet color!',
    age_badge: '🌋 Hollow Lava Geode Treasure',
    detective_secret: 'Formed inside hollow gas bubbles in cooling lava. Shake geodes to hear if crystals are loose inside!',
    fun_name: 'Royal Purple Geode Crystal',
    trophy: '⭐⭐⭐⭐ Royal Dragon Gem',
  },
  pyrite: {
    superpower: '⚡ Fire-Spark Fool\'s Gold',
    power_desc: 'Looks just like real gold, but strike it with steel and it throws real sparks to start campfires!',
    age_badge: '⛏️ Ancient Earth Fire Mineral',
    detective_secret: 'Gold is soft and bends, but Pyrite is brittle and makes sparks when tapped with a hammer!',
    fun_name: 'Spark-Maker Gold Star',
    trophy: '⭐⭐⭐ Fire-Spark Golden Cube',
  },
};

export function getKidFriendlyMineral(mineralName) {
  if (!mineralName) return null;
  const name = mineralName.toLowerCase();

  for (const key of Object.keys(KID_MINERAL_DATA)) {
    if (name.includes(key) || key.includes(name)) {
      return KID_MINERAL_DATA[key];
    }
  }

  // Generic fallback for other minerals
  return {
    superpower: '⚡ Earth Wonder Superpower',
    power_desc: 'Forged deep inside the planet over millions of years of heat and pressure!',
    age_badge: '🦕 Millions of Years Old (Ancient prehistoric Earth!)',
    detective_secret: 'Inspect with a magnifying glass to find hidden crystal faces and sparkle lines!',
    fun_name: `${mineralName} Explorer Specimen`,
    trophy: '⭐⭐⭐ Earth Science Find',
  };
}
